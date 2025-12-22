import { useState, useMemo, useEffect } from 'react';
import { useDayState } from './useDayState';
import { useTaskEngine } from './useTaskEngine';
import * as api from '@/lib/dashboardService';
import { getTodayId } from '@/lib/supabase';
import { getNow, isTimeInPastShifted, getAdjustedMinutes } from '@/lib/timeUtils';
import { TaskItem } from '@/types/dashboard';

export function useDashboard() {
  const day = useDayState();
  const [dayId, setDayId] = useState<string>('');

  useEffect(() => {
    const updateDayId = async () => {
      const userId = await api.getUserId();
      setDayId(getTodayId(userId, day.viewDate));
    };
    updateDayId();
  }, [day.viewDate]);

  const engine = useTaskEngine(day.initialData, day.dayStatus, day.dateState.isFuture, dayId);
  
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, mode: 'add', type: 'schedule' });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // --- ACTIONS ---
  
  const startDay = async () => {
    // 1. Update Local UI
    day.setDayStatus('active');
    
    // 2. Determine Context
    const isPlanning = day.dateState.isFuture;
    const timeToSet = isPlanning ? null : getNow(); 
    
    // Only update local checkInTime if we are actually setting a time
    if (timeToSet) {
        day.setCheckInTime(timeToSet);
    }

    // 3. Update Database (Now safely handles Upsert)
    const userId = await api.getUserId();
    const dateId = getTodayId(userId, day.viewDate);
    
    await api.apiStartDay(dateId, timeToSet ? timeToSet.toISOString() : null);
  };

  const endDay = () => setIsSummaryOpen(true);

  // UPDATED: Now accepts optional timestamp for Auto-Close
  const confirmEndDay = async (autoCloseTimestamp?: string) => {
      // 1. Stop Active Timer (DB + UI)
      const currentActive = [...engine.scheduleTasks, ...engine.dailyActions].find(t => t.status === 'in_progress');
      if (currentActive) {
        await api.apiStopTask(currentActive.id, currentActive.elapsedSeconds);
        
        // Optimistic UI Update
        const stopFn = (list: TaskItem[]) => list.map(t => t.id === currentActive.id ? { ...t, status: 'pending' as const } : t);
        if (currentActive.isDaily) engine.setDailyActions(stopFn);
        else engine.setScheduleTasks(stopFn);
      }
      
      // 2. Close Day
      day.setDayStatus('completed');
      setIsSummaryOpen(false);

      const userId = await api.getUserId();
      const dateId = getTodayId(userId, day.viewDate);
      
      // PASS TIMESTAMP (Auto-Close 5AM or Manual NOW)
      await api.apiEndDay(dateId, autoCloseTimestamp);
  };

  // --- AUTO-CLOSE LOGIC ---
  useEffect(() => {
    // If viewing a Past Day that is Active -> Auto Close it with 05:00 AM timestamp
    if (!day.isLoading && day.dayStatus === 'active' && day.dateState.isPast) {
       console.log("Auto-closing past active day...");
       
       // Calculate 05:00 AM of the NEXT day relative to the viewed day
       const nextDay5AM = new Date(day.viewDate);
       nextDay5AM.setDate(nextDay5AM.getDate() + 1); // +1 Day
       nextDay5AM.setHours(5, 0, 0, 0);             // 05:00 AM
       
       const autoTime = nextDay5AM.toISOString();
       
       confirmEndDay(autoTime);
    }
  }, [day.isLoading, day.dayStatus, day.dateState.isPast]);

  // ... (Keep pillState, modal helpers, return logic exactly as provided in your prompt) ...
  const pillState = useMemo(() => {
    // 1. SLEEPING STATE
    if (day.dayStatus === 'sleeping') {
        if (day.dateState.isPast) return { text: "No Record", color: "text-slate-400 border-slate-200 bg-slate-50" };
        if (day.dateState.isFuture) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };
        return { text: "Ready for your day?", color: "text-slate-500 border-slate-200 bg-white" };
    }

    // 2. COMPLETED
    if (day.dayStatus === 'completed') return { text: "Day Completed", color: "text-slate-500 border-slate-200 bg-slate-50" };
    
    // 3. EMPTY SCHEDULE
    if (engine.scheduleTasks.length === 0) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };

    // --- FIX: FUTURE PLANNING MODE ---
    // If we are in the future, do NOT calculate "Now" or "Next"
    if (day.dateState.isFuture) {
        return { text: "Planning Mode", color: "text-indigo-500 border-indigo-100 bg-indigo-50" };
    }

    // 4. ACTIVE EXECUTION (TODAY)
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
    setModalConfig({ isOpen: true, mode: 'add', type: 'schedule', insertIndex: index, minTime, maxTime }); 
  };
  const openAddDaily = () => setModalConfig({ isOpen: true, mode: 'add', type: 'daily' });
  const openEditTask = (task: any) => setModalConfig({ isOpen: true, mode: 'edit', type: task.isDaily ? 'daily' : 'schedule', initialData: task });
  const closeModal = () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }));
  const handleSaveTask = (data: any) => engine.saveTask(data, modalConfig).then(closeModal);
  const updateDayConfig = async (pCheckIn: string, pSleep: string) => {
      day.setPlannedCheckIn(pCheckIn);
      day.setPlannedSleep(pSleep);
      const userId = await api.getUserId();
      const dateId = getTodayId(userId, day.viewDate);
      await api.apiUpdateDayConfig(dateId, pCheckIn, pSleep);
  };

  return {
    state: {
      ...day, ...day.dateState, ...engine, 
      modalConfig, isEditing, isEditingActions, isSummaryOpen, pillState,
      hasSchedule: engine.scheduleTasks.length > 0, debugTime: null
    },
    actions: {
      ...day, ...engine, updateDayConfig,
      startDay, endDay, confirmEndDay,
      setIsEditing, setIsEditingActions, setIsSummaryOpen,
      openAddSchedule, openAddDaily, openEditTask, closeModal,
      saveTask: handleSaveTask
    },
    helpers: { isTimeInPast: isTimeInPastShifted, getNow }
  };
}