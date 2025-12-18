"use client";

import { useState, useEffect } from 'react';
import { 
  Pencil, BookOpen, Brush, Plus, Clock, Brain, Users, Dumbbell, Sun, Moon, Edit3, Lock, AlertCircle, Check, Sparkles
} from 'lucide-react';

// Components
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

// Utils & Types
import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getTodayDateAtTime, getTaskRemainingSeconds } from '@/lib/timeUtils';

// --- Initial Data ---
const INITIAL_SCHEDULE: TaskItem[] = [
  { id: 's1', title: "Wake Up", timeRange: "07:00", score: 100, status: "completed", category: "CONSISTENCY", icon: Sun, elapsedSeconds: 0 },
  { id: 's2', title: "Deep Work", timeRange: "09:00 - 11:30", score: 96, status: "completed", category: "CONSISTENCY", icon: Brain, elapsedSeconds: 9000 },
  { id: 's3', title: "Strategy Meeting", timeRange: "13:00 - 14:00", score: 98, status: "in_progress", category: "EFFICIENCY", icon: Users, elapsedSeconds: 600 },
  { id: 's4', title: "Fitness", timeRange: "17:30 - 17:31", score: 0, status: "pending", category: "CONSISTENCY", icon: Dumbbell, elapsedSeconds: 0 },
  { id: 's5', title: "Sleep", timeRange: "23:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Moon, elapsedSeconds: 0 }
];

const INITIAL_DAILY: TaskItem[] = [
  { id: 'd1', title: "Study", timeRange: "1h 30m", score: 45, status: 'pending', category: 'CONSISTENCY', icon: Pencil, isDaily: true, elapsedSeconds: 2700 },
  { id: 'd2', title: "Read", timeRange: "1m", score: 20, status: 'pending', category: 'CONSISTENCY', icon: BookOpen, isDaily: true, elapsedSeconds: 0 }, 
  { id: 'd3', title: "Tidy Room", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Brush, isDaily: true, elapsedSeconds: 0 },
];

export default function Dashboard() {
  const [hasSchedule, setHasSchedule] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isPast, setIsPast] = useState(false);
  
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>(INITIAL_SCHEDULE);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>(INITIAL_DAILY);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');

  const [flexCapacitySeconds, setFlexCapacitySeconds] = useState(0);
  const [totalFlexSeconds, setTotalFlexSeconds] = useState(0); // The "Budget" for the day

  // --- 1. INITIALIZE FLEX BUDGET (Run once or when schedule changes) ---
  useEffect(() => {
    // Calculate total time assigned to tasks (Static)
    const scheduleLoad = scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);
    const dailyLoad = dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);
    
    // Total Flex = 24h - Commitments
    const daySeconds = 24 * 60 * 60;
    setTotalFlexSeconds(Math.max(0, daySeconds - scheduleLoad - dailyLoad));
  }, [scheduleTasks, dailyActions]);

  // --- TIMER ENGINE & FLEX CALCULATION ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Run this loop even if no task is active to update "Time Left in Day"
    interval = setInterval(() => {
      const now = new Date();
      
      // 1. Update Active Task Elapsed Time (Existing Logic)
      if (activeTask) {
         const updateList = (list: TaskItem[]) => list.map(t => {
            if (t.id === activeTask.id) return { ...t, elapsedSeconds: t.elapsedSeconds + 1 };
            return t;
         });
         if (activeTask.isDaily) setDailyActions(prev => updateList(prev));
         else setScheduleTasks(prev => updateList(prev));
      }

      // 2. CALCULATE FLEX CAPACITY (The "Space Remaining" Formula)
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const secondsLeftInDay = (midnight.getTime() - now.getTime()) / 1000;

      // Sum of FUTURE obligations only
      const remainingScheduleLoad = scheduleTasks.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);
      const remainingDailyLoad = dailyActions.reduce((acc, t) => acc + getTaskRemainingSeconds(t, now), 0);

      // Flex = Time Left - Work Left
      const currentFlex = Math.max(0, secondsLeftInDay - remainingScheduleLoad - remainingDailyLoad);
      setFlexCapacitySeconds(currentFlex);

    }, 1000);

    return () => clearInterval(interval);
  }, [activeTask, scheduleTasks, dailyActions]);

  // --- CALCULATE TOTAL VOLUME (For the "Bar Fill" - Diligence) ---
  const scheduleLoad = scheduleTasks.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);
  const dailyLoad = dailyActions.reduce((acc, t) => acc + parseDurationToSeconds(t.timeRange), 0);
  const totalVolumeSeconds = scheduleLoad + dailyLoad;

  // --- HANDLERS ---
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

  const handleBuildSchedule = () => {
    setScheduleTasks([
      { id: 's1', title: "Wake Up", timeRange: "07:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Sun, elapsedSeconds: 0 },
      { id: 's99', title: "Sleep", timeRange: "23:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Moon, elapsedSeconds: 0 }
    ]);
    setHasSchedule(true);
    setIsEditing(true); 
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Delete this scheduled task?")) setScheduleTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleInsertTask = (index: number) => {
    const newTask: TaskItem = {
      id: Math.random().toString(), title: "New Task", timeRange: "--:--", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Brain, elapsedSeconds: 0
    };
    const newTasks = [...scheduleTasks];
    newTasks.splice(index + 1, 0, newTask);
    setScheduleTasks(newTasks);
  };

  const handleAddDailyAction = () => {
    const newAction: TaskItem = {
      id: Math.random().toString(), title: "New Action", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Sparkles, isDaily: true, elapsedSeconds: 0
    };
    setDailyActions([...dailyActions, newAction]);
  };

  const handleDeleteDailyAction = (id: string) => setDailyActions(prev => prev.filter(a => a.id !== id));
  
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newItems = [...dailyActions];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    setDailyActions(newItems);
  };
  const handleDrop = () => setDraggedItemIndex(null);

  // Pill State
  const pillState = (() => {
    if (hasSchedule) return { text: "Next: Meeting in 45m", color: "text-indigo-500 border-indigo-100 bg-white" };
    if (!hasSchedule) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };
    return { text: "Tomorrow", color: "text-slate-400 border-slate-200 bg-slate-50" };
  })();

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

            <TimelineRibbon showCurrentTime={hasSchedule} />

            <div className="px-6 mt-4">
              <section className="mb-10">
                <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Timeline</h2>
                  {hasSchedule && !isEditing && !isPast && (
                    <button onClick={() => setIsEditing(true)} disabled={isEditingActions} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditingActions ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                      <Edit3 size={12} /><span>Edit Schedule</span>
                    </button>
                  )}
                  {isPast && <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full"><Lock size={12} /><span>Locked</span></div>}
                  {isEditing && <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in duration-200"><Check size={12} /><span>Save Changes</span></button>}
                </div>

                {hasSchedule ? (
                  <div className="space-y-0">
                    {scheduleTasks.map((task, index) => {
                      const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
                      const isCurrentSlot = task.id === 's3'; 
                      return (
                        <div key={task.id} onClick={() => !isEditing && task.status !== 'completed' && handleToggleTask(task.id, false)}>
                          <TaskRow 
                            id={task.id} title={task.title} timeRange={task.timeRange} score={task.score} status={task.status} 
                            category={task.category} icon={task.icon} isLast={index === scheduleTasks.length - 1}
                            isEditing={isEditing} isLocked={isTaskLocked} isCurrentTimeSlot={isCurrentSlot}
                            onDelete={() => handleDeleteTask(task.id)} onInsert={() => handleInsertTask(index)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm"><AlertCircle size={32} /></div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Timeline Empty</h3>
                    <p className="text-xs text-slate-400 text-center max-w-[220px] mb-6">Review the ribbon above and define your contract for the day.</p>
                    <button onClick={handleBuildSchedule} className="bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-2"><Plus size={16} />Build Schedule</button>
                  </div>
                )}
              </section>
              
              {/* DAILY ACTIONS */}
              <section className="mb-10 pt-6 border-t border-slate-200">
                {/* ... Header ... */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Actions</h2>
                  {!isEditingActions ? (
                    <button onClick={() => setIsEditingActions(true)} disabled={isEditing} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditing ? 'text-slate-300 bg-slate-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                      <Edit3 size={12} /><span>Edit Actions</span>
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingActions(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in duration-200">
                      <Check size={12} /><span>Save Changes</span>
                    </button>
                  )}
                </div>

                <div className="-mx-6 mb-4"> 
                  {/* Pass BOTH metrics: Volume (Past+Future Plan) and Capacity (Future Space) */}
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
                      />
                    );
                  })}
                  <div onClick={handleAddDailyAction} className="flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all shadow-sm"><Plus size={24} /></div>
                    <p className="text-xs font-bold text-slate-300">Add New</p>
                  </div>
                </div>
              </section>
            </div>
        </div>
      </div> 

      <DashboardNavbar activeTask={activeTask} />
    </main>
  );
}