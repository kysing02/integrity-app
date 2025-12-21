import { useState, useEffect, useRef } from 'react';
import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds, getAdjustedMinutes, getNow } from '@/lib/timeUtils';
import * as api from '@/lib/dashboardService';
import { generateUUID } from '@/lib/utils';

export function useTaskEngine(initialData: any, dayStatus: string, isFuture: boolean) {
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>([]);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>([]);
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);
  
  const [globalActiveTask, setGlobalActiveTask] = useState<TaskItem | null>(null);
  const [workLeftSeconds, setWorkLeftSeconds] = useState(0);

  // --- 1. SYNC WITH DB LOAD ---
  useEffect(() => {
    if (initialData) {
      setScheduleTasks(initialData.scheduleTasks || []);
      setDailyActions(initialData.dailyActions || []);
      setTimerEvents(initialData.timerEvents || []);

      // Check if DB thinks something is running (for fresh loads)
      const dbActive = 
         (initialData.scheduleTasks || []).find((t: any) => t.status === 'in_progress') || 
         (initialData.dailyActions || []).find((t: any) => t.status === 'in_progress');
      
      if (dbActive) {
         setGlobalActiveTask(dbActive);
      }
    }
  }, [initialData]);

  // --- 2. INITIAL FETCH (Persistence) ---
  useEffect(() => {
    let isMounted = true;
    api.apiGetGlobalActiveTask().then(task => {
      if (isMounted && task) {
         setGlobalActiveTask(task);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // --- 3. REACTIVE SMART MERGE (The "Anti-Idle" Fix) ---
  // Whenever globalActiveTask updates (loaded from DB or ticked), 
  // ensure the UI list reflects this immediately.
  useEffect(() => {
    if (globalActiveTask) {
        const syncer = (list: TaskItem[]) => list.map(t => 
            t.id === globalActiveTask.id 
                ? { ...t, elapsedSeconds: globalActiveTask.elapsedSeconds, status: 'in_progress' as const }
                : t
        );
        setScheduleTasks(prev => syncer(prev));
        setDailyActions(prev => syncer(prev));
    }
  }, [globalActiveTask?.id, globalActiveTask?.elapsedSeconds]); 
  // Note: We depend on seconds here to keep UI in sync, 
  // but this is cheap because it doesn't restart the timer interval below.

  // Derived Stats
  const totalVolumeSeconds = 
    scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) + 
    dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- 4. TIMER ENGINE (The Stable Heartbeat) ---
  useEffect(() => {
    // Only run if we have an active task OR if we need to update capacity (active day)
    if (!globalActiveTask && dayStatus !== 'active') return;

    const interval = setInterval(() => {
      const now = getNow();
      
      // A. Tick Global Task
      if (globalActiveTask) {
        // We only update the Global State here.
        // The "Reactive Smart Merge" effect above will catch this change 
        // and update scheduleTasks/dailyActions automatically.
        setGlobalActiveTask(prev => prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null);
      }

      // B. Recalculate Work Left
      // We use functional updates to read the LATEST lists without adding them to dependency array
      if (dayStatus === 'active') {
          setScheduleTasks(currentSchedule => {
             setDailyActions(currentDaily => {
                 const calcRemaining = (t: TaskItem) => {
                    const total = parseDurationToSeconds(t.timeRange);
                    if (t.status === 'completed') return 0;
                    // Important: Use the live elapsed time if it's the active task
                    const elapsed = (globalActiveTask && t.id === globalActiveTask.id) 
                        ? globalActiveTask.elapsedSeconds 
                        : t.elapsedSeconds;
                    return Math.max(0, total - elapsed);
                 };

                 const totalWorkLeft = 
                   currentSchedule.reduce((acc, t) => acc + calcRemaining(t), 0) + 
                   currentDaily.reduce((acc, t) => acc + calcRemaining(t), 0);
                 
                 setWorkLeftSeconds(totalWorkLeft);
                 return currentDaily; // No change to state, just reading
             });
             return currentSchedule; // No change to state
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dayStatus, globalActiveTask?.id]); 
  // ^ CRITICAL: dependency array is minimal. 
  // We do NOT include scheduleTasks/dailyActions/elapsedSeconds here. 
  // This prevents the interval from resetting every second.

  // --- 5. ACTIONS ---

  const toggleTask = async (id: string, isDaily: boolean) => {
    if (isFuture) {
        console.warn("Cannot start timer in future");
        return; 
    }

    // A. STOP LOGIC
    if (globalActiveTask) {
       await api.apiStopTask(globalActiveTask.id, globalActiveTask.elapsedSeconds);

       const stoppingId = globalActiveTask.id;
       setGlobalActiveTask(null); // This stops the interval tick

       const stopFn = (list: TaskItem[]) => list.map(t => t.id === stoppingId ? { ...t, status: 'pending' as const } : t);
       if (globalActiveTask.isDaily) setDailyActions(stopFn);
       else setScheduleTasks(stopFn);

       if (stoppingId === id) return;
    }

    // B. START LOGIC
    const targetList = isDaily ? dailyActions : scheduleTasks;
    const target = targetList.find(t => t.id === id);
    
    if (target) {
       // Optimistic Update
       const startedTask = { ...target, status: 'in_progress' as const };
       setGlobalActiveTask(startedTask); // This starts the interval tick

       // DB Update
       await api.apiStartTask(id);
    }
  };

  const toggleComplete = async (id: string, isDaily: boolean) => {
    const toggler = (list: TaskItem[]) => list.map(t => {
        if (t.id !== id) return t;
        const newStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: newStatus as 'completed' | 'pending' };
    });
    
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
      status: (modalConfig.initialData?.status || 'pending') as 'pending' | 'in_progress' | 'completed',
      elapsedSeconds: modalConfig.initialData?.elapsedSeconds || 0,
    };

    if (isNew) {
      const newTask: TaskItem = {
        ...baseTask,
        id: generateUUID(),
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
      const taskId = modalConfig.initialData!.id!;
      
      // Update Global State if editing active task
      if (globalActiveTask && globalActiveTask.id === taskId) {
          setGlobalActiveTask(prev => prev ? { ...prev, ...baseTask } : null);
      }

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
    if (globalActiveTask && globalActiveTask.id === id) {
        setGlobalActiveTask(null);
    }

    if (isDaily) {
      setDailyActions(prev => prev.filter(t => t.id !== id));
    } else {
      setScheduleTasks(prev => prev.filter(t => t.id !== id));
    }
    await api.apiDeleteTask(id);
  };

  return {
    scheduleTasks, dailyActions, timerEvents, activeTask: globalActiveTask,
    workLeftSeconds, totalVolumeSeconds,
    setScheduleTasks, setDailyActions, setTimerEvents,
    toggleTask, toggleComplete, saveTask, deleteTask
  };
}