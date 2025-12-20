import { useState, useEffect } from 'react';
import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds, getAdjustedMinutes, getNow } from '@/lib/timeUtils';
import * as api from '@/lib/dashboardService';

export function useTaskEngine(initialData: any, dayStatus: string) {
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>([]);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>([]);
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);
  
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [workLeftSeconds, setWorkLeftSeconds] = useState(0);

  // --- 1. SYNC WITH DB LOAD ---
  useEffect(() => {
    if (initialData) {
      setScheduleTasks(initialData.scheduleTasks || []);
      setDailyActions(initialData.dailyActions || []);
      setTimerEvents(initialData.timerEvents || []);
    } else {
      setScheduleTasks([]);
      setDailyActions([]);
      setTimerEvents([]);
    }
  }, [initialData]);

  // Derived State
  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  
  const totalVolumeSeconds = 
    scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) + 
    dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- 2. TIMER ENGINE (The Heartbeat) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNow();
      
      // A. Tick Active Task
      if (activeTask) {
        const updater = (list: TaskItem[]) => list.map(t => t.id === activeTask.id ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
        if (activeTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
      }

      // B. Recalculate Capacity
      if (dayStatus === 'active') {
          const currentStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const currentMins = getAdjustedMinutes(currentStr);
          
          // Strict Goal: 23:00
          const targetEndMins = getAdjustedMinutes("23:00"); 
          const totalWindowSeconds = (targetEndMins - currentMins) * 60;
             
          const calcRemaining = (t: TaskItem) => {
             const total = parseDurationToSeconds(t.timeRange);
             if (t.status === 'completed') return 0;
             return Math.max(0, total - t.elapsedSeconds);
          };

          const totalWorkLeft = 
            scheduleTasks.reduce((acc, t) => acc + calcRemaining(t), 0) + 
            dailyActions.reduce((acc, t) => acc + calcRemaining(t), 0);
          
          setWorkLeftSeconds(totalWorkLeft);
          setFlexCapacitySeconds(totalWindowSeconds - totalWorkLeft);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, dayStatus, scheduleTasks, dailyActions]);

  // --- 3. ACTIONS (CRUD) ---

  const toggleTask = async (id: string, isDaily: boolean) => {
    const now = getNow().getTime();

    // A. Stop Previous Task (if any)
    if (activeTask) {
       // Optimistic Stop
       await api.apiLogTimer(activeTask.id, 'STOP');
       await api.apiUpdateTaskProgress(activeTask.id, activeTask.elapsedSeconds);
       await api.apiUpdateTaskStatus(activeTask.id, 'pending');
    }

    // B. Identify Target
    const targetList = isDaily ? dailyActions : scheduleTasks;
    const target = targetList.find(t => t.id === id);
    if (!target) return;

    const isStarting = target.status !== 'in_progress';
    const newAction = isStarting ? 'START' : 'STOP';

    // C. Log Event
    setTimerEvents(prev => [...prev, { id: Math.random().toString(), taskId: id, action: newAction, timestamp: now }]);
    api.apiLogTimer(id, newAction);

    // D. Update Local State
    const toggler = (list: TaskItem[]) => list.map(t => {
      // Toggle Target
      if (t.id === id) return { ...t, status: isStarting ? 'in_progress' : 'pending' } as TaskItem;
      // Force others to pending
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

    // E. Sync DB
    if (isStarting) {
        await api.apiUpdateTaskStatus(id, 'in_progress');
    } else {
        await api.apiUpdateTaskStatus(id, 'pending');
        await api.apiUpdateTaskProgress(id, target.elapsedSeconds);
    }
  };

  const toggleComplete = async (id: string, isDaily: boolean) => {
    const toggler = (list: TaskItem[]) => list.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as TaskItem : t);
    
    if (isDaily) setDailyActions(prev => toggler(prev)); 
    else setScheduleTasks(prev => toggler(prev));
    
    const target = (isDaily ? dailyActions : scheduleTasks).find(t => t.id === id);
    if (target) {
        const newStatus = target.status === 'completed' ? 'pending' : 'completed';
        await api.apiUpdateTaskStatus(id, newStatus);
    }
  };

  const saveTask = async (taskData: Partial<TaskItem>, modalConfig: any) => {
    if (!taskData.title) return;

    const isNew = !modalConfig.initialData?.id;
    const isDaily = modalConfig.type === 'daily';
    
    const baseTask = {
      title: taskData.title,
      icon: taskData.icon, 
      category: taskData.category || 'CONSISTENCY',
      timeRange: taskData.timeRange || "",
      isDaily: isDaily,
      status: (modalConfig.initialData?.status || 'pending') as any,
      elapsedSeconds: modalConfig.initialData?.elapsedSeconds || 0,
    };

    if (isNew) {
      // --- CREATE ---
      const newTask: TaskItem = {
        ...baseTask,
        id: crypto.randomUUID(),
        user_id: 'guest',
        day_id: 'temp',
        created_at: new Date().toISOString()
      };

      if (isDaily) {
        setDailyActions(prev => [...prev, newTask]);
      } else {
        setScheduleTasks(prev => {
          const updated = [...prev, newTask];
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
        const mapped = prev.map(t => t.id === taskId ? { ...t, ...baseTask } : t);
        if (!isDaily) {
           return mapped.sort((a, b) => {
             const timeA = a.timeRange.split(' - ')[0] || "00:00";
             const timeB = b.timeRange.split(' - ')[0] || "00:00";
             return getAdjustedMinutes(timeA) - getAdjustedMinutes(timeB);
           });
        }
        return mapped;
      };

      if (isDaily) {
        setDailyActions(updateFn);
      } else {
        setScheduleTasks(updateFn);
      }

      await api.apiUpdateTask(taskId, baseTask);
    }
  };

  const deleteTask = async (id: string, isDaily: boolean) => {
    if (isDaily) {
      setDailyActions(prev => prev.filter(t => t.id !== id));
    } else {
      setScheduleTasks(prev => prev.filter(t => t.id !== id));
    }
    await api.apiDeleteTask(id);
  };

  return {
    scheduleTasks, dailyActions, timerEvents, activeTask,
    flexCapacitySeconds, workLeftSeconds, totalVolumeSeconds,
    setScheduleTasks, setDailyActions, setTimerEvents,
    toggleTask, toggleComplete, saveTask, deleteTask
  };
}