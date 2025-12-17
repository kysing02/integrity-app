import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TaskCircleProps {
  title: string;
  duration: string;
  Icon: LucideIcon;
  bgColor?: string; // e.g., "bg-indigo-50"
}

const TaskCircle = ({ title, duration, Icon, bgColor = "bg-slate-50" }: TaskCircleProps) => {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer flex-shrink-0 snap-center">
      <div className={`w-16 h-16 rounded-3xl ${bgColor} border border-transparent group-hover:border-indigo-100 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 shadow-sm`}>
        <Icon size={24} className="text-slate-700 group-hover:text-indigo-600 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-800">{title}</p>
        <p className="text-[10px] font-medium text-slate-400">{duration}</p>
      </div>
    </div>
  );
};

export default TaskCircle;