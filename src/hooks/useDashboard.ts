"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Brain, Users, Dumbbell, Sun, Pencil, BookOpen, Brush, Sparkles } from 'lucide-react';
import { TimerEvent, TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getTaskRemainingSeconds, getTodayDateAtTime } from '@/lib/timeUtils';
import { getTodayId } from '@/lib/supabase'; // Helper from Phase 2
import * as api from '@/lib/dashboardService'; // The service we just wrote

// --- CONFIG ---
const DEBUG_TIME = null; 

// Initial Mock Data (Only used if "Start Day" hasn't happened)
const INITIAL_SCHEDULE: TaskItem[] = []; // Start Empty!
const INITIAL_DAILY: TaskItem[] = [];

interface ModalConfig {
  isOpen: boolean; mode: 'add' | 'edit'; type: 'schedule' | 'daily';
  initialData?: Partial<TaskItem>; insertIndex?: number; minTime?: string; maxTime?: string;
}

export function useDashboard() {
  // --- STATE ---
  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('sleeping');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [hasSchedule, setHasSchedule] = useState(true); 
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>(INITIAL_SCHEDULE);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>(INITIAL_DAILY);
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);
  
  // UI State
  const [modalConfig, setModalConfig] = useState<ModalConfig>({ isOpen: false, mode: 'add', type: 'schedule' });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);

  // --- HELPERS ---
  const getNow = () => {
    const now = new Date();
    if (DEBUG_TIME) {
      const [h, m] = DEBUG_TIME.split(':').map(Number);
      now.setHours(h, m, 0, 0);
    }
    return now;
  };
  
  const isTimeInPast = (timeStr: string) => { /* ... existing logic ... */ 
      if (!timeStr) return false;
      const now = getNow();
      const timeDate = getTodayDateAtTime(timeStr);
      timeDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      return timeDate <= now;
  };

  // --- INIT: LOAD FROM SUPABASE ---
  useEffect(() => {
    const loadFromDB = async () => {
      const userId = await api.getUserId();
      const todayId = getTodayId(userId);
      const data = await api.fetchDayData(todayId);

      if (data) {
        console.log("Loaded day from Supabase");
        setDayStatus(data.status as any);
        setCheckInTime(data.checkInTime);
        setScheduleTasks(data.scheduleTasks);
        setDailyActions(data.dailyActions);
        setTimerEvents(data.timerEvents as any);
      } else {
        console.log("No day in Supabase, ready to start.");
        setDayStatus('sleeping');
      }
    };
    loadFromDB();
  }, []);

  // --- DERIVED STATE ---
  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  const totalVolumeSeconds = scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) + dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- TIMER ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNow();
      
      // 1. Tick
      if (activeTask) {
        const updater = (list: TaskItem[]) => list.map(t => t.id === activeTask.id ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
        if (activeTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
        
        // Note: We do NOT sync to DB here to save performance
      }

      // 2. Flex Cap Calc
      if (dayStatus === 'active') {
         // ... (existing logic) ...
         const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
         const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
         const timeLeft = (24 * 3600) - secondsSinceMidnight;
         const remainingSchedule = scheduleTasks.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);
         const remainingDaily = dailyActions.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);
         setFlexCapacitySeconds(Math.max(0, timeLeft - remainingSchedule - remainingDaily));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, dayStatus, scheduleTasks, dailyActions]);

  // --- PILL STATE LOGIC ---
  const pillState = useMemo(() => {
    if (dayStatus === 'sleeping') return { text: "Ready for your day?", color: "text-slate-500 border-slate-200 bg-white" };
    if (dayStatus === 'completed') return { text: "Day Completed", color: "text-emerald-600 border-emerald-200 bg-emerald-50" };
    if (!hasSchedule) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };

    const now = getNow();
    let currentTask: TaskItem | null = null;
    let nextTask: TaskItem | null = null;
    let minDiff = Infinity;

    const timedTasks = scheduleTasks.filter(t => t.timeRange.includes('-'));

    for (const task of timedTasks) {
      const [startStr, endStr] = task.timeRange.split(' - ');
      const start = getTodayDateAtTime(startStr);
      const end = getTodayDateAtTime(endStr);
      start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      end.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

      if (now >= start && now < end) { currentTask = task; break; }
      if (now < start && task.status !== 'completed') {
        const diff = start.getTime() - now.getTime();
        if (diff < minDiff) { minDiff = diff; nextTask = task; }
      }
    }

    if (currentTask) return { text: `Now: ${currentTask.title}`, color: "text-emerald-600 border-emerald-200 bg-white" };
    if (nextTask) {
       const diffMins = Math.ceil(minDiff / (1000 * 60));
       const hrs = Math.floor(diffMins / 60); const mins = diffMins % 60;
       let timeStr = ""; if (hrs > 0) timeStr += `${hrs}h `; if (mins > 0 || hrs === 0) timeStr += `${mins}m`;
       return { text: `Next: ${nextTask.title} in ${timeStr.trim()}`, color: "text-indigo-500 border-indigo-100 bg-white" };
    }
    return { text: "No pending tasks", color: "text-slate-400 border-slate-200 bg-slate-50" };
  }, [dayStatus, hasSchedule, scheduleTasks, dailyActions]); // Dependency array roughly correct, technically needs 'now' but that updates via timer/re-renders

  // --- ACTIONS ---

  const startDay = async () => {
    // Optimistic
    setDayStatus('active');
    setCheckInTime(getNow());
    // DB
    await api.apiStartDay();
  };

  const endDay = () => setIsSummaryOpen(true);

  const confirmEndDay = async () => {
    setDayStatus('completed');
    setIsSummaryOpen(false);
    await api.apiEndDay();
  };

  const toggleTask = async (id: string, isDaily: boolean) => {
    if (isEditing || isEditingActions) return;
    const now = getNow().getTime();

    // 1. SYNC PREVIOUS ACTIVE TASK (If any)
    // If we are switching FROM a task, save its progress before stopping
    if (activeTask) {
        // Log STOP for old task
        await api.apiLogTimer(activeTask.id, 'STOP');
        // Save final seconds
        await api.apiUpdateTaskProgress(activeTask.id, activeTask.elapsedSeconds);
        // Save Status
        await api.apiUpdateTaskStatus(activeTask.id, 'pending');
    }

    // 2. IDENTIFY TARGET
    const targetList = isDaily ? dailyActions : scheduleTasks;
    const target = targetList.find(t => t.id === id);
    if (!target) return;

    const isStarting = target.status !== 'in_progress';
    const newAction = isStarting ? 'START' : 'STOP';

    // 3. LOG NEW EVENT (Optimistic + DB)
    setTimerEvents(prev => [...prev, { id: Math.random().toString(), taskId: id, action: newAction, timestamp: now }]);
    api.apiLogTimer(id, newAction); // Background

    // 4. UPDATE LOCAL STATE
    const toggler = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: isStarting ? 'in_progress' : 'pending' } as TaskItem;
      if (t.status === 'in_progress') return { ...t, status: 'pending' } as TaskItem;
      return t;
    });

    if (isDaily) { 
        setDailyActions(prev => toggler(prev)); 
        setScheduleTasks(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); 
    } else { 
        setScheduleTasks(prev => toggler(prev)); 
        setDailyActions(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); 
    }

    // 5. SYNC NEW STATUS TO DB
    if (isStarting) {
        await api.apiUpdateTaskStatus(id, 'in_progress');
    } else {
        // If stopping the target, sync its progress too
        await api.apiUpdateTaskStatus(id, 'pending');
        await api.apiUpdateTaskProgress(id, target.elapsedSeconds);
    }
  };

  const toggleComplete = async (id: string, isDaily: boolean) => {
    if (isEditing || isEditingActions) return;
    const toggler = (list: TaskItem[]) => list.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as TaskItem : t);
    
    // Update Local
    if (isDaily) setDailyActions(prev => toggler(prev)); else setScheduleTasks(prev => toggler(prev));
    
    // Update DB
    const target = (isDaily ? dailyActions : scheduleTasks).find(t => t.id === id);
    if (target) {
        const newStatus = target.status === 'completed' ? 'pending' : 'completed';
        await api.apiUpdateTaskStatus(id, newStatus);
    }
  };

  const saveTask = async (data: Partial<TaskItem>) => {
    if (modalConfig.mode === 'add') {
      const newTask: TaskItem = {
        id: crypto.randomUUID(), // Generate real UUID for DB
        title: data.title || "New Task",
        timeRange: data.timeRange || "--:--",
        score: 0,
        status: 'pending',
        category: data.category || 'CONSISTENCY',
        icon: data.icon || Brain,
        elapsedSeconds: 0,
        isDaily: modalConfig.type === 'daily'
      };

      // Optimistic Update
      if (modalConfig.type === 'daily') {
        setDailyActions([...dailyActions, newTask]);
      } else {
        const newTasks = [...scheduleTasks];
        const idx = modalConfig.insertIndex !== undefined ? modalConfig.insertIndex : -1;
        if (idx === -1) newTasks.unshift(newTask);
        else newTasks.splice(idx + 1, 0, newTask);
        setScheduleTasks(newTasks);
      }
      
      // DB Sync
      await api.apiCreateTask(newTask);

    } else {
      // EDIT MODE (Simplified for MVP: Optimistic only for now, assume no complex edits)
      // For full sync, you'd need an apiUpdateTaskDetails function
      const updater = (list: TaskItem[]) => list.map(t => t.id === modalConfig.initialData?.id ? { ...t, ...data } : t);
      if (modalConfig.type === 'daily') setDailyActions(prev => updater(prev));
      else setScheduleTasks(prev => updater(prev));
    }
    closeModal();
  };
  
  // ... (Other helpers: delete, modals) ...
  const deleteTask = async (id: string, isDaily: boolean) => {
    // 1. Optimistic Update (Remove from UI immediately)
    if (isDaily) {
      setDailyActions(prev => prev.filter(t => t.id !== id));
    } else {
      setScheduleTasks(prev => prev.filter(t => t.id !== id));
    }
    
    // 2. Background DB Sync
    await api.apiDeleteTask(id);
  };

  const insertTask = (index: number) => {
    const newTask: TaskItem = { id: Math.random().toString(), title: "New Task", timeRange: "--:--", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Brain, elapsedSeconds: 0 };
    const newTasks = [...scheduleTasks];
    if (index === -1) newTasks.unshift(newTask); else newTasks.splice(index + 1, 0, newTask);
    setScheduleTasks(newTasks);
  };
  const addDailyAction = () => {
    const newAction: TaskItem = { id: Math.random().toString(), title: "New Action", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Sparkles, isDaily: true, elapsedSeconds: 0 };
    setDailyActions([...dailyActions, newAction]);
  };

  const openAddSchedule = (index: number) => {
    // Smart Defaults Logic
    const prevTask = index >= 0 ? scheduleTasks[index] : null;
    const nextTask = scheduleTasks[index + 1];

    let minTime = "07:00";
    if (prevTask) {
       const parts = prevTask.timeRange.split('-');
       if (parts[1]) minTime = parts[1].trim();
    }

    let maxTime = "23:00";
    if (nextTask) {
       const parts = nextTask.timeRange.split('-');
       if (parts[0]) maxTime = parts[0].trim();
    }

    setModalConfig({ isOpen: true, mode: 'add', type: 'schedule', insertIndex: index }); 
  };


  const openAddDaily = () => setModalConfig({ isOpen: true, mode: 'add', type: 'daily' });
  const openEditTask = (task: TaskItem) => setModalConfig({ isOpen: true, mode: 'edit', type: task.isDaily ? 'daily' : 'schedule', initialData: task });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  return {
    state: {
      dayStatus, checkInTime, hasSchedule: scheduleTasks.length > 0, // Computed
      isEditing, isEditingActions, scheduleTasks, dailyActions, flexCapacitySeconds, activeTask, totalVolumeSeconds,
      pillState, debugTime: DEBUG_TIME, modalConfig, isSummaryOpen, timerEvents
    },
    actions: {
      startDay, endDay, confirmEndDay, setIsEditing, setIsEditingActions,
      toggleTask, toggleComplete, deleteTask, insertTask, addDailyAction, openAddSchedule, openAddDaily, openEditTask, saveTask, closeModal, setIsSummaryOpen
    },
    helpers: { isTimeInPast, getNow }
  };
}