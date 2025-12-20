import React from 'react';
import { Sun, Plus } from 'lucide-react';

interface CheckInRowProps {
  timeStr: string;
  isInsertionPointPast: boolean; // For the "Add Task" line styling
  isGapless: boolean;            // If the next task starts immediately
  onInsert: () => void;
}

const CheckInRow = ({ timeStr, isInsertionPointPast, isGapless, onInsert }: CheckInRowProps) => {
  return (
    <div className="group relative pl-4 pr-4 py-3 bg-white border-l-4 border-slate-300 rounded-r-xl shadow-sm mb-4">
      
      {/* Connector Line Logic (Same as TaskRow) */}
      {!isGapless && (
        <div className={`absolute left-[-21px] bottom-[-24px] w-[2px] h-[24px] -z-10 
          ${isInsertionPointPast ? 'bg-slate-200' : 'bg-indigo-200 dashed-line'}`} 
        />
      )}

      {/* Insert Button (Hover) */}
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
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
             <Sun size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Checked-in at {timeStr}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">Start of Day</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md">
           07:00
        </div>
      </div>
    </div>
  );
};

export default CheckInRow;