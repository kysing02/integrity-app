"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface DashboardHeaderProps {
  hasSchedule: boolean;
  isPast: boolean;
  isEditing: boolean;
  isEditingActions: boolean;
  onFinishEdit: () => void;
  viewDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
}

const DashboardHeader = ({ 
  hasSchedule, 
  isPast, 
  isEditing, 
  isEditingActions, 
  onFinishEdit,
  viewDate,
  onPrevDay,
  onNextDay,
  onJumpToToday
}: DashboardHeaderProps) => {

  const isToday = (() => {
    const today = new Date();
    if (today.getHours() < 5) today.setDate(today.getDate() - 1);
    return today.toDateString() === viewDate.toDateString();
  })();

  return (
    <div className="flex-none px-5 pt-8 pb-2 bg-slate-50/95 backdrop-blur-md z-20 sticky top-0 transition-all duration-300 shadow-sm border-b border-slate-100/50">
      
      {/* 1. TOP ROW: Title & Edit Controls (Compact) */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
            {isEditing || isEditingActions ? 'Editing Mode' : 'Dashboard'}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEditing || isEditingActions ? 'Customize your day' : 'Overview'}
          </p>
        </div>

        {/* Edit / Done Button */}
        {(isEditing || isEditingActions) ? (
          <button 
            onClick={onFinishEdit}
            className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all"
          >
            Done
          </button>
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-200" /> 
        )}
      </div>

      {/* 2. DATE NAVIGATION ROW (Slimmer) */}
      <div className="flex items-center justify-between bg-white p-0.5 rounded-xl shadow-sm border border-slate-200">
        
        {/* Prev Arrow */}
        <button 
          onClick={onPrevDay} 
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* Date Display */}
        <div className="flex flex-col items-center cursor-default group relative">
           
           <span className="text-sm font-extrabold text-slate-700">
             {viewDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
           </span>

           {/* Jump to Today */}
           {!isToday && (
             <button 
               onClick={onJumpToToday}
               className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-indigo-500 hover:bg-indigo-50 rounded-full transition-all animate-in fade-in zoom-in-75 duration-300"
               title="Jump to Today"
             >
               <RotateCcw size={12} strokeWidth={3} />
             </button>
           )}
        </div>

        {/* Next Arrow */}
        <button 
          onClick={onNextDay} 
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;