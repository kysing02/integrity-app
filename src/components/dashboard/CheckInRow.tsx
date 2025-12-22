import React from 'react';
import { Sun, Plus, Play, CalendarClock } from 'lucide-react';

interface CheckInRowProps {
  timeStr: string;
  isInsertionPointPast: boolean; // For the "Add Task" line styling
  isGapless: boolean;            // If the next task starts immediately
  onInsert: () => void;
  
  // --- NEW LOGIC PROPS ---
  isFuture?: boolean;
  hasCheckInTime?: boolean;
  plannedCheckIn?: string;
  onCheckInNow?: () => void;
  onPlanClick?: () => void;
}

const CheckInRow = ({ 
  timeStr, isInsertionPointPast, isGapless, onInsert,
  isFuture = false, hasCheckInTime = true, plannedCheckIn = "07:00", onCheckInNow, onPlanClick 
}: CheckInRowProps) => {

  // Detect "Limbo State": It's today (not future), but we haven't officially checked in
  const isLimbo = !isFuture && !hasCheckInTime;

  return (
    <div className={`group relative pl-4 pr-4 py-3 bg-white border-l-4 ${isLimbo ? 'border-indigo-400' : 'border-slate-300'} rounded-r-xl shadow-sm mb-4`}>
      
      {/* Connector Line Logic (PRESERVED) */}
      {!isGapless && (
        <div className={`absolute left-[-21px] bottom-[-24px] w-[2px] h-[24px] -z-10 
          ${isInsertionPointPast ? 'bg-slate-200' : 'bg-indigo-200 dashed-line'}`} 
        />
      )}

      {/* Insert Button (Hover) (PRESERVED) */}
      {!isGapless && (
         <button 
           onClick={(e) => { e.stopPropagation(); onInsert(); }}
           className="absolute left-[-30px] bottom-[-22px] w-5 h-5 bg-white border border-indigo-200 text-indigo-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-indigo-50 hover:text-indigo-600 transition-all z-20 shadow-sm"
           title="Insert Task"
         >
           <Plus size={12} strokeWidth={3} />
         </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon: Changes color if we are waiting to check in */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLimbo ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
              {isFuture ? <CalendarClock size={14} /> : <Sun size={14} />}
          </div>
          
          <div className="flex flex-col">
            {/* Text Logic */}
            <span className={`text-xs font-bold ${isLimbo ? 'text-indigo-700' : 'text-slate-700'}`}>
                {isFuture ? 'Planning Mode' : (isLimbo ? 'Ready to Start?' : `Checked-in at ${timeStr}`)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">Start of Day</span>
          </div>
        </div>

        {/* Right Side: Badge OR Action Button */}
        {isLimbo ? (
            <button 
              onClick={onCheckInNow}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
            >
               <span className="text-[10px] font-bold uppercase tracking-wide">Check In</span>
               <Play size={10} fill="currentColor" />
            </button>
        ) : (
            <div 
              onClick={onPlanClick}
              className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${isFuture ? 'bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100' : 'text-slate-300 bg-slate-50'}`}
            >
               {plannedCheckIn}
            </div>
        )}
      </div>
    </div>
  );
};

export default CheckInRow;