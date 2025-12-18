import { Play, CheckCircle2, X, Plus, LucideIcon, Check } from 'lucide-react';
import ProgressCircle from './ProgressCircle';

interface TaskRowProps {
  id: string;
  title: string;
  timeRange: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  isLast?: boolean;
  icon: LucideIcon;
  
  // Edit Props
  isEditing?: boolean;
  isLocked?: boolean; 
  isCurrentTimeSlot?: boolean; 
  
  onDelete?: () => void;
  onInsert?: () => void;
  onEditClick?: () => void;
  
  // NEW: Completion Handler
  onToggleComplete?: () => void;
}

const TaskRow = ({ 
  title, timeRange, score, status, category = 'CONSISTENCY', isLast, icon: Icon,
  isEditing, isLocked, isCurrentTimeSlot, onDelete, onInsert, onEditClick, onToggleComplete
}: TaskRowProps) => {
  
  const isEditable = isEditing && !isLocked;

  // Determine Colors
  let ringColor = status === 'pending' ? 'text-slate-200' : (score < 90 ? 'text-amber-500' : 'text-emerald-500');
  if (isCurrentTimeSlot) ringColor = 'text-emerald-500';

  const iconColor = status === 'pending' && !isCurrentTimeSlot ? 'text-slate-300' : (score < 90 ? 'text-amber-600' : 'text-emerald-600');
  const dotColor = category === 'CONSISTENCY' ? 'bg-indigo-400' : 'bg-emerald-400';
  const isCompleted = status === 'completed';

  // Edit Mode Colors
  const editRingColor = 'text-indigo-400';
  const editIconColor = 'text-indigo-500';

  // Final Visuals
  const finalRingColor = isEditable ? editRingColor : ringColor;
  const finalIconColor = isEditable ? editIconColor : iconColor;
  const finalProgress = isEditable ? 100 : (status === 'pending' && !isCurrentTimeSlot ? 0 : (isCurrentTimeSlot ? 0 : score)); 

  const shouldFade = isCompleted || (isEditing && isLocked);

  return (
    <div className={`flex gap-4 relative transition-all duration-300 ${shouldFade ? 'opacity-60 grayscale-[0.3]' : 'opacity-100'}`}>
      
      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-[23px] top-[50px] bottom-0 w-0.5 bg-slate-100 flex flex-col items-center justify-center">
           {isEditing && !isLocked && (
             <button 
                onClick={onInsert}
                className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white text-indigo-600 flex items-center justify-center shadow-sm z-20 hover:scale-110 transition-transform"
             >
               <Plus size={12} strokeWidth={3} />
             </button>
           )}
        </div>
      )}
      
      {/* Left Column: Icon Circle (NOW CLICKABLE FOR COMPLETION) */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the timer
          if (!isEditing && onToggleComplete) onToggleComplete();
        }}
        disabled={isEditing}
        className="flex flex-col items-center pt-2 z-10 outline-none group/circle"
      >
         <div className="relative">
           <ProgressCircle size={48} progress={finalProgress} color={finalRingColor}>
              {/* Show Check Icon on Hover (Desktop) or if Completed */}
              {isCompleted && !isEditing ? (
                 <Check size={20} className="text-emerald-600" strokeWidth={3} />
              ) : (
                 <Icon size={20} className={`${finalIconColor} group-hover/circle:opacity-0 transition-opacity`} />
              )}
           </ProgressCircle>
           
           {/* Hover "Check" Overlay for Pending Tasks (UX Hint) */}
           {!isCompleted && !isEditing && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/circle:opacity-100 transition-opacity">
                <Check size={20} className="text-emerald-400" />
             </div>
           )}
         </div>
      </button>

      {/* Right Column: Card (Timer Trigger) */}
      <div className="flex-grow mb-6 group cursor-pointer" onClick={isEditable ? onEditClick : undefined}>
        <div className={`p-4 rounded-2xl border transition-all duration-300 
          ${isCurrentTimeSlot && !isEditable
            ? 'bg-indigo-50/80 border-indigo-200 shadow-lg shadow-indigo-100' 
            : 'bg-white border-slate-100 shadow-sm'
          }
          ${isEditable ? 'hover:border-indigo-300 active:scale-[0.99]' : ''}
          ${!isEditable && !isLocked ? 'hover:shadow-md' : ''}
        `}>
          
          <div className="flex justify-between items-center">
            {/* Title & Time */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>{timeRange}</span>
                {(!isEditing || isLocked) && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCompleted ? 'opacity-50' : ''}`}></span>}
              </div>
              <p className={`font-semibold transition-colors 
                ${isCurrentTimeSlot && !isEditable ? 'text-indigo-900' : 'text-slate-800'} 
                ${isCompleted && !isEditable ? 'line-through text-slate-400' : ''}
              `}>
                {title}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
              {isEditing ? (
                // EDIT MODE
                isLocked ? null : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                )
              ) : (
                // NORMAL MODE
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskRow;