"use client";

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/types/dashboard';
import { getAdjustedMinutes } from '@/lib/timeUtils'; // Import new helper

interface TimelineRibbonProps {
  showCurrentTime?: boolean;
  tasks?: TaskItem[];
  plannedCheckIn?: string; 
  plannedSleep?: string; 
  debugTime?: string;
}

const TimelineRibbon = ({ 
  showCurrentTime = true, 
  tasks = [], 
  plannedCheckIn = "07:00", 
  plannedSleep = "23:00",
  debugTime 
}: TimelineRibbonProps) => {
  const [percentagePos, setPercentagePos] = useState(0);

  // Constants for the 5AM - 5AM day
  const DAY_START_OFFSET = 300; // 5 hours * 60 mins
  const TOTAL_DAY_MINUTES = 1440; // 24 hours

  // --- HELPER: Map Adjusted Minutes to Percentage (0-100) ---
  const mapMinutesToPercent = (adjustedMinutes: number) => {
    // 1. Shift by the Day Start (subtract 300 mins)
    let relativeMinutes = adjustedMinutes - DAY_START_OFFSET;
    
    // 2. Calculate %
    return (relativeMinutes / TOTAL_DAY_MINUTES) * 100;
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

      const h = now.getHours();
      const m = now.getMinutes();
      
      // Calculate current shifted time
      const adjustedHour = h < 5 ? h + 24 : h;
      const currentAdjustedMins = (adjustedHour * 60) + m;

      const pct = mapMinutesToPercent(currentAdjustedMins);
      setPercentagePos(Math.max(0, Math.min(100, pct)));
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
           
           {/* 1. MORNING BLOCK (05:00 -> Planned Check-in) */}
           {(() => {
             const endMins = getAdjustedMinutes(plannedCheckIn); // e.g. 07:00 -> 420
             const startMins = 300; // 05:00
             
             const diff = endMins - startMins;
             const width = (diff / TOTAL_DAY_MINUTES) * 100;
             
             return (
               <div 
                 className="absolute h-full bg-slate-400/20 border-r border-white/10"
                 style={{ left: '0%', width: `${Math.max(0, width)}%` }}
                 title="Morning Routine"
               />
             );
           })()}

           {/* 2. NIGHT BLOCK (Planned Sleep -> 05:00 Next Day) */}
           {(() => {
             const startMins = getAdjustedMinutes(plannedSleep); // e.g. 23:00 -> 1380
             const endMins = 1740; // 29:00 (05:00 next day)
             
             const diff = endMins - startMins;
             const width = (diff / TOTAL_DAY_MINUTES) * 100;
             const left = mapMinutesToPercent(startMins);

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
             
             // Use new helper
             const startMins = getAdjustedMinutes(startStr);
             const endMins = getAdjustedMinutes(endStr);

             const left = mapMinutesToPercent(startMins);
             const width = ((endMins - startMins) / TOTAL_DAY_MINUTES) * 100;
             
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

      {/* Axis Labels (Shifted) */}
      <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
        <span>05:00</span>
        <span>11:00</span>
        <span>17:00</span>
        <span>23:00</span>
        <span>05:00</span>
      </div>
    </div>
  );
};

export default TimelineRibbon;