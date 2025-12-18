"use client";

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/types/dashboard'; // Ensure this type is exported from your types file

interface TimelineRibbonProps {
  showCurrentTime?: boolean;
  tasks?: TaskItem[]; // NEW: Accept tasks data
}

const TimelineRibbon = ({ showCurrentTime = true, tasks = [] }: TimelineRibbonProps) => {
  const [percentagePos, setPercentagePos] = useState(0);

  // --- HELPER: Parse "HH:MM" to minutes from midnight ---
  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  };

  useEffect(() => {
    if (!showCurrentTime) return;

    const updatePosition = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setPercentagePos((minutesSinceMidnight / 1440) * 100);
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, [showCurrentTime]);

  return (
    <div className="w-full space-y-3 px-6 py-4">
      {/* The Glass Container */}
      <div className="relative h-6 w-full bg-slate-100/80 backdrop-blur-sm overflow-hidden rounded-full border border-slate-200">
        
        {/* DYNAMIC BACKGROUND BLOCKS */}
        <div className="absolute inset-0">
           {tasks.map((task) => {
             // Skip Unscheduled/Daily tasks (they don't have fixed positions)
             if (task.isDaily) return null;

             let startMins = 0;
             let endMins = 0;

             // CASE 1: Wake Up (00:00 -> Wake Time)
             if (task.title === "Wake Up") {
               startMins = 0;
               endMins = timeToMinutes(task.timeRange);
             }
             // CASE 2: Sleep (Sleep Time -> 24:00)
             else if (task.title === "Sleep") {
               startMins = timeToMinutes(task.timeRange);
               endMins = 1440; // End of day
             }
             // CASE 3: Standard Range ("09:00 - 11:30")
             else if (task.timeRange.includes(' - ')) {
               const [startStr, endStr] = task.timeRange.split(' - ');
               startMins = timeToMinutes(startStr);
               endMins = timeToMinutes(endStr);
             } 
             // Fallback for single time points that aren't Sleep/Wake (render nothing or thin line)
             else {
               return null; 
             }

             // Calculate CSS %
             const left = (startMins / 1440) * 100;
             const width = ((endMins - startMins) / 1440) * 100;
             
             // Color Logic
             const colorClass = task.category === 'EFFICIENCY' ? 'bg-emerald-400/20' : 'bg-indigo-400/20';

             return (
               <div 
                 key={task.id}
                 className={`absolute h-full ${colorClass} border-r border-white/10`}
                 style={{ left: `${left}%`, width: `${width}%` }}
                 title={task.title} // Tooltip for debug
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

      {/* Time Labels */}
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