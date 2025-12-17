import { Play, CheckCircle2, LucideIcon } from 'lucide-react';
import ProgressCircle from './ProgressCircle';

interface TaskRowProps {
  title: string;
  timeRange: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  isLast?: boolean;
  icon: LucideIcon;
}

const TaskRow = ({ title, timeRange, score, status, category = 'CONSISTENCY', isLast, icon: Icon }: TaskRowProps) => {
  // Determine Colors
  const ringColor = status === 'pending' ? 'text-slate-200' : (score < 90 ? 'text-amber-500' : 'text-emerald-500');
  const iconColor = status === 'pending' ? 'text-slate-300' : (score < 90 ? 'text-amber-600' : 'text-emerald-600');
  const dotColor = category === 'CONSISTENCY' ? 'bg-indigo-400' : 'bg-emerald-400';
  
  // NEW: Visual state for completed items
  const isCompleted = status === 'completed';
  
  return (
    <div className={`flex gap-4 relative transition-all duration-500 ${isCompleted ? 'opacity-60 grayscale-[0.3]' : 'opacity-100'}`}>
      
      {/* Connection Line */}
      {!isLast && <div className="absolute left-[23px] top-[50px] bottom-0 w-0.5 bg-slate-100" />}
      
      {/* Left Column: Icon Circle + Score */}
      <div className="flex flex-col items-center pt-2 z-10">
         <ProgressCircle size={48} progress={status === 'pending' ? 0 : score} color={ringColor}>
            <Icon size={20} className={iconColor} />
         </ProgressCircle>
         
         <div className={`mt-1 text-[10px] font-bold ${status === 'pending' ? 'text-slate-300' : 'text-slate-600'}`}>
            {status === 'pending' ? '--' : `${score}%`}
         </div>
      </div>

      {/* Right Column: Card */}
      <div className="flex-grow mb-6 group cursor-pointer">
        <div className={`p-4 rounded-2xl border transition-all duration-300 
          ${status === 'in_progress' 
            ? 'bg-indigo-50/80 border-indigo-200 shadow-lg shadow-indigo-100' 
            : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
          }`}>
          
          <div className="flex justify-between items-center">
            {/* Title & Time */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>{timeRange}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCompleted ? 'opacity-50' : ''}`}></span>
              </div>
              <p className={`font-semibold transition-colors ${status === 'in_progress' ? 'text-indigo-900' : 'text-slate-800'} ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                {title}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskRow;