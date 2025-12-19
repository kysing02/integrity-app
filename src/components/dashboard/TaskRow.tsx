import { Play, CheckCircle2, X, Plus, LucideIcon, Check } from 'lucide-react';
import ProgressCircle from './ProgressCircle';
import { parseDurationToSeconds } from '@/lib/timeUtils';

interface TaskRowProps {
  id: string;
  title: string;
  timeRange: string;
  progress: number; 
  status: 'pending' | 'in_progress' | 'completed';
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  isLast?: boolean;
  icon: any; 
  variant?: 'task' | 'marker'; 

  // Edit Props
  isEditing?: boolean;
  isLocked?: boolean; 
  isCurrentTimeSlot?: boolean; 
  isInsertionPointPast?: boolean; 
  isGapless?: boolean;
  
  // Read Only Props
  readOnly?: boolean;
  actualSeconds?: number;

  onDelete?: () => void;
  onInsert?: () => void;
  onEditClick?: () => void;
  onToggleComplete?: () => void;
}

const TaskRow = ({ 
  title, timeRange, progress, status, category = 'CONSISTENCY', isLast, icon: Icon,
  variant = 'task',
  isEditing, isLocked, isCurrentTimeSlot, isInsertionPointPast, isGapless,
  readOnly, actualSeconds = 0,
  onDelete, onInsert, onEditClick, onToggleComplete
}: TaskRowProps) => {
  
  const isMarker = variant === 'marker';
  const isEditable = isEditing && !isLocked && !isMarker;
  const isCompleted = status === 'completed';
  const isEfficiency = category === 'EFFICIENCY';

  // --- HELPER: Format Duration ---
  const formatShortDur = (secs: number) => {
    if (secs === 0) return "0m";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
  };

  // --- COLOR LOGIC ---
  // FIX 2: Default Colors are now Category-based, even in ReadOnly
  let ringColor = isEfficiency ? 'text-emerald-500' : 'text-indigo-500';
  let iconColor = isEfficiency ? 'text-emerald-600' : 'text-indigo-600';
  let dotColor = isEfficiency ? 'bg-emerald-400' : 'bg-indigo-400';
  
  const plusBg = isEfficiency ? 'bg-emerald-100' : 'bg-indigo-100';
  const plusText = isEfficiency ? 'text-emerald-600' : 'text-indigo-600';
  const checkColor = category === 'CONSISTENCY' ? 'text-indigo-600' : 'text-emerald-600';

  if (!isMarker) {
    // If NOT ReadOnly and NOT Active, dim it (Pending State)
    if (!readOnly && !isEditable && status === 'pending') {
       ringColor = isCurrentTimeSlot ? 'text-emerald-500' : 'text-slate-200';
       iconColor = isCurrentTimeSlot ? 'text-emerald-600' : 'text-slate-300';
    }
  } else {
    ringColor = 'text-slate-200'; 
    iconColor = 'text-slate-300';
    dotColor = 'bg-slate-200';
  }

  // --- READ ONLY LOGIC ---
  let resultBadge = null;
  let finalProgress = isEfficiency ? 100 : progress;

  if (readOnly && !isMarker) {
    const plannedSecs = parseDurationToSeconds(timeRange);
    
    // Progress Ring Logic
    if (plannedSecs > 0) {
      finalProgress = Math.min((actualSeconds / plannedSecs) * 100, 100);
    } else if (actualSeconds > 0) {
      finalProgress = 100; 
    } else {
      finalProgress = 0;
    }

    // --- FIX 3: BADGE COLORS ---
    
    // 1. Success: Met the plan
    if (plannedSecs > 0 && actualSeconds >= plannedSecs) {
      resultBadge = (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
           <span className="text-xs font-bold text-emerald-700">
             {formatShortDur(actualSeconds)} <span className="text-emerald-400">/</span> <span className="opacity-60">{formatShortDur(plannedSecs)}</span>
           </span>
        </div>
      );
    } 
    // 2. Under-performed: Did some work, but less than plan -> RED BG
    else if (plannedSecs > 0 && actualSeconds > 0 && actualSeconds < plannedSecs) {
      resultBadge = (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
           <span className="text-xs font-bold text-rose-500">
             {formatShortDur(actualSeconds)} <span className="text-rose-300">/</span> <span className="opacity-60">{formatShortDur(plannedSecs)}</span>
           </span>
        </div>
      );
    }
    // 3. Missed: Planned but 0 actual -> RED BG
    else if (plannedSecs > 0 && actualSeconds === 0) {
       resultBadge = (
        <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
           <span className="text-xs font-bold text-rose-500">Missed</span>
        </div>
      );
    } 
    // 4. Unplanned: No plan, but did work -> INDIGO
    else if (actualSeconds > 0) {
       resultBadge = (
        <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
           <span className="text-xs font-bold text-indigo-600">{formatShortDur(actualSeconds)}</span>
        </div>
      );
    } 
    else {
        resultBadge = <span className="text-slate-300 font-bold text-xs">--</span>;
    }
  }

  // --- STYLES ---
  const containerClass = isMarker 
    ? 'opacity-60' 
    : (isCompleted && !readOnly ? 'opacity-70 grayscale-[0.1]' : 'opacity-100');

  const cardClass = isMarker
    ? 'bg-transparent border-transparent pl-0' 
    : `p-4 rounded-2xl border transition-all duration-300 ${
        isCurrentTimeSlot && !isEditable && !readOnly
          ? 'bg-indigo-50/80 border-indigo-200 shadow-lg shadow-indigo-100'
          : 'bg-white border-slate-100 shadow-sm'
      } ${isEditable ? 'hover:border-indigo-300 active:scale-[0.99]' : ''}`;

  return (
    <div className={`flex gap-4 relative transition-all duration-300 ${containerClass}`}>
      
      {!isLast && (
        <div className="absolute left-[23px] top-[50px] bottom-0 w-0.5 bg-slate-100 flex flex-col items-center justify-center">
           {isEditing && !isInsertionPointPast && !isGapless && (
             <button 
                onClick={onInsert}
                className={`w-5 h-5 rounded-full ${plusBg} border-2 border-white ${plusText} flex items-center justify-center shadow-sm z-20 hover:scale-110 transition-transform`}
             >
               <Plus size={12} strokeWidth={3} />
             </button>
           )}
        </div>
      )}

      {/* LEFT COLUMN - FIX: Wrapped in Button again */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (!isEditing && !readOnly && !isMarker && onToggleComplete) {
             onToggleComplete(); 
          }
        }}
        disabled={isEditing || readOnly || isMarker}
        className={`flex flex-col items-center pt-2 z-10 outline-none ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'}`}
      >
        <div className={`flex flex-col items-center pt-2 z-10 ${readOnly ? 'cursor-default' : ''}`}>
          <div className="relative">
            <ProgressCircle size={48} progress={finalProgress} color={readOnly && !isCompleted && finalProgress === 0 ? 'text-slate-200' : ringColor}>
                {isCompleted && !isMarker ? (
                  <Check size={20} className={checkColor} strokeWidth={3} />
                ) : (
                  Icon ? <Icon size={20} className={iconColor} /> : <div className="w-5 h-5" />
                )}
            </ProgressCircle>
          </div>
        </div>

      </button>
      

      <div className={`flex-grow mb-6 ${!isMarker && !readOnly && 'group'} cursor-default`} onClick={isEditable ? onEditClick : undefined}>
        <div className={cardClass}>
          <div className="flex justify-between items-center">
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${isMarker ? 'text-slate-400 italic' : 'text-slate-500'}`}>{timeRange}</span>
                {!isMarker && !readOnly && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCompleted ? 'opacity-50' : ''}`}></span>}
              </div>
              <p className={`font-semibold ${isMarker ? 'text-slate-500 text-sm' : 'text-slate-800'}`}>{title}</p>
            </div>

            {!isMarker && (
              <div className="flex gap-3 items-center">
                {readOnly ? (
                   resultBadge
                ) : (
                   isEditing ? (
                     <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"><X size={16} /></button>
                   ) : (
                      <>
                        {status === 'in_progress' ? (
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"><div className="flex space-x-0.5"><span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_0ms] rounded-full"></span><span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_200ms] rounded-full"></span><span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_400ms] rounded-full"></span></div></div>
                        ) : status === 'completed' ? (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"><CheckCircle2 size={16} /></div>
                        ) : (
                          <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><Play size={16} /></button>
                        )}
                      </>
                   )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskRow;