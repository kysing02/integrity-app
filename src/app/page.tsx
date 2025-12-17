"use client";

import { useState } from 'react';
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import { 
  Pencil, BookOpen, Brush, Plus, ChevronLeft, ChevronRight, Calendar, Settings, Layout, Bot, BarChart3, Clock, Play, Brain, Users, Dumbbell, Sun, Moon, Edit3, Lock, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  // --- MOCK STATE ---
  const [hasSchedule, setHasSchedule] = useState(true); // Toggle to false to see Empty State
  const isToday = true; 
  const isPast = false; // Toggle to true to see "Locked" state
  
  // Logic for the Pill Text (Kept as requested)
  const getPillState = () => {
    if (isToday && hasSchedule) return { text: "Next: Meeting in 45m", color: "text-indigo-500 border-indigo-100 bg-white" };
    if (isToday && !hasSchedule) return { text: "Status: Not Planned", color: "text-amber-500 border-amber-100 bg-amber-50" };
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
        
        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
           JD
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            {/* 1. CONSISTENT PILL (Status) */}
            <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${pillState.color}`}>
              <Clock size={12} />
              <span>{pillState.text}</span>
            </div>

            {/* 2. CONSISTENT RIBBON */}
            <TimelineRibbon showCurrentTime={hasSchedule} />

            <div className="px-6 mt-4">
              
              <section className="mb-10">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Timeline</h2>
                  
                  {/* REVERTED BUTTON DESIGN */}
                  {!isPast ? (
                    <button 
                      onClick={() => setHasSchedule(!hasSchedule)} 
                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>Edit Schedule</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Lock size={12} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>

                {/* 3. CONTENT (Swaps between Tasks and Empty State) */}
                {hasSchedule ? (
                  <div className="space-y-0">
                    <TaskRow title="Wake Up" timeRange="07:00" score={100} status="completed" category="CONSISTENCY" icon={Sun} />
                    <TaskRow title="Deep Work" timeRange="09:00 - 11:30" score={96} status="completed" category="CONSISTENCY" icon={Brain} />
                    <TaskRow title="Strategy Meeting" timeRange="13:00 - 14:00" score={98} status="in_progress" category="EFFICIENCY" icon={Users} />
                    <TaskRow title="Fitness" timeRange="17:30 - 18:30" score={0} status="pending" category="CONSISTENCY" icon={Dumbbell} />
                    <TaskRow title="Sleep" timeRange="23:00" score={0} status="pending" category="CONSISTENCY" isLast icon={Moon} />
                  </div>
                ) : (
                  // --- EMPTY STATE ---
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Timeline Empty</h3>
                    <p className="text-xs text-slate-400 text-center max-w-[220px] mb-6">
                      Review the ribbon above and define your contract for the day.
                    </p>
                    <button className="bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-2">
                      <Plus size={16} />
                      Build Schedule
                    </button>
                  </div>
                )}
              </section>

              {/* DAILY ACTIONS */}
              <section className="mb-10 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Actions</h2>
                  <span className="text-[9px] text-slate-300 font-medium">Long press to edit</span>
                </div>

                <div className="-mx-6"> 
                  <FlexBucket totalFlexMinutes={600} usedMinutes={120} />
                </div>
                <div className="flex gap-6 overflow-x-auto py-4 no-scrollbar snap-x">
                  <TaskCircle title="Study" duration="1h 30m" Icon={Pencil} bgColor="bg-indigo-50" />
                  <TaskCircle title="Read" duration="45m" Icon={BookOpen} bgColor="bg-emerald-50" />
                  <TaskCircle title="Admin" duration="30m" Icon={Brush} bgColor="bg-amber-50" />
                  
                  <div className="flex flex-col items-center gap-3 flex-shrink-0 snap-center cursor-pointer active:scale-95 transition-transform">
                    <button className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all shadow-sm">
                      <Plus size={24} />
                    </button>
                    <p className="text-xs font-bold text-slate-300">Add New</p>
                  </div>
                </div>
              </section>
            </div>
        </div>
      </div> 

      {/* NAVBAR */}
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
                   <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="213" strokeDashoffset="50" className="text-indigo-500 transition-all duration-1000 ease-in-out" strokeLinecap="round" />
                </svg>
                <div className="relative flex flex-col items-center justify-center text-white z-20 mt-0.5">
                   <Users size={18} className="text-indigo-300 mb-0.5" />
                   <div className="flex items-baseline gap-[1px] leading-none">
                      <span className="text-2xl font-black tracking-tighter">12</span>
                      <span className="text-[10px] font-bold text-indigo-300">m</span>
                   </div>
                </div>
              </div>
              <div className="bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
                 <span className="text-[9px] font-black text-white uppercase tracking-widest animate-pulse block">Tracking</span>
              </div>
            </div>
          </nav>
        </div>
      </div>

    </main>
  );
}