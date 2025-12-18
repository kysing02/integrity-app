"use client";

import { useState, useEffect } from 'react';
import { 
  Pencil, BookOpen, Brush, Plus, Clock, Brain, Users, Dumbbell, Sun, Edit3, Lock, Check, Sparkles, LogOut, Coffee
} from 'lucide-react';

import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getTaskRemainingSeconds, getTodayDateAtTime } from '@/lib/timeUtils';

// --- DEBUG CONFIG ---
const DEBUG_TIME = "08:00"; 

// --- INITIAL DATA ---
const INITIAL_SCHEDULE: TaskItem[] = [
  { id: 's2', title: "Deep Work", timeRange: "09:00 - 09:01", score: 0, status: "pending", category: "CONSISTENCY", icon: Brain, elapsedSeconds: 0 },
  { id: 's3', title: "Strategy Meeting", timeRange: "13:00 - 14:00", score: 0, status: "pending", category: "EFFICIENCY", icon: Users, elapsedSeconds: 0 },
  { id: 's4', title: "Fitness", timeRange: "17:30 - 18:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Dumbbell, elapsedSeconds: 0 },
];

const INITIAL_DAILY: TaskItem[] = [
  { id: 'd1', title: "Study", timeRange: "1h 30m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Pencil, isDaily: true, elapsedSeconds: 0 },
  { id: 'd2', title: "Read", timeRange: "1m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: BookOpen, isDaily: true, elapsedSeconds: 0 }, 
  { id: 'd3', title: "Tidy Room", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Brush, isDaily: true, elapsedSeconds: 0 },
];

export default function Dashboard() {
  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('sleeping');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const [hasSchedule, setHasSchedule] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isPast, setIsPast] = useState(false);
  
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>(INITIAL_SCHEDULE);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>(INITIAL_DAILY);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);

  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');
  
  const totalVolumeSeconds = 
    scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0) +
    dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);

  // --- HELPER: Get "Current" Time (Debug-aware) ---
  const getNow = () => {
    const now = new Date();
    if (DEBUG_TIME) {
      const [h, m] = DEBUG_TIME.split(':').map(Number);
      now.setHours(h, m, 0, 0);
    }
    return now;
  };

  // --- TIMER ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      const now = getNow(); // Use debug time
      
      // 1. Update Active Timer
      if (activeTask) {
         const updateList = (list: TaskItem[]) => list.map(t => {
            if (t.id === activeTask.id) return { ...t, elapsedSeconds: t.elapsedSeconds + 1 };
            return t;
         });
         if (activeTask.isDaily) setDailyActions(prev => updateList(prev));
         else setScheduleTasks(prev => updateList(prev));
      }

      // 2. Calculate Flex Capacity
      if (dayStatus === 'active') {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const timeLeft = (24 * 3600) - secondsSinceMidnight;

        const remainingScheduleLoad = scheduleTasks.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);
        const remainingDailyLoad = dailyActions.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);

        setFlexCapacitySeconds(Math.max(0, timeLeft - remainingScheduleLoad - remainingDailyLoad));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, scheduleTasks, dailyActions, dayStatus]);

  // --- HANDLERS ---
  const handleStartDay = () => {
    setDayStatus('active');
    setCheckInTime(getNow());
  };

  const handleEndDay = () => {
    if (confirm("End your day? This will lock your timeline.")) {
      setDayStatus('completed');
    }
  };

  const handleToggleTask = (id: string, isDailyAction: boolean) => {
    if (isEditing || isEditingActions) return; 
    const toggleList = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'in_progress' ? 'pending' : 'in_progress' } as TaskItem;
      if (t.status === 'in_progress') return { ...t, status: 'pending' } as TaskItem;
      return t;
    });
    if (isDailyAction) {
      setDailyActions(prev => toggleList(prev));
      setScheduleTasks(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status })));
    } else {
      setScheduleTasks(prev => toggleList(prev));
      setDailyActions(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status })));
    }
  };

  const handleToggleComplete = (id: string, isDailyAction: boolean) => {
    if (isEditing || isEditingActions) return;
    const toggleList = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as TaskItem;
      return t;
    });
    if (isDailyAction) setDailyActions(prev => toggleList(prev));
    else setScheduleTasks(prev => toggleList(prev));
  };

  // CRUD Handlers
  const handleDeleteTask = (id: string) => setScheduleTasks(prev => prev.filter(t => t.id !== id));
  const handleInsertTask = (index: number) => {
    const newTask: TaskItem = { id: Math.random().toString(), title: "New Task", timeRange: "--:--", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Brain, elapsedSeconds: 0 };
    const newTasks = [...scheduleTasks]; newTasks.splice(index + 1, 0, newTask); setScheduleTasks(newTasks);
  };
  const handleAddDailyAction = () => {
    const newAction: TaskItem = { id: Math.random().toString(), title: "New Action", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Sparkles, isDaily: true, elapsedSeconds: 0 };
    setDailyActions([...dailyActions, newAction]);
  };
  const handleDeleteDailyAction = (id: string) => setDailyActions(prev => prev.filter(a => a.id !== id));
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newItems = [...dailyActions]; const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1); newItems.splice(index, 0, draggedItem);
    setDraggedItemIndex(index); setDailyActions(newItems);
  };
  const handleDrop = () => setDraggedItemIndex(null);

  // --- UI VALUES ---
  
  // Dynamic Pill State Calculation
  const pillState = (() => {
    if (dayStatus === 'sleeping') return { text: "Ready for your day?", color: "text-slate-500 border-slate-200 bg-white" };
    if (dayStatus === 'completed') return { text: "Day Completed", color: "text-emerald-600 border-emerald-200 bg-emerald-50" };
    if (!hasSchedule) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };

    const now = getNow();
    let currentTask: TaskItem | null = null;
    let nextTask: TaskItem | null = null;
    let minDiff = Infinity;

    // Filter range-based scheduled tasks
    const timedTasks = scheduleTasks.filter(t => t.timeRange.includes('-'));

    for (const task of timedTasks) {
      const [startStr, endStr] = task.timeRange.split(' - ');
      const start = getTodayDateAtTime(startStr);
      const end = getTodayDateAtTime(endStr);
      
      // Align date part to 'now' (crucial for debug consistency)
      start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      end.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Current Task Logic: We are physically inside this time slot
      if (now >= start && now < end) {
        currentTask = task;
        // We break here because "Now" takes precedence over "Next"
        break; 
      }

      // 2. Next Task Logic:
      // Check if task is in FUTURE AND NOT COMPLETED
      // If you deleted the task, it won't exist in 'timedTasks', so it's handled automatically.
      if (now < start && task.status !== 'completed') {
        const diff = start.getTime() - now.getTime();
        if (diff < minDiff) {
          minDiff = diff;
          nextTask = task;
        }
      }
    }

    // SCENARIO 1: We are in a task right now
    if (currentTask) {
       // Optional: You could check currentTask.status here too. 
       // If completed, maybe show "Free Time (Finished Early)"? 
       // For now, "Now: [Title]" is safest.
       return { text: `Now: ${currentTask.title}`, color: "text-emerald-600 border-emerald-200 bg-white" };
    }

    // SCENARIO 2: We found a valid upcoming task
    if (nextTask) {
       const diffMins = Math.ceil(minDiff / (1000 * 60));
       const hrs = Math.floor(diffMins / 60);
       const mins = diffMins % 60;
       
       let timeStr = "";
       if (hrs > 0) timeStr += `${hrs}h `;
       if (mins > 0 || hrs === 0) timeStr += `${mins}m`;
       
       return { text: `Next: ${nextTask.title} in ${timeStr.trim()}`, color: "text-indigo-500 border-indigo-100 bg-white" };
    }

    // SCENARIO 3: No future tasks pending
    return { text: "No pending tasks", color: "text-slate-400 border-slate-200 bg-slate-50" };
  })();
  const formatCheckInTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      <DashboardHeader 
        hasSchedule={hasSchedule} 
        isPast={isPast} 
        isEditing={isEditing} 
        isEditingActions={isEditingActions} 
        onFinishEdit={() => { setIsEditing(false); setIsEditingActions(false); }}
      />

      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${pillState.color}`}>
              <Clock size={12} />
              <span>{pillState.text}</span>
            </div>

            <TimelineRibbon 
              showCurrentTime={dayStatus === 'active'} 
              tasks={scheduleTasks} 
              plannedCheckIn="07:00"
              plannedSleep="23:00"
              debugTime={DEBUG_TIME}
            />

            <div className="px-6 mt-4">
              
              {/* --- START DAY GATEKEEPER --- */}
              {dayStatus === 'sleeping' ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center mb-6">
                      <Coffee size={32} className="text-indigo-500" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2">Good Morning</h2>
                   <p className="text-sm text-slate-400 mb-8 max-w-[200px] text-center">Your timeline is waiting. Ready to start?</p>
                   <button 
                     onClick={handleStartDay}
                     className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2"
                   >
                     <Sun size={18} />
                     <span>Start Day</span>
                   </button>
                </div>
              ) : (
                <>
                  <section className="mb-10 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Timeline</h2>
                      {hasSchedule && !isEditing && (
                        <button onClick={() => setIsEditing(true)} disabled={isEditingActions} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditingActions ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                          <Edit3 size={12} /><span>Edit Schedule</span>
                        </button>
                      )}
                      {isEditing && <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"><Check size={12} /><span>Save Changes</span></button>}
                    </div>

                    {hasSchedule ? (
                      <div className="space-y-0">
                        {/* 1. CHECK-IN MARKER */}
                        <TaskRow 
                          id="check-in" 
                          title={`Checked-in at ${formatCheckInTime(checkInTime)}`} 
                          timeRange="07:00" 
                          progress={100} status="completed" category="CONSISTENCY" icon={Sun} variant="marker"
                          isLast={false}
                        />

                        {/* 2. SCHEDULED TASKS */}
                        {scheduleTasks.map((task, index) => {
                          const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
                          const totalSecs = parseDurationToSeconds(task.timeRange);
                          const progressPct = totalSecs > 0 ? (task.elapsedSeconds / totalSecs) * 100 : 0;

                          return (
                            <div key={task.id} onClick={() => !isEditing && task.status !== 'completed' && handleToggleTask(task.id, false)}>
                              <TaskRow 
                                id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                                progress={Math.min(progressPct, 100)} 
                                isLast={false} 
                                isEditing={isEditing} isLocked={isTaskLocked}
                                onDelete={() => handleDeleteTask(task.id)} onInsert={() => handleInsertTask(index)}
                                onToggleComplete={() => handleToggleComplete(task.id, false)}
                              />
                            </div>
                          );
                        })}

                        {/* 3. END DAY BUTTON */}
                        <div className="pt-4 flex flex-col items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-300">23:00</span>
                           <button 
                             onClick={handleEndDay}
                             className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95"
                           >
                             <LogOut size={16} />
                             <span>Call it a day</span>
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                         {/* Empty State */}
                      </div>
                    )}
                  </section>

                  {/* DAILY ACTIONS */}
                  <section className="mb-10 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Actions</h2>
                      {!isEditingActions ? (
                        <button onClick={() => setIsEditingActions(true)} disabled={isEditing} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditing ? 'text-slate-300 bg-slate-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                          <Edit3 size={12} /><span>Edit Actions</span>
                        </button>
                      ) : (
                        <button onClick={() => setIsEditingActions(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"><Check size={12} /><span>Save Changes</span></button>
                      )}
                    </div>

                    <div className="-mx-6 mb-4"> 
                      <FlexBucket 
                        totalVolumeSeconds={totalVolumeSeconds} 
                        flexCapacitySeconds={flexCapacitySeconds}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {hasSchedule && dailyActions.map((action, index) => {
                        const totalSecs = parseDurationToSeconds(action.timeRange);
                        const rawProgress = totalSecs > 0 ? (action.elapsedSeconds / totalSecs) * 100 : 0;
                        return (
                          <TaskCircle 
                            key={action.id} title={action.title} duration={action.timeRange} Icon={action.icon} category={action.category} 
                            progress={Math.min(rawProgress, 100)} isActive={action.status === 'in_progress'} onClick={() => handleToggleTask(action.id, true)}
                            isEditing={isEditingActions} onDelete={() => handleDeleteDailyAction(action.id)}
                            onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={handleDrop}
                            isCompleted={action.status === 'completed'} onLongPress={() => handleToggleComplete(action.id, true)}
                          />
                        );
                      })}
                      
                      {isEditingActions && (
                        <div onClick={handleAddDailyAction} className="flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform">
                          <div className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all shadow-sm"><Plus size={24} /></div>
                          <p className="text-xs font-bold text-slate-300">Add New</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
        </div>
      </div> 

      <DashboardNavbar activeTask={activeTask} />
    </main>
  );
}