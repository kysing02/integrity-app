import { useState, useEffect, useMemo } from 'react';
import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds, getAdjustedMinutes, getTodayDateAtTime } from '@/lib/timeUtils';
import * as api from '@/lib/dashboardService';

export function useTaskEngine(initialData: any, dayStatus: string) {
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>([]);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>([]);
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);
  
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [workLeftSeconds, setWorkLeftSeconds] = useState(0);

  // Sync when DB loads new data
  useEffect(() => {
    if (initialData) {
      setScheduleTasks(initialData.scheduleTasks);
      setDailyActions(initialData.dailyActions);
      setTimerEvents(initialData.timerEvents);
    } else {
      setScheduleTasks([]);
      setDailyActions([]);
      setTimerEvents([]);
    }
  }, [initialData]);

  // Derived
  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  const totalVolumeSeconds = [...scheduleTasks, ...dailyActions].reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- TIMER LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date(); // Simplified for brevity
      
      // 1. Tick
      if (activeTask) {
        const updater = (list: TaskItem[]) => list.map(t => t.id === activeTask.id ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
        if (activeTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
      }

      // 2. Capacity Calc
      if (dayStatus === 'active') {
         // ... (Paste your Capacity Logic Here) ...
         // Use setFlexCapacitySeconds and setWorkLeftSeconds
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, dayStatus, scheduleTasks, dailyActions]);

  // --- CRUD ACTIONS (Simplified) ---
  const toggleTask = async (id: string, isDaily: boolean) => { /* ... Paste Logic ... */ };
  const toggleComplete = async (id: string, isDaily: boolean) => { /* ... Paste Logic ... */ };
  const saveTask = async (taskData: any, config: any) => { /* ... Paste Logic ... */ };
  const deleteTask = async (id: string, isDaily: boolean) => { /* ... Paste Logic ... */ };

  return {
    scheduleTasks, dailyActions, timerEvents, activeTask,
    flexCapacitySeconds, workLeftSeconds, totalVolumeSeconds,
    setScheduleTasks, setDailyActions, setTimerEvents, // Expose setters for Day Actions
    toggleTask, toggleComplete, saveTask, deleteTask
  };
}