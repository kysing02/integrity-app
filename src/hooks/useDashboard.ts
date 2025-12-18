"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Brain, Users, Dumbbell, Sun, Pencil, BookOpen, Brush, Sparkles 
} from 'lucide-react';
import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getTaskRemainingSeconds, getTodayDateAtTime } from '@/lib/timeUtils';

// --- DEBUG CONFIG ---
const DEBUG_TIME = "13:30"; 

// --- INITIAL DATA ---
const INITIAL_SCHEDULE: TaskItem[] = [
  { id: 's1', title: "Meeting with Coworker", timeRange: "09:00 - 11:30", score: 0, status: "completed", category: "CONSISTENCY", icon: Users, elapsedSeconds: 9000 },
  { id: 's2', title: "Deep Work", timeRange: "13:00 - 14:00", score: 0, status: "in_progress", category: "CONSISTENCY", icon: Brain, elapsedSeconds: 1800 },
  { id: 's4', title: "Fitness", timeRange: "17:30 - 18:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Dumbbell, elapsedSeconds: 0 },
];

const INITIAL_DAILY: TaskItem[] = [
  { id: 'd1', title: "Study", timeRange: "1h 30m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Pencil, isDaily: true, elapsedSeconds: 0 },
  { id: 'd2', title: "Read", timeRange: "1m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: BookOpen, isDaily: true, elapsedSeconds: 0 }, 
  { id: 'd3', title: "Tidy Room", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Brush, isDaily: true, elapsedSeconds: 0 },
];

interface ModalConfig {
  isOpen: boolean;
  mode: 'add' | 'edit';
  type: 'schedule' | 'daily';
  initialData?: Partial<TaskItem>;
  insertIndex?: number; // Used when adding new task
  minTime?: string;
  maxTime?: string;
}

export function useDashboard() {
  // --- STATE ---
  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('active');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [hasSchedule, setHasSchedule] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>(INITIAL_SCHEDULE);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>(INITIAL_DAILY);
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
      isOpen: false, mode: 'add', type: 'schedule'
  });
  // --- HYDRATION ---
  useEffect(() => {
    const d = new Date(); d.setHours(7, 0, 0, 0); setCheckInTime(d);
  }, []);

  // --- DERIVED STATE ---
  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  const totalVolumeSeconds = scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) +
                             dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- HELPERS ---
  const getNow = () => {
    const now = new Date();
    if (DEBUG_TIME) {
      const [h, m] = DEBUG_TIME.split(':').map(Number);
      now.setHours(h, m, 0, 0);
    }
    return now;
  };

  const isTimeInPast = (timeStr: string) => {
    if (!timeStr) return false;
    const now = getNow();
    const timeDate = getTodayDateAtTime(timeStr);
    timeDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    return timeDate <= now;
  };

  // --- TIMER ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNow();
      
      // 1. Update Elapsed Time
      if (activeTask) {
        const updater = (list: TaskItem[]) => list.map(t => t.id === activeTask.id ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
        if (activeTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
      }

      // 2. Update Flex Capacity
      if (dayStatus === 'active') {
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
  const startDay = () => { setDayStatus('active'); setCheckInTime(getNow()); };
  const endDay = () => { if (confirm("End your day?")) setDayStatus('completed'); };
  
  const toggleTask = (id: string, isDaily: boolean) => {
    if (isEditing || isEditingActions) return;
    const toggler = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'in_progress' ? 'pending' : 'in_progress' } as TaskItem;
      if (t.status === 'in_progress') return { ...t, status: 'pending' } as TaskItem;
      return t;
    });
    if (isDaily) { setDailyActions(prev => toggler(prev)); setScheduleTasks(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); }
    else { setScheduleTasks(prev => toggler(prev)); setDailyActions(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); }
  };

  const toggleComplete = (id: string, isDaily: boolean) => {
    if (isEditing || isEditingActions) return;
    const toggler = (list: TaskItem[]) => list.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as TaskItem : t);
    if (isDaily) setDailyActions(prev => toggler(prev)); else setScheduleTasks(prev => toggler(prev));
  };

  const deleteTask = (id: string, isDaily: boolean) => {
    if (isDaily) setDailyActions(prev => prev.filter(t => t.id !== id));
    else setScheduleTasks(prev => prev.filter(t => t.id !== id));
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

  // 1. OPEN ADD MODAL
  const openAddSchedule = (index: number) => {
    // Smart Defaults Logic
    const prevTask = index >= 0 ? scheduleTasks[index] : null; // Task BEFORE insertion point
    const nextTask = scheduleTasks[index + 1]; // Task AFTER insertion point

    // Default Start: End of prev task OR Check-in time (07:00)
    let minTime = "07:00";
    if (prevTask) {
       const parts = prevTask.timeRange.split('-');
       if (parts[1]) minTime = parts[1].trim();
    }

    // Default End: Start of next task OR 23:00
    let maxTime = "23:00";
    if (nextTask) {
       const parts = nextTask.timeRange.split('-');
       if (parts[0]) maxTime = parts[0].trim();
    }

    setModalConfig({
      isOpen: true,
      mode: 'add',
      type: 'schedule',
      insertIndex: index,
      minTime,
      maxTime
    });
  };

  const openAddDaily = () => {
    setModalConfig({
      isOpen: true,
      mode: 'add',
      type: 'daily'
    });
  };

  // 2. OPEN EDIT MODAL
  const openEditTask = (task: TaskItem) => {
    setModalConfig({
      isOpen: true,
      mode: 'edit',
      type: task.isDaily ? 'daily' : 'schedule',
      initialData: task
    });
  };

  // 3. SAVE HANDLER
  const saveTask = (data: Partial<TaskItem>) => {
    if (modalConfig.mode === 'add') {
      const newTask: TaskItem = {
        id: Math.random().toString(),
        title: data.title || "New Task",
        timeRange: data.timeRange || "--:--",
        score: 0,
        status: 'pending',
        category: data.category || 'CONSISTENCY',
        icon: data.icon || Brain,
        elapsedSeconds: 0,
        isDaily: modalConfig.type === 'daily'
      };

      if (modalConfig.type === 'daily') {
        setDailyActions([...dailyActions, newTask]);
      } else {
        const newTasks = [...scheduleTasks];
        // Insert after the index provided
        const idx = modalConfig.insertIndex !== undefined ? modalConfig.insertIndex : -1;
        if (idx === -1) newTasks.unshift(newTask);
        else newTasks.splice(idx + 1, 0, newTask);
        setScheduleTasks(newTasks);
      }
    } else {
      // EDIT MODE
      const updater = (list: TaskItem[]) => list.map(t => 
        t.id === modalConfig.initialData?.id ? { ...t, ...data } : t
      );
      if (modalConfig.type === 'daily') setDailyActions(prev => updater(prev));
      else setScheduleTasks(prev => updater(prev));
    }
    closeModal();
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  return {
    state: {
      dayStatus, checkInTime, hasSchedule, isEditing, isEditingActions,
      scheduleTasks, dailyActions, flexCapacitySeconds, activeTask, totalVolumeSeconds,
      pillState, debugTime: DEBUG_TIME, modalConfig
    },
    actions: {
      startDay, endDay, setHasSchedule, setIsEditing, setIsEditingActions,
      toggleTask, toggleComplete, deleteTask, insertTask, addDailyAction, openAddSchedule, 
      openAddDaily,
      openEditTask,
      saveTask,
      closeModal
    },
    helpers: { isTimeInPast, getNow }
  };
}