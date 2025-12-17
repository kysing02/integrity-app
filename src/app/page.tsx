"use client"; // Needed for the interactive buttons in the nav

import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import { Pencil, BookOpen, Brush, Plus, ChevronLeft, ChevronRight, Calendar, Settings, Layout, Bot, BarChart3, Clock, Play } from 'lucide-react';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans pb-32 relative shadow-2xl overflow-x-hidden">
      
      {/* 1. Dynamic Header */}
      <header className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
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
          
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors relative">
            <Calendar size={20} className="text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
        
        {/* Next Task Pill */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 py-2 rounded-full px-4 w-fit mx-auto border border-slate-100">
          <Clock size={12} />
          <span>Next: Meeting in 45m</span>
        </div>
      </header>

      {/* 2. Timeline Ribbon */}
      <TimelineRibbon />

      {/* 3. Main Content */}
      <div className="px-6 mt-4">
        
        {/* Today's Schedule List */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Today's Timeline</h2>
          <div className="space-y-0">
             <TaskRow title="Deep Work" timeRange="09:00 - 11:30" score={96} status="completed" category="CONSISTENCY" />
             <TaskRow title="Strategy Meeting" timeRange="13:00 - 14:00" score={98} status="in_progress" category="EFFICIENCY" />
             <TaskRow title="Fitness" timeRange="17:30 - 18:30" score={0} status="pending" category="CONSISTENCY" isLast />
          </div>
        </section>

        {/* Flex Bucket & Tasks */}
        <section className="mb-10 pt-6 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Daily Actions</h2>
          
          {/* We must remove padding from FlexBucket wrapper since FlexBucket has its own padding */}
          <div className="-mx-6"> 
             <FlexBucket totalFlexMinutes={600} usedMinutes={120} />
          </div>
          
          <div className="flex gap-6 overflow-x-auto py-4 no-scrollbar snap-x">
            <TaskCircle title="Study" duration="1h 30m" Icon={Pencil} bgColor="bg-indigo-50" />
            <TaskCircle title="Read" duration="45m" Icon={BookOpen} bgColor="bg-emerald-50" />
            <TaskCircle title="Admin" duration="30m" Icon={Brush} bgColor="bg-amber-50" />
            
            {/* Add Button */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0 snap-center">
              <button className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all">
                <Plus size={24} />
              </button>
              <p className="text-xs font-bold text-slate-300">Add New</p>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Floating Modern Navbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
        <nav className="bg-slate-900/95 backdrop-blur-lg border border-slate-800 p-2 rounded-3xl flex justify-between items-center shadow-2xl shadow-slate-900/20">
          <div className="flex items-center gap-1">
            <button className="p-3 text-indigo-400 bg-indigo-500/10 rounded-2xl transition-all">
              <Layout size={20} />
            </button>
            <button className="p-3 text-slate-400 hover:text-white transition-colors">
              <Calendar size={20} />
            </button>
          </div>

          {/* Active Orb (Center) */}
          <div className="relative group -mt-8">
            <button className="w-16 h-16 rounded-2xl bg-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105 active:scale-95 border-4 border-slate-50">
               {/* Simulating Active State */}
               <div className="flex flex-col items-center animate-pulse">
                 <span className="text-[8px] font-black text-white/50 mb-0.5">TRACKING</span>
                 <span className="text-xs font-black text-white">09:12</span>
               </div>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-3 text-slate-400 hover:text-white transition-colors">
              <Bot size={20} />
            </button>
            <button className="p-3 text-slate-400 hover:text-white transition-colors">
              <BarChart3 size={20} />
            </button>
          </div>
        </nav>
      </div>

      {/* Gradient Top Line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500 opacity-50 z-50"></div>
    </main>
  );
}