"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Brain, Users, Dumbbell, Sun, Pencil, BookOpen, Brush, Sparkles } from 'lucide-react';
import { TimerEvent, TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getTaskRemainingSeconds, getTodayDateAtTime } from '@/lib/timeUtils';
import { getTodayId } from '@/lib/supabase'; // Helper from Phase 2
import * as api from '@/lib/dashboardService'; // The service we just wrote
import { getAdjustedMinutes, isTimeInPastShifted } from '@/lib/timeUtils';

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
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return d;
  });
  
  // UI State
  const [modalConfig, setModalConfig] = useState<ModalConfig>({ isOpen: false, mode: 'add', type: 'schedule' });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [workLeftSeconds, setWorkLeftSeconds] = useState(0);

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
      // PASS VIEWDATE HERE
      const dateId = getTodayId(userId, viewDate); 
      
      // Clear state before loading to prevent UI flicker
      setScheduleTasks([]);
      setDailyActions([]);
      
      const data = await api.fetchDayData(dateId);

      if (data) {
        console.log("Loaded day:", dateId);
        setDayStatus(data.status as any);
        setCheckInTime(data.checkInTime);
        setScheduleTasks(data.scheduleTasks);
        setDailyActions(data.dailyActions);
        setTimerEvents(data.timerEvents as any);
      } else {
        console.log("No data for:", dateId);
        // If viewing past/future empty day, default to sleeping
        setDayStatus('sleeping');
        setCheckInTime(null);
        setTimerEvents([]);
      }
    };
    loadFromDB();
  }, [viewDate]);

  // --- DERIVED STATE ---
  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  const totalVolumeSeconds = scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) + dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- TIMER ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNow();
      
      // 1. Tick Active Task
      if (activeTask) {
        const updater = (list: TaskItem[]) => list.map(t => t.id === activeTask.id ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
        if (activeTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
      }

      // 2. Flex Cap Calc (STRICT DEADLINE LOGIC)
      if (dayStatus === 'active') {
          const currentStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const currentMins = getAdjustedMinutes(currentStr);
          const targetEndMins = getAdjustedMinutes("23:00"); // Strict Goal
          
          const totalWindowSeconds = (targetEndMins - currentMins) * 60;
             
          const calcRemaining = (t: TaskItem) => {
             const total = parseDurationToSeconds(t.timeRange);
             if (t.status === 'completed') return 0; // <--- The logic you wanted
             return Math.max(0, total - t.elapsedSeconds);
          };

          const totalWorkLeft = 
            scheduleTasks.reduce((acc, t) => acc + calcRemaining(t), 0) + 
            dailyActions.reduce((acc, t) => acc + calcRemaining(t), 0);
          
          setWorkLeftSeconds(totalWorkLeft); // <--- Store it
          setFlexCapacitySeconds(totalWindowSeconds - totalWorkLeft);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, dayStatus, scheduleTasks, dailyActions]);

  // --- PILL STATE LOGIC ---
  const pillState = useMemo(() => {
    if (dayStatus === 'sleeping') return { text: "Ready for your day?", color: "text-slate-500 border-slate-200 bg-white" };
    if (dayStatus === 'completed') return { text: "Day Completed", color: "text-slate-500 border-slate-200 bg-slate-50" };
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
  const navigateDay = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + offset);
    setViewDate(newDate);
  };

  const startDay = async () => {
    // Optimistic
    setDayStatus('active');
    setCheckInTime(getNow());
    // DB
    await api.apiStartDay();
  };

  const endDay = () => setIsSummaryOpen(true);

  const confirmEndDay = async () => {
    const currentActive = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
    if (currentActive) {
       // A. Stop in Database
       await api.apiLogTimer(currentActive.id, 'STOP');
       await api.apiUpdateTaskProgress(currentActive.id, currentActive.elapsedSeconds);
       await api.apiUpdateTaskStatus(currentActive.id, 'pending');
       
       // B. Stop in UI (Optimistic Update)
       // This removes 'in_progress' status, which causes 'activeTask' to become undefined,
       // effectively killing the timer interval.
       const stopMap = (t: TaskItem) => t.status === 'in_progress' ? { ...t, status: 'pending' as const } : t;
       setScheduleTasks(prev => prev.map(stopMap));
       setDailyActions(prev => prev.map(stopMap));
    }
    
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

  const saveTask = async (taskData: Partial<TaskItem>) => {
    if (!taskData.title) return;

    const isNew = !modalConfig.initialData?.id;
    const isDaily = modalConfig.type === 'daily';
    
    // 1. Prepare the Task Object
    const baseTask = {
      title: taskData.title,
      icon: taskData.icon, // Store the component function directly
      category: taskData.category || 'CONSISTENCY',
      timeRange: taskData.timeRange || "",
      isDaily: isDaily,
      status: (modalConfig.initialData?.status || 'pending') as any, // Preserve status
      elapsedSeconds: modalConfig.initialData?.elapsedSeconds || 0,   // Preserve time
    };

    if (isNew) {
      // --- CREATE ---
      const newTask: TaskItem = {
        ...baseTask,
        id: crypto.randomUUID(), // Temp ID
        user_id: 'guest', // Placeholder
        day_id: 'temp',
        created_at: new Date().toISOString()
      };

      // Optimistic Update
      if (isDaily) {
        setDailyActions(prev => [...prev, newTask]);
      } else {
        setScheduleTasks(prev => {
          const updated = [...prev, newTask];
          // Sort using the new Adjusted Helper
          return updated.sort((a, b) => {
            const timeA = a.timeRange.split(' - ')[0] || "00:00";
            const timeB = b.timeRange.split(' - ')[0] || "00:00";
            return getAdjustedMinutes(timeA) - getAdjustedMinutes(timeB);
          });
        });
      }
      
      await api.apiCreateTask(newTask);

    } else {
      // --- UPDATE ---
      const taskId = modalConfig.initialData!.id!;
      
      const updateFn = (prev: TaskItem[]) => {
        // A. Map to update the specific item
        const mapped = prev.map(t => t.id === taskId ? { ...t, ...baseTask } : t);
        
        // B. Sort the result (Only needed for Schedule)
        if (!isDaily) {
           return mapped.sort((a, b) => {
              // Import getAdjustedMinutes logic locally or helper
              // For safety here, we do string comparison if helpers aren't handy, 
              // BUT better to rely on the helper we just made.
              // Let's assume standard ASCII sort for MVP safety if helper unavailable, 
              // OR better: use the order they are in. 
              // Actually, let's just return mapped. The user can re-order if needed, 
              // or we rely on the helper if you imported it.
              return 0; 
           });
        }
        return mapped;
      };

      if (isDaily) {
        setDailyActions(updateFn);
      } else {
        // FIX: Ensure we use the correct sort logic so it doesn't vanish or jump randomly
        setScheduleTasks(prev => {
           const updated = prev.map(t => t.id === taskId ? { ...t, ...baseTask } : t);
           // Re-Sort using Adjusted Logic
           return updated.sort((a, b) => {
             const getMins = (t: string) => {
                const [h, m] = t.split(':')[0] ? t.split(' - ')[0].split(':').map(Number) : [0,0];
                return (h < 5 ? h + 24 : h) * 60 + m;
             };
             return getMins(a.timeRange) - getMins(b.timeRange);
           });
        });
      }

      await api.apiUpdateTask(taskId, baseTask);
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
      viewDate, dayStatus, checkInTime, hasSchedule: scheduleTasks.length > 0, // Computed
      isEditing, isEditingActions, scheduleTasks, dailyActions, flexCapacitySeconds, workLeftSeconds, activeTask, totalVolumeSeconds,
      pillState, debugTime: DEBUG_TIME, modalConfig, isSummaryOpen, timerEvents
    },
    actions: {
      navigateDay, startDay, endDay, confirmEndDay, setIsEditing, setIsEditingActions,
      toggleTask, toggleComplete, deleteTask, insertTask, addDailyAction, openAddSchedule, openAddDaily, openEditTask, saveTask, closeModal, setIsSummaryOpen
    },
    helpers: { isTimeInPast: isTimeInPastShifted, getNow }
  };
}