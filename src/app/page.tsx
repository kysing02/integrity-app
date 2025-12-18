"use client";

import { useState, useEffect } from 'react';
import { 
  Pencil, BookOpen, Brush, Plus, Clock, Brain, Users, Dumbbell, Sun, Edit3, Lock, Check, Sparkles, LogOut
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
// Testing Scenario: Current time is 13:30
const DEBUG_TIME = "13:30"; 

// --- INITIAL DATA ---
const INITIAL_SCHEDULE: TaskItem[] = [
  // Example Task 1: Past Event (09:00 - 11:30)
  { id: 's1', title: "Meeting with Coworker", timeRange: "09:00 - 11:30", score: 0, status: "completed", category: "EFFICIENCY", icon: Users, elapsedSeconds: 9000 },
  // Example Task 2: Current Event (13:00 - 14:00)
  { id: 's2', title: "Deep Work", timeRange: "13:00 - 14:00", score: 0, status: "in_progress", category: "CONSISTENCY", icon: Brain, elapsedSeconds: 1800 },
  // Future Task
  { id: 's4', title: "Fitness", timeRange: "17:30 - 18:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Dumbbell, elapsedSeconds: 0 },
];

const INITIAL_DAILY: TaskItem[] = [
  { id: 'd1', title: "Study", timeRange: "1h 30m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Pencil, isDaily: true, elapsedSeconds: 0 },
  { id: 'd2', title: "Read", timeRange: "1m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: BookOpen, isDaily: true, elapsedSeconds: 0 }, 
  { id: 'd3', title: "Tidy Room", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Brush, isDaily: true, elapsedSeconds: 0 },
];

export default function Dashboard() {
  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('active');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  // FIX: Hydration safe logic for initialization
  useEffect(() => {
    const d = new Date(); 
    d.setHours(7,0,0,0); 
    setCheckInTime(d);
  }, []);

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

  // --- HELPER: Get "Current" Time ---
  const getNow = () => {
    const now = new Date();
    if (DEBUG_TIME) {
      const [h, m] = DEBUG_TIME.split(':').map(Number);
      now.setHours(h, m, 0, 0);
    }
    return now;
  };

  // --- HELPER: Check if a time is in the past ---
  const isTimeInPast = (timeStr: string) => {
    if (!timeStr) return false;
    const now = getNow();
    const timeDate = getTodayDateAtTime(timeStr);
    timeDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    return timeDate <= now;
  };

  // --- HELPER: Safely Extract Start Time ---
  const getTaskStartTime = (task: TaskItem) => {
    const parts = task.timeRange.split('-');
    return parts[0].trim();
  };

  // --- TIMER ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      const now = getNow();
      
      if (activeTask) {
         const updateList = (list: TaskItem[]) => list.map(t => {
            if (t.id === activeTask.id) return { ...t, elapsedSeconds: t.elapsedSeconds + 1 };
            return t;
         });
         if (activeTask.isDaily) setDailyActions(prev => updateList(prev));
         else setScheduleTasks(prev => updateList(prev));
      }

      if (dayStatus === 'active') {
        const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
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
  const handleStartDay = () => { setDayStatus('active'); setCheckInTime(getNow()); };
  const handleEndDay = () => { if (confirm("End your day?")) setDayStatus('completed'); };
  const handleToggleTask = (id: string, isDailyAction: boolean) => {
    if (isEditing || isEditingActions) return; 
    const toggleList = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'in_progress' ? 'pending' : 'in_progress' } as TaskItem;
      if (t.status === 'in_progress') return { ...t, status: 'pending' } as TaskItem;
      return t;
    });
    if (isDailyAction) { setDailyActions(prev => toggleList(prev)); setScheduleTasks(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); } 
    else { setScheduleTasks(prev => toggleList(prev)); setDailyActions(prev => prev.map(t => ({ ...t, status: t.status === 'in_progress' ? 'pending' : t.status }))); }
  };
  const handleToggleComplete = (id: string, isDailyAction: boolean) => {
    if (isEditing || isEditingActions) return;
    const toggleList = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as TaskItem;
      return t;
    });
    if (isDailyAction) setDailyActions(prev => toggleList(prev)); else setScheduleTasks(prev => toggleList(prev));
  };
  const handleDeleteTask = (id: string) => setScheduleTasks(prev => prev.filter(t => t.id !== id));
  const handleInsertTask = (index: number) => {
    const newTask: TaskItem = { id: Math.random().toString(), title: "New Task", timeRange: "--:--", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Brain, elapsedSeconds: 0 };
    const newTasks = [...scheduleTasks]; 
    if (index === -1) { newTasks.unshift(newTask); } else { newTasks.splice(index + 1, 0, newTask); }
    setScheduleTasks(newTasks);
  };
  const handleAddDailyAction = () => {
    const newAction: TaskItem = { id: Math.random().toString(), title: "New Action", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Sparkles, isDaily: true, elapsedSeconds: 0 };
    setDailyActions([...dailyActions, newAction]);
  };
  const handleDeleteDailyAction = (id: string) => setDailyActions(prev => prev.filter(a => a.id !== id));
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === index) return; const newItems = [...dailyActions]; const draggedItem = newItems[draggedItemIndex]; newItems.splice(draggedItemIndex, 1); newItems.splice(index, 0, draggedItem); setDraggedItemIndex(index); setDailyActions(newItems); };
  const handleDrop = () => setDraggedItemIndex(null);

  // --- UI VALUES ---
  const pillState = (() => {
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
      if (now < start && task.status !== 'completed') { const diff = start.getTime() - now.getTime(); if (diff < minDiff) { minDiff = diff; nextTask = task; } }
    }

    if (currentTask) return { text: `Now: ${currentTask.title}`, color: "text-emerald-600 border-emerald-200 bg-white" };
    if (nextTask) {
       const diffMins = Math.ceil(minDiff / (1000 * 60));
       const hrs = Math.floor(diffMins / 60); const mins = diffMins % 60;
       let timeStr = ""; if (hrs > 0) timeStr += `${hrs}h `; if (mins > 0 || hrs === 0) timeStr += `${mins}m`;
       return { text: `Next: ${nextTask.title} in ${timeStr.trim()}`, color: "text-indigo-500 border-indigo-100 bg-white" };
    }
    return { text: "No pending tasks", color: "text-slate-400 border-slate-200 bg-slate-50" };
  })();

  const formatCheckInTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      <DashboardHeader hasSchedule={hasSchedule} isPast={isPast} isEditing={isEditing} isEditingActions={isEditingActions} onFinishEdit={() => { setIsEditing(false); setIsEditingActions(false); }} />
      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${pillState.color}`}>
              <Clock size={12} />
              <span>{pillState.text}</span>
            </div>

            <TimelineRibbon showCurrentTime={dayStatus === 'active'} tasks={scheduleTasks} plannedCheckIn="07:00" plannedSleep="23:00" debugTime={DEBUG_TIME} />

            <div className="px-6 mt-4">
              {dayStatus === 'sleeping' ? null : (
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
                        {(() => {
                            // Check-in (+) Logic:
                            // Check if the FIRST scheduled task has already started
                            const firstTask = scheduleTasks[0];
                            const isFirstTaskStarted = firstTask ? isTimeInPast(getTaskStartTime(firstTask)) : false;
                            
                            return (
                                <TaskRow 
                                    id="check-in" 
                                    title={`Checked-in at ${formatCheckInTime(checkInTime)}`} 
                                    timeRange="07:00" 
                                    progress={100} score={0} status="completed" category="CONSISTENCY" icon={Sun} variant="marker"
                                    isLast={false}
                                    isEditing={isEditing}
                                    isInsertionPointPast={isFirstTaskStarted} // NEW LOGIC
                                    onInsert={() => handleInsertTask(-1)}
                                />
                            );
                        })()}

                        {/* 2. SCHEDULED TASKS */}
                        {scheduleTasks.map((task, index) => {
                          const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
                          const totalSecs = parseDurationToSeconds(task.timeRange);
                          const progressPct = totalSecs > 0 ? (task.elapsedSeconds / totalSecs) * 100 : 0;

                          // LOGIC: Disable (+) if the NEXT task has already started.
                          const nextTask = scheduleTasks[index + 1];
                          let isInsertionBlocked = false;

                          if (nextTask) {
                             const nextStartStr = getTaskStartTime(nextTask);
                             // If next task started in past (e.g., 13:00) vs Now (13:30), block insertion.
                             if (isTimeInPast(nextStartStr)) {
                                 isInsertionBlocked = true;
                             }
                          } else {
                             // No next task = Space is available (unless end of day logic required, but usually open)
                             isInsertionBlocked = false;
                          }

                          return (
                            <div key={task.id} onClick={() => !isEditing && task.status !== 'completed' && handleToggleTask(task.id, false)}>
                              <TaskRow 
                                id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                                progress={Math.min(progressPct, 100)} 
                                isLast={false} 
                                isEditing={isEditing} 
                                isLocked={isTaskLocked}
                                isInsertionPointPast={isInsertionBlocked} // UPDATED LOGIC PASSED HERE
                                onDelete={() => handleDeleteTask(task.id)} 
                                onInsert={() => handleInsertTask(index)}
                                onToggleComplete={() => handleToggleComplete(task.id, false)}
                              />
                            </div>
                          );
                        })}

                        {/* 3. END DAY BUTTON */}
                        <div className="pt-4 flex flex-col items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-300">23:00</span>
                           <button onClick={handleEndDay} className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95">
                             <LogOut size={16} /><span>Call it a day</span>
                           </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                  
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
                    {/* ... Rest of Daily Actions ... */}
                     <div className="-mx-6 mb-4"> 
                      <FlexBucket totalVolumeSeconds={totalVolumeSeconds} flexCapacitySeconds={flexCapacitySeconds} />
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