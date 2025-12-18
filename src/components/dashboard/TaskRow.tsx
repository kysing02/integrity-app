import { Play, CheckCircle2, X, Plus, LucideIcon, Check } from 'lucide-react';
import ProgressCircle from './ProgressCircle';

interface TaskRowProps {
  id: string;
  title: string;
  timeRange: string;
  progress: number; 
  status: 'pending' | 'in_progress' | 'completed';
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  isLast?: boolean;
  icon: LucideIcon;
  variant?: 'task' | 'marker'; 

  // Edit Props
  isEditing?: boolean;
  isLocked?: boolean; 
  isCurrentTimeSlot?: boolean; 
  
  // NEW: Time Constraints
  isInsertionPointPast?: boolean; // Hides the (+) button if true
  
  onDelete?: () => void;
  onInsert?: () => void;
  onEditClick?: () => void;
  onToggleComplete?: () => void;
}

const TaskRow = ({ 
  title, timeRange, progress, status, category = 'CONSISTENCY', isLast, icon: Icon,
  variant = 'task',
  isEditing, isLocked, isCurrentTimeSlot, isInsertionPointPast, // NEW prop
  onDelete, onInsert, onEditClick, onToggleComplete
}: TaskRowProps) => {
  
  const isMarker = variant === 'marker';
  const isEditable = isEditing && !isLocked && !isMarker;
  const isCompleted = status === 'completed';

  // --- COLOR LOGIC ---
  let ringColor = 'text-slate-200';
  let iconColor = 'text-slate-300';
  let dotColor = 'bg-slate-300';
  const checkColor = category === 'CONSISTENCY' ? 'text-indigo-600' : 'text-emerald-600';
  const hoverCheckColor = category === 'CONSISTENCY' ? 'text-indigo-400' : 'text-emerald-400';

  if (!isMarker) {
    if (status === 'pending') {
       ringColor = isCurrentTimeSlot ? 'text-emerald-500' : 'text-slate-200';
       iconColor = isCurrentTimeSlot ? 'text-emerald-600' : 'text-slate-300';
    } else {
       const isEfficiency = category === 'EFFICIENCY';
       ringColor = isEfficiency ? 'text-emerald-500' : 'text-indigo-500';
       iconColor = isEfficiency ? 'text-emerald-600' : 'text-indigo-600';
    }
    dotColor = category === 'CONSISTENCY' ? 'bg-indigo-400' : 'bg-emerald-400';
  } else {
    // Marker Colors
    ringColor = 'text-slate-200'; 
    iconColor = 'text-slate-300';
    dotColor = 'bg-slate-200';
  }

  if (isEditable) {
    ringColor = 'text-indigo-400';
    iconColor = 'text-indigo-500';
  }

  // --- PROGRESS LOGIC ---
  let finalProgress = progress;
  if (category === 'EFFICIENCY') finalProgress = 100;
  if (isMarker) finalProgress = 100; 
  if (isEditable) finalProgress = 100;

  // --- STYLES ---
  const containerClass = isMarker 
    ? 'opacity-60' 
    : (isCompleted || (isEditing && isLocked) ? 'opacity-70 grayscale-[0.1]' : 'opacity-100');

  const cardClass = isMarker
    ? 'bg-transparent border-transparent pl-0' 
    : `p-4 rounded-2xl border transition-all duration-300 ${
        isCurrentTimeSlot && !isEditable
          ? 'bg-indigo-50/80 border-indigo-200 shadow-lg shadow-indigo-100'
          : 'bg-white border-slate-100 shadow-sm'
      } ${isEditable ? 'hover:border-indigo-300 active:scale-[0.99]' : ''} ${!isEditable && !isLocked ? 'hover:shadow-md' : ''}`;

  return (
    <div className={`flex gap-4 relative transition-all duration-300 ${containerClass}`}>
      
      {/* CONNECTION LINE & INSERT BUTTON */}
      {!isLast && (
        <div className="absolute left-[23px] top-[50px] bottom-0 w-0.5 bg-slate-100 flex flex-col items-center justify-center">
           {/* Logic Update:
              1. Show (+) if isEditing is true.
              2. Show (+) even if isLocked (Completed).
              3. HIDE (+) if isInsertionPointPast is true (User Logic 4d).
           */}
           {isEditing && !isInsertionPointPast && (
             <button 
                onClick={onInsert}
                className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white text-indigo-600 flex items-center justify-center shadow-sm z-20 hover:scale-110 transition-transform"
             >
               <Plus size={12} strokeWidth={3} />
             </button>
           )}
        </div>
      )}
      
      {/* LEFT COLUMN */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          if (!isEditing && !isMarker && onToggleComplete) onToggleComplete();
        }}
        disabled={isEditing || isMarker}
        className={`flex flex-col items-center pt-2 z-10 outline-none group/circle ${isMarker ? 'cursor-default' : ''}`}
      >
         <div className="relative">
           <ProgressCircle size={48} progress={finalProgress} color={ringColor}>
              {isCompleted && !isEditing && !isMarker ? (
                 <Check size={20} className={checkColor} strokeWidth={3} />
              ) : (
                 <Icon size={20} className={`${iconColor} ${!isMarker && !isCompleted ? 'group-hover/circle:opacity-0' : ''} transition-opacity`} />
              )}
           </ProgressCircle>
           
           {!isCompleted && !isEditing && !isMarker && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/circle:opacity-100 transition-opacity">
                <Check size={20} className={hoverCheckColor} />
             </div>
           )}
         </div>
      </button>

      {/* RIGHT COLUMN */}
      <div className={`flex-grow mb-6 ${!isMarker && 'group'} cursor-pointer`} onClick={isEditable ? onEditClick : undefined}>
        <div className={cardClass}>
          <div className="flex justify-between items-center">
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${isMarker ? 'text-slate-400 italic' : 'text-slate-500'}`}>{timeRange}</span>
                {(!isEditing || isLocked) && !isMarker && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCompleted ? 'opacity-50' : ''}`}></span>}
              </div>
              <p className={`font-semibold transition-colors 
                ${isCurrentTimeSlot && !isEditable && !isMarker ? 'text-indigo-900' : 'text-slate-800'} 
                ${isCompleted && !isEditable ? 'line-through text-slate-400' : ''}
                ${isMarker ? 'text-slate-500 text-sm' : ''}
              `}>
                {title}
              </p>
            </div>
            
            {!isMarker && (
              <div className="flex gap-3 items-center">
                {isEditing ? (
                  // EDIT MODE: Always allow delete (User Logic 1)
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  // VIEW MODE
                  <>
                    {status === 'in_progress' ? (
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <div className="flex space-x-0.5">
                          <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_0ms] rounded-full"></span>
                          <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_200ms] rounded-full"></span>
                          <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_400ms] rounded-full"></span>
                        </div>
                      </div>
                    ) : status === 'completed' ? (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : (
                      <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <Play size={16} />
                      </button>
                    )}
                  </>
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