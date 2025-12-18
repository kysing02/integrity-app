"use client";

import { useState } from 'react';
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import { 
  Pencil, BookOpen, Brush, Plus, ChevronLeft, ChevronRight, Calendar, Settings, Layout, Bot, BarChart3, Clock, Brain, Users, Dumbbell, Sun, Moon, Edit3, Lock, AlertCircle, Check, Save, Play, Sparkles
} from 'lucide-react';

// --- Types ---
interface TaskItem {
  id: string;
  title: string;
  timeRange: string; 
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  category: 'EFFICIENCY' | 'CONSISTENCY';
  icon: any;
  isDaily?: boolean; 
}

// --- Initial Data ---
const INITIAL_SCHEDULE: TaskItem[] = [
  { id: 's1', title: "Wake Up", timeRange: "07:00", score: 100, status: "completed", category: "CONSISTENCY", icon: Sun },
  { id: 's2', title: "Deep Work", timeRange: "09:00 - 11:30", score: 96, status: "completed", category: "CONSISTENCY", icon: Brain },
  { id: 's3', title: "Strategy Meeting", timeRange: "13:00 - 14:00", score: 98, status: "in_progress", category: "EFFICIENCY", icon: Users },
  { id: 's4', title: "Fitness", timeRange: "17:30 - 18:30", score: 0, status: "pending", category: "CONSISTENCY", icon: Dumbbell },
  { id: 's5', title: "Sleep", timeRange: "23:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Moon }
];

const INITIAL_DAILY: TaskItem[] = [
  { id: 'd1', title: "Study", timeRange: "1h 30m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: Pencil, isDaily: true },
  { id: 'd2', title: "Read", timeRange: "45m", score: 0, status: 'pending', category: 'CONSISTENCY', icon: BookOpen, isDaily: true },
  { id: 'd3', title: "Admin", timeRange: "30m", score: 0, status: 'pending', category: 'EFFICIENCY', icon: Brush, isDaily: true },
];

export default function Dashboard() {
  const [hasSchedule, setHasSchedule] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false); // NEW STATE for Daily Actions
  const [isPast, setIsPast] = useState(false);
  
  // State for both lists
  const [scheduleTasks, setScheduleTasks] = useState<TaskItem[]>(INITIAL_SCHEDULE);
  const [dailyActions, setDailyActions] = useState<TaskItem[]>(INITIAL_DAILY);
  
  // For Drag and Drop
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const activeTask = [...scheduleTasks, ...dailyActions].find(t => t.status === 'in_progress');

  // --- Handlers ---

  const handleToggleTask = (id: string, isDailyAction: boolean) => {
    if (isEditing || isEditingActions) return; 

    const toggleList = (list: TaskItem[]) => list.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'in_progress' ? 'pending' : 'in_progress' } as TaskItem;
      }
      if (t.status === 'in_progress') {
        return { ...t, status: 'pending' } as TaskItem;
      }
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
      { id: 's1', title: "Wake Up", timeRange: "07:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Sun },
      { id: 's99', title: "Sleep", timeRange: "23:00", score: 0, status: "pending", category: "CONSISTENCY", icon: Moon }
    ]);
    setHasSchedule(true);
    setIsEditing(true); 
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Delete this scheduled task?")) {
      setScheduleTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleInsertTask = (index: number) => {
    const newTask: TaskItem = {
      id: Math.random().toString(),
      title: "New Task",
      timeRange: "--:--",
      score: 0,
      status: 'pending',
      category: 'CONSISTENCY',
      icon: Brain
    };
    const newTasks = [...scheduleTasks];
    newTasks.splice(index + 1, 0, newTask);
    setScheduleTasks(newTasks);
  };

  // --- DAILY ACTION HANDLERS ---

  const handleAddDailyAction = () => {
    const newAction: TaskItem = {
      id: Math.random().toString(),
      title: "New Action",
      timeRange: "30m",
      score: 0,
      status: 'pending',
      category: 'EFFICIENCY',
      icon: Sparkles, // Template Icon
      isDaily: true
    };
    setDailyActions([...dailyActions, newAction]);
  };

  const handleDeleteDailyAction = (id: string) => {
    setDailyActions(prev => prev.filter(a => a.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    // Reorder Logic
    const newItems = [...dailyActions];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setDailyActions(newItems);
  };

  const handleDrop = () => {
    setDraggedItemIndex(null);
  };

  const getPillState = () => {
    if (hasSchedule) return { text: "Next: Meeting in 45m", color: "text-indigo-500 border-indigo-100 bg-white" };
    if (!hasSchedule) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };
    return { text: "Tomorrow", color: "text-slate-400 border-slate-200 bg-slate-50" };
  };

  const pillState = getPillState();

  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 flex justify-between items-center shrink-0">
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
          <Settings size={20} className="text-slate-400" />
        </button>
        
        <div className="text-center">
          <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</h1>
          <div className="flex items-center gap-2">
            <ChevronLeft size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
            <span className="text-lg font-bold text-slate-800">17 Dec 2025</span>
            <ChevronRight size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
          </div>
        </div>
        
        <div className="w-9 flex justify-end">
          {/* Show Save Button if either mode is editing */}
          {(isEditing || isEditingActions) ? (
             <button 
                onClick={() => { setIsEditing(false); setIsEditingActions(false); }} 
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
             >
                <Save size={16} />
             </button>
          ) : (
             <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">JD</div>
          )}
        </div>
      </header>

      {/* CONTENT AREA */}
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
                    <button 
                      onClick={() => setIsEditing(true)} 
                      disabled={isEditingActions} // Disable if editing other section
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditingActions ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                    >
                      <Edit3 size={12} />
                      <span>Edit Schedule</span>
                    </button>
                  )}
                  {isPast && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Lock size={12} />
                      <span>Locked</span>
                    </div>
                  )}
                  {isEditing && (
                     <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in duration-200">
                       <Check size={12} />
                       <span>Save Changes</span>
                     </button>
                  )}
                </div>

                {hasSchedule ? (
                  <div className="space-y-0">
                    {scheduleTasks.map((task, index) => {
                      const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
                      const isCurrentSlot = task.id === 's3'; 

                      return (
                        <div key={task.id} onClick={() => !isEditing && task.status !== 'completed' && handleToggleTask(task.id, false)}>
                          <TaskRow 
                            id={task.id}
                            title={task.title} 
                            timeRange={task.timeRange} 
                            score={task.score} 
                            status={task.status} 
                            category={task.category} 
                            icon={task.icon}
                            isLast={index === scheduleTasks.length - 1}
                            isEditing={isEditing}
                            isLocked={isTaskLocked}
                            isCurrentTimeSlot={isCurrentSlot}
                            onDelete={() => handleDeleteTask(task.id)}
                            onInsert={() => handleInsertTask(index)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Timeline Empty</h3>
                    <p className="text-xs text-slate-400 text-center max-w-[220px] mb-6">
                      Review the ribbon above and define your contract for the day.
                    </p>
                    <button onClick={handleBuildSchedule} className="bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-2">
                      <Plus size={16} />
                      Build Schedule
                    </button>
                  </div>
                )}
              </section>

              {/* DAILY ACTIONS - UPDATED FOR EDIT & GRID */}
              <section className="mb-10 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Actions</h2>
                  
                  {/* Edit Actions Button - STYLED TO MATCH */}
                  {!isEditingActions ? (
                    <button 
                      onClick={() => setIsEditingActions(true)}
                      disabled={isEditing} // Disable if editing timeline
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isEditing ? 'text-slate-300 bg-slate-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                    >
                      <Edit3 size={12} />
                      <span>Edit Actions</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditingActions(false)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in duration-200"
                    >
                      <Check size={12} />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>

                <div className="-mx-6 mb-4"> 
                  <FlexBucket totalFlexMinutes={600} usedMinutes={120} />
                </div>
                
                {/* GRID LAYOUT (4 Columns) */}
                <div className="grid grid-cols-4 gap-4">
                  {hasSchedule && dailyActions.map((action, index) => (
                    <TaskCircle 
                      key={action.id}
                      title={action.title} 
                      duration={action.timeRange} 
                      Icon={action.icon} 
                      bgColor={action.category === 'CONSISTENCY' ? "bg-indigo-50" : "bg-emerald-50"}
                      isActive={action.status === 'in_progress'}
                      onClick={() => handleToggleTask(action.id, true)}
                      
                      // Edit Mode Props
                      isEditing={isEditingActions}
                      onDelete={() => handleDeleteDailyAction(action.id)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={handleDrop}
                    />
                  ))}
                  
                  {/* Add New Button (Appends template to grid) */}
                  <div 
                    onClick={handleAddDailyAction}
                    className="flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all shadow-sm">
                      <Plus size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Add New</p>
                  </div>
                </div>
              </section>
            </div>
        </div>
      </div> 

      {/* NAVBAR (Static) */}
      <div className="fixed bottom-0 w-full z-50">
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none" />
        <div className="relative pb-[env(safe-area-inset-bottom)]">
          <nav className="mx-4 mb-4 bg-slate-900 text-slate-400 rounded-[2.5rem] px-6 py-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 relative z-50">
            <div className="flex gap-5">
              <button className="flex flex-col items-center gap-1 text-indigo-400 transition-colors">
                <Layout size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold">Dashboard</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
                <Calendar size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold">Planner</span>
              </button>
            </div>
            <div className="w-24" />
            <div className="flex gap-5">
              <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
                <Bot size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold">Templates</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
                <BarChart3 size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold">Analytics</span>
              </button>
            </div>
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 flex flex-col items-center z-50">
              <div className="relative w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-50 shadow-xl shadow-indigo-900/20 flex items-center justify-center mb-3">
                <div className="absolute inset-1 rounded-full border-4 border-slate-800" />
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full p-1" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="transparent" strokeWidth="4" fill="none" />
                    <circle 
                      cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="4" fill="none" 
                      strokeDasharray="213" 
                      strokeDashoffset={activeTask ? "50" : "213"} 
                      className={`${activeTask ? 'text-indigo-500' : 'text-slate-700'} transition-all duration-1000 ease-in-out`} 
                      strokeLinecap="round" 
                    />
                </svg>
                <div className="relative flex flex-col items-center justify-center text-white z-20 mt-0.5">
                    {activeTask ? (
                      <activeTask.icon size={18} className="text-indigo-300 animate-pulse" />
                    ) : (
                      <Play size={18} className="text-slate-500" />
                    )}
                    
                    {activeTask ? (
                      <div className="flex items-baseline gap-[1px]">
                        <span className="text-[10px] font-black tracking-tighter">12</span>
                        <span className="text-[10px] font-bold text-indigo-300">m</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">IDLE</span>
                    )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full shadow-sm backdrop-blur-md border ${activeTask ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                 <span className={`text-[9px] font-black uppercase tracking-widest block ${activeTask ? 'text-white animate-pulse' : 'text-white'}`}>
                   {activeTask ? 'Tracking' : 'Ready'}
                 </span>
              </div>
            </div>
          </nav>
        </div>
      </div>

    </main>
  );
}