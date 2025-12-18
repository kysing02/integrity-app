"use client";

import React, { useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { TaskItem, TimerEvent } from '@/types/dashboard';
import { generateDayReport } from '@/lib/reportUtils';
import { parseDurationToSeconds } from '@/lib/timeUtils';

interface DaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnd: () => void;
  events: TimerEvent[];
  tasks: TaskItem[];
  checkInTime: Date | null;
  currentDate: Date; // NEW PROP
}

const DaySummaryModal = ({ 
  isOpen, onClose, onConfirmEnd, events, tasks, checkInTime, currentDate 
}: DaySummaryModalProps) => {
  
  const report = useMemo(() => {
    // USE PASSED currentDate instead of new Date()
    return generateDayReport(events, tasks, checkInTime, currentDate);
  }, [isOpen, events, tasks, checkInTime, currentDate]);

  const totalFocusTime = report.filter(s => s.type === 'TASK').reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalIdleTime = report.filter(s => s.type === 'IDLE').reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalTime = totalFocusTime + totalIdleTime;
  const productivityScore = totalTime > 0 ? Math.round((totalFocusTime / totalTime) * 100) : 0;

  if (!isOpen) return null;

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDur = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Day Summary</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plan vs Reality</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* STATS */}
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Focus</p>
                <p className="text-xl font-bold text-indigo-700">{formatDur(totalFocusTime)}</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Idle</p>
                <p className="text-xl font-bold text-slate-600">{formatDur(totalIdleTime)}</p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Score</p>
                <p className="text-xl font-bold text-emerald-700">{productivityScore}%</p>
             </div>
          </div>

          {/* TIMELINE */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Log</h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
              
              {/* CHECK-IN */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-slate-300"></div>
                <div className="text-xs font-bold text-slate-400 mb-1">{checkInTime ? formatTime(checkInTime) : '--:--'}</div>
                <div className="font-bold text-slate-800">Checked In</div>
              </div>

              {/* REPORT SEGMENTS */}
              {report.map((seg, i) => {
                const isIdle = seg.type === 'IDLE';
                const isEfficiency = seg.category === 'EFFICIENCY';
                
                let dotBorder = isIdle ? 'border-amber-300' : (isEfficiency ? 'border-emerald-500' : 'border-indigo-500');
                let textColor = isIdle ? 'text-slate-500 italic' : 'text-slate-800';
                
                // --- NEW DEVIATION LOGIC ---
                let showWarning = false;
                let diff = 0;

                // Only calculate deviation if this is the LAST entry for this task
                if (!isIdle && seg.isLastForTask && seg.originalTask) {
                    const plannedSecs = seg.plannedRange ? parseDurationToSeconds(seg.plannedRange) : 0;
                    const actualTotal = seg.totalTaskDuration || 0;
                    
                    diff = Math.abs(actualTotal - plannedSecs);
                    
                    // Show if deviation > 15 mins AND there was a plan
                    if (plannedSecs > 0 && diff > 900) {
                        showWarning = true;
                    }
                }

                return (
                  <div key={i} className="relative pl-6">
                    <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between">
                      <span>{formatTime(seg.startTime)}</span>
                      <span className="opacity-50">{formatDur(seg.durationSeconds)}</span>
                    </div>
                    
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 ${dotBorder}`}></div>
                    
                    <div className={`p-3 rounded-xl border ${isIdle ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                       <div className={`font-bold text-sm ${textColor}`}>{seg.title}</div>
                       
                       {!isIdle && seg.originalTask && (
                         <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                           <div className="flex items-center gap-2 text-[10px]">
                              <History size={12} className="text-slate-400" />
                              <span className="text-slate-500 font-medium">
                                Plan: <span className="text-slate-700">{seg.plannedRange}</span>
                              </span>
                           </div>
                           
                           {/* Only show on the LAST segment for this task */}
                           {showWarning && (
                             <div className="flex items-center gap-2 text-[10px] text-rose-500 font-semibold animate-in fade-in">
                               <AlertCircle size={12} />
                               {/* Hint: You can optionally show (Total: Xm) to explain why */}
                               <span>Short by {formatDur(diff)} (Total: {formatDur(seg.totalTaskDuration || 0)})</span>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
              
              {/* END OF DAY */}
              <div className="relative pl-6 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-4 border-slate-200"></div>
                <div className="text-xs font-bold text-slate-400 mb-1">{formatTime(currentDate)}</div>
                <div className="font-bold text-slate-900">End of Day</div>
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button onClick={onConfirmEnd} className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={20} /><span>Confirm & Finish</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DaySummaryModal;