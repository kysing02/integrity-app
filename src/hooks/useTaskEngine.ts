import { useState, useEffect } from 'react';
import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds, getAdjustedMinutes, getNow } from '@/lib/timeUtils';
import * as api from '@/lib/dashboardService';

export function useTaskEngine(initialData: any, dayStatus: string) {
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>([]);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>([]);
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);
  
  const [globalActiveTask, setGlobalActiveTask] = useState<TaskItem | null>(null);
  
  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [workLeftSeconds, setWorkLeftSeconds] = useState(0);

  // --- 1. SYNC WITH DB LOAD (With Smart Merge) ---
  useEffect(() => {
    if (initialData) {
      // A. Prepare raw lists from DB
      let newSchedule = initialData.scheduleTasks || [];
      let newDaily = initialData.dailyActions || [];
      
      setTimerEvents(initialData.timerEvents || []);

      // B. SMART MERGE: 
      // If we have a running Global Task, we must OVERRIDE the DB data for that specific task.
      // This prevents the UI from flickering to "Pending" or jumping back in time.
      if (globalActiveTask) {
         // Sync Schedule List
         newSchedule = newSchedule.map((t: TaskItem) => 
            t.id === globalActiveTask.id 
              ? { ...t, ...globalActiveTask, status: 'in_progress' } // Force Active State
              : t
         );

         // Sync Daily List
         newDaily = newDaily.map((t: TaskItem) => 
            t.id === globalActiveTask.id 
              ? { ...t, ...globalActiveTask, status: 'in_progress' } 
              : t
         );
      } else {
         // If no global task is running locally, check if the DB thinks one is running
         // (This handles fresh page reloads)
         const localActive = 
            newSchedule.find((t: any) => t.status === 'in_progress') || 
            newDaily.find((t: any) => t.status === 'in_progress');
         
         if (localActive) {
            setGlobalActiveTask(localActive);
         }
      }

      setScheduleTasks(newSchedule);
      setDailyActions(newDaily);
      
    } else {
      setScheduleTasks([]);
      setDailyActions([]);
      setTimerEvents([]);
    }
  }, [initialData]); // We exclude globalActiveTask to avoid infinite loops, handled by logic above

  // --- 2. INITIAL FETCH (Persistence) ---
  useEffect(() => {
    api.apiGetGlobalActiveTask().then(task => {
      if (task) setGlobalActiveTask(task);
    });
  }, []);

  // Derived Stats
  const totalVolumeSeconds = 
    scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) + 
    dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- 3. TIMER ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNow();
      
      // A. Tick Global Task
      if (globalActiveTask) {
        // 1. Tick the Global Ghost
        const updatedGlobal = { ...globalActiveTask, elapsedSeconds: globalActiveTask.elapsedSeconds + 1 };
        setGlobalActiveTask(updatedGlobal);

        // 2. Tick the UI List (Force Status 'in_progress')
        const updater = (list: TaskItem[]) => list.map(t => 
          t.id === globalActiveTask.id 
             ? { ...t, elapsedSeconds: updatedGlobal.elapsedSeconds, status: 'in_progress' } // <--- FIX HERE
             : t
        );
        
        if (globalActiveTask.isDaily) setDailyActions(prev => updater(prev));
        else setScheduleTasks(prev => updater(prev));
      }

      // B. Recalculate Capacity
      if (dayStatus === 'active') {
          const currentStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const currentMins = getAdjustedMinutes(currentStr);
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
  }, [globalActiveTask, dayStatus, scheduleTasks, dailyActions]);

  // --- 4. ACTIONS ---

const toggleTask = async (id: string, isDaily: boolean) => {
    // A. STOP LOGIC (If something is running)
    if (globalActiveTask) {
       // 1. Stop in DB (Using new Robust Helper)
       // We pass the CURRENT elapsedSeconds from our local state, which is accurate
       await api.apiStopTask(globalActiveTask.id, globalActiveTask.elapsedSeconds);

       // 2. Clear Global State
       const stoppingId = globalActiveTask.id;
       setGlobalActiveTask(null);

       // 3. Update Local UI
       const stopFn = (list: TaskItem[]) => list.map(t => t.id === stoppingId ? { ...t, status: 'pending' as const } : t);
       if (globalActiveTask.isDaily) setDailyActions(stopFn);
       else setScheduleTasks(stopFn);

       if (stoppingId === id) return;
    }

    // B. START LOGIC
    const targetList = isDaily ? dailyActions : scheduleTasks;
    const target = targetList.find(t => t.id === id);
    
    if (target) {
       // 1. Set Global State
       const startedTask = { ...target, status: 'in_progress' as const };
       setGlobalActiveTask(startedTask);

       // 2. Update Local UI
       const startFn = (list: TaskItem[]) => list.map(t => t.id === id ? { ...t, status: 'in_progress' as const } : t);
       if (isDaily) setDailyActions(startFn);
       else setScheduleTasks(startFn);

       // 3. Start in DB (Using new Robust Helper)
       await api.apiStartTask(id);
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
      const taskId = modalConfig.initialData!.id!;
      
      // If we are updating the CURRENTLY RUNNING task, we must update the Global State too
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
    // If deleting the active task, clear global state
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
    flexCapacitySeconds, workLeftSeconds, totalVolumeSeconds,
    setScheduleTasks, setDailyActions, setTimerEvents,
    toggleTask, toggleComplete, saveTask, deleteTask
  };
}