import { useState, useMemo, useEffect } from 'react';
import { useDayState } from './useDayState';
import { useTaskEngine } from './useTaskEngine';
import * as api from '@/lib/dashboardService';
import { getTodayId } from '@/lib/supabase';
import { getNow, isTimeInPastShifted, getAdjustedMinutes } from '@/lib/timeUtils';
import { TaskItem } from '@/types/dashboard';

export function useDashboard() {
  // 1. Load Core State
  const day = useDayState();
  
  // 2. Load Engine (Dependent on Day Data)
  const engine = useTaskEngine(day.initialData, day.dayStatus);

  // 3. UI Local State
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, mode: 'add', type: 'schedule' });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // --- ACTIONS ---
  
  const startDay = async () => {
    day.setDayStatus('active');
    day.setCheckInTime(getNow());
    const userId = await api.getUserId();
    const dateId = getTodayId(userId, day.viewDate);
    await api.apiStartDay(dateId);
  };

  const endDay = () => setIsSummaryOpen(true);

  const confirmEndDay = async () => {
     // 1. Stop Active Timer (DB + UI)
     const currentActive = [...engine.scheduleTasks, ...engine.dailyActions].find(t => t.status === 'in_progress');
     if (currentActive) {
        // DB Updates
        await api.apiLogTimer(currentActive.id, 'STOP');
        await api.apiUpdateTaskProgress(currentActive.id, currentActive.elapsedSeconds);
        await api.apiUpdateTaskStatus(currentActive.id, 'pending');
        
        // Optimistic UI Update (Stop the ticking immediately)
        // We manually force the status to pending in the engine state to ensure the Receipt renders a stopped state
        const stopFn = (list: TaskItem[]) => list.map(t => t.id === currentActive.id ? { ...t, status: 'pending' as const } : t);
        if (currentActive.isDaily) engine.setDailyActions(stopFn);
        else engine.setScheduleTasks(stopFn);
     }
     
     // 2. Close Day
     day.setDayStatus('completed');
     setIsSummaryOpen(false);
     
     // Calculate the ID for the day we are VIEWING
     const userId = await api.getUserId();
     const dateId = getTodayId(userId, day.viewDate);
     
     await api.apiEndDay(dateId); // <--- PASS ID HERE
  };

  // --- AUTO-CLOSE LOGIC (THE FIX) ---
  useEffect(() => {
    // Check if we are looking at a "Past" day that is still "Active"
    // AND ensure data has finished loading so we don't accidentally close an empty state
    if (!day.isLoading && day.dayStatus === 'active' && day.dateState.isPast) {
       console.warn("Auto-closing past active day");
       confirmEndDay();
    }
  }, [day.isLoading, day.dayStatus, day.dateState.isPast]);

  // --- PILL LOGIC ---
  const pillState = useMemo(() => {
    if (day.dayStatus === 'sleeping') {
        if (day.dateState.isPast) return { text: "No Record", color: "text-slate-400 border-slate-200 bg-slate-50" };
        if (day.dateState.isFuture) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };
        return { text: "Ready for your day?", color: "text-slate-500 border-slate-200 bg-white" };
    }

    if (day.dayStatus === 'completed') return { text: "Day Completed", color: "text-slate-500 border-slate-200 bg-slate-50" };
    
    if (engine.scheduleTasks.length === 0) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };

    const now = getNow();
    const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const nowMins = getAdjustedMinutes(nowStr);

    let currentTask: TaskItem | null = null;
    let nextTask: TaskItem | null = null;
    let minDiff = Infinity;

    const timedTasks = engine.scheduleTasks.filter(t => t.timeRange.includes('-'));

    for (const task of timedTasks) {
      const [startStr, endStr] = task.timeRange.split(' - ');
      if (!startStr || !endStr) continue;

      const startMins = getAdjustedMinutes(startStr);
      const endMins = getAdjustedMinutes(endStr);

      if (nowMins >= startMins && nowMins < endMins) {
        currentTask = task;
        break;
      }

      if (nowMins < startMins && task.status !== 'completed') {
        const diff = startMins - nowMins;
        if (diff < minDiff) {
          minDiff = diff;
          nextTask = task;
        }
      }
    }

    if (currentTask) {
        return { text: `Now: ${currentTask.title}`, color: "text-emerald-600 border-emerald-200 bg-white" };
    }
    
    if (nextTask) {
       const hrs = Math.floor(minDiff / 60);
       const mins = minDiff % 60;
       let timeStr = ""; 
       if (hrs > 0) timeStr += `${hrs}h `; 
       if (mins > 0 || hrs === 0) timeStr += `${mins}m`;
       return { text: `Next: ${nextTask.title} in ${timeStr.trim()}`, color: "text-indigo-500 border-indigo-100 bg-white" };
    }

    return { text: "No pending tasks", color: "text-slate-400 border-slate-200 bg-slate-50" };

  }, [day.dayStatus, day.dateState, engine.scheduleTasks]);

  // --- MODAL HELPERS ---
  const openAddSchedule = (index: number) => {
    const prevTask = index >= 0 ? engine.scheduleTasks[index] : null;
    const nextTask = engine.scheduleTasks[index + 1];

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
  const openEditTask = (task: any) => setModalConfig({ isOpen: true, mode: 'edit', type: task.isDaily ? 'daily' : 'schedule', initialData: task });
  const closeModal = () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }));

  const handleSaveTask = (data: any) => engine.saveTask(data, modalConfig).then(closeModal);

  return {
    state: {
      ...day,
      ...day.dateState,
      ...engine, 
      modalConfig, isEditing, isEditingActions, isSummaryOpen, pillState,
      hasSchedule: engine.scheduleTasks.length > 0,
      debugTime: null
    },
    actions: {
      ...day, 
      ...engine,
      startDay, endDay, confirmEndDay,
      setIsEditing, setIsEditingActions, setIsSummaryOpen,
      openAddSchedule, openAddDaily, openEditTask, closeModal,
      saveTask: handleSaveTask
    },
    helpers: { isTimeInPast: isTimeInPastShifted, getNow }
  };
}