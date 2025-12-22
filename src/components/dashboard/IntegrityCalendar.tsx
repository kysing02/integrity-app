"use client";
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from 'date-fns';

interface IntegrityCalendarProps {
  days: any[];
  tasks: any[];
  onDateClick: (date: Date) => void;
}

const IntegrityCalendar = ({ days, tasks, onDateClick }: IntegrityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Execution Roadmap
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let currentDay = startDate;

    const todayId = format(new Date(), 'yyyy-MM-dd');

    while (currentDay <= endDate) {
      const formattedDate = format(currentDay, 'd');
      const dayIdPrefix = format(currentDay, 'yyyy-MM-dd');
      
      // Find matching day in data
      const dayData = days.find(d => d.id.startsWith(dayIdPrefix));
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDay(currentDay, new Date());
      
      let status: 'empty' | 'planned' | 'recorded' | 'missed' = 'empty';
      if (dayData) {
        if (dayData.status === 'completed') status = 'recorded';
        else {
          if (dayIdPrefix < todayId) {
             const dayTasks = tasks.filter(t => t.day_id.startsWith(dayIdPrefix));
             const totalElapsed = dayTasks.reduce((acc, t) => acc + (t.elapsed_seconds || 0), 0);
             status = totalElapsed > 0 ? 'recorded' : 'missed';
          } else {
             status = 'planned';
          }
        }
      }

      const getStatusUI = () => {
        switch (status) {
          case 'recorded': return <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
          case 'planned': return <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />;
          case 'missed': return <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400" />;
          default: return <div className="mt-1 w-1.5 h-1.5 rounded-full bg-transparent" />;
        }
      };

      const dayCopy = new Date(currentDay);

      rows.push(
        <div
          key={currentDay.toString()}
          onClick={() => onDateClick(dayCopy)}
          className={`relative h-20 border border-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:z-10 hover:shadow-xl hover:shadow-indigo-100 hover:scale-105 hover:rounded-xl group ${
            !isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'
          }`}
        >
          <span className={`text-xs font-black transition-colors ${
            !isCurrentMonth ? 'text-slate-200' : isToday ? 'text-indigo-600' : 'text-slate-700'
          }`}>
            {formattedDate}
          </span>
          {getStatusUI()}
          
          {isToday && (
            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-indigo-600" />
          )}
        </div>
      );
      currentDay = addDays(currentDay, 1);
    }

    return (
      <div className="grid grid-cols-7 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        {rows}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Legend */}
      <div className="mt-8 flex justify-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missed</span>
        </div>
      </div>
    </div>
  );
};

export default IntegrityCalendar;
