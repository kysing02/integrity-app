import { Play, X, Pause, CheckCircle2 } from 'lucide-react';
import ProgressCircle from './ProgressCircle';

interface TaskRowProps {
  title: string;
  timeRange: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  isLast?: boolean;
}

const TaskRow = ({ title, timeRange, score, status, category = 'CONSISTENCY', isLast }: TaskRowProps) => {
  // Determine Colors based on status/score
  const ringColor = status === 'pending' ? 'text-slate-200' : (score < 90 ? 'text-amber-500' : 'text-emerald-500');
  const dotColor = category === 'CONSISTENCY' ? 'bg-indigo-400' : 'bg-emerald-400';
  
  return (
    <div className="flex gap-4 relative">
      {/* Connection Line */}
      {!isLast && <div className="absolute left-[23px] top-[50px] bottom-0 w-0.5 bg-slate-100" />}
      
      {/* Left Column: Progress Circle */}
      <div className="flex flex-col items-center pt-2">
         <ProgressCircle size={48} progress={status === 'pending' ? 0 : score} color={ringColor}>
            <span className={`text-[10px] font-bold ${status === 'pending' ? 'text-slate-300' : 'text-slate-600'}`}>
              {status === 'pending' ? '--' : `${score}%`}
            </span>
         </ProgressCircle>
      </div>

      {/* Right Column: Card */}
      <div className="flex-grow mb-6 group cursor-pointer">
        <div className={`p-4 rounded-2xl border transition-all duration-300 
          ${status === 'in_progress' 
            ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-100/50' 
            : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
          }`}>
          
          <div className="flex justify-between items-center">
            {/* Title & Time */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400">{timeRange}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
              </div>
              <p className={`font-semibold text-slate-800 transition-colors ${status === 'in_progress' ? 'text-indigo-900' : ''}`}>
                {title}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
              {status === 'in_progress' ? (
                <div className="flex items-center gap-2">
                   {/* Animated Bars */}
                  <div className="flex space-x-0.5">
                    <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_0ms] rounded-full"></span>
                    <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_200ms] rounded-full"></span>
                    <span className="w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite_400ms] rounded-full"></span>
                  </div>
                </div>
              ) : status === 'completed' ? (
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle2 size={16} />
                </div>
              ) : (
                <button className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
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