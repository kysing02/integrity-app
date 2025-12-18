"use client";

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/types/dashboard';

interface TimelineRibbonProps {
  showCurrentTime?: boolean;
  tasks?: TaskItem[];
  plannedCheckIn?: string; // e.g. "07:00"
  plannedSleep?: string;   // e.g. "23:00"
  debugTime?: string;      // e.g. "08:00" for testing
}

const TimelineRibbon = ({ 
  showCurrentTime = true, 
  tasks = [], 
  plannedCheckIn = "07:00", 
  plannedSleep = "23:00",
  debugTime 
}: TimelineRibbonProps) => {
  const [percentagePos, setPercentagePos] = useState(0);

  // --- HELPER: Parse "HH:MM" to minutes from midnight ---
  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  };

  useEffect(() => {
    if (!showCurrentTime) return;

    const updatePosition = () => {
      let now = new Date();
      
      // DEBUG TIME OVERRIDE
      if (debugTime) {
        const [h, m] = debugTime.split(':').map(Number);
        now = new Date();
        now.setHours(h, m, 0, 0);
      }

      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setPercentagePos((minutesSinceMidnight / 1440) * 100);
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, [showCurrentTime, debugTime]);

  return (
    <div className="w-full space-y-3 px-6 py-4">
      <div className="relative h-6 w-full bg-slate-100/80 backdrop-blur-sm overflow-hidden rounded-full border border-slate-200">
        
        {/* DYNAMIC BACKGROUND BLOCKS */}
        <div className="absolute inset-0">
           
           {/* 1. MORNING BLOCK (00:00 -> Planned Check-in) */}
           {(() => {
              const endMins = timeToMinutes(plannedCheckIn);
              const width = (endMins / 1440) * 100;
              return (
                <div 
                  className="absolute h-full bg-slate-400/20 border-r border-white/10"
                  style={{ left: '0%', width: `${width}%` }}
                  title="Morning Routine"
                />
              );
           })()}

           {/* 2. NIGHT BLOCK (Planned Sleep -> 00:00) */}
           {(() => {
              const startMins = timeToMinutes(plannedSleep);
              const width = ((1440 - startMins) / 1440) * 100;
              const left = (startMins / 1440) * 100;
              return (
                <div 
                  className="absolute h-full bg-slate-400/20 border-l border-white/10"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title="Night Routine"
                />
              );
           })()}

           {/* 3. SCHEDULED TASKS */}
           {tasks.map((task) => {
             if (task.isDaily) return null;
             if (!task.timeRange.includes(' - ')) return null;

             const [startStr, endStr] = task.timeRange.split(' - ');
             const startMins = timeToMinutes(startStr);
             const endMins = timeToMinutes(endStr);

             const left = (startMins / 1440) * 100;
             const width = ((endMins - startMins) / 1440) * 100;
             
             // Efficiency = Emerald, Consistency = Indigo
             const colorClass = task.category === 'EFFICIENCY' ? 'bg-emerald-400/20' : 'bg-indigo-400/20';

             return (
               <div 
                 key={task.id}
                 className={`absolute h-full ${colorClass} border-r border-white/10`}
                 style={{ left: `${left}%`, width: `${width}%` }}
               />
             );
           })}
        </div>

        {/* The "Now" Indicator */}
        {showCurrentTime && (
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-10 transition-all duration-1000"
            style={{ left: `${percentagePos}%` }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-600 rounded-full" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>00:00</span>
      </div>
    </div>
  );
};

export default TimelineRibbon;