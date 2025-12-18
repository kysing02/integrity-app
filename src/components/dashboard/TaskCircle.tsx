import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface TaskCircleProps {
  id?: string;
  title: string;
  duration: string;
  Icon: LucideIcon;
  bgColor?: string; // Kept for backward compatibility, but largely overridden by category logic
  isActive?: boolean;
  onClick?: () => void;
  
  // New Props for Logic
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  progress?: number; // 0 to 100
  
  // Edit & Drag Props
  isEditing?: boolean;
  onDelete?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const TaskCircle = ({ 
  title, duration, Icon, bgColor = "bg-slate-50", isActive, onClick,
  category = 'CONSISTENCY', progress = 0,
  isEditing, onDelete, onDragStart, onDragOver, onDrop
}: TaskCircleProps) => {
  
  // LOGIC: Efficiency tasks (Tidy Room) are always "Full Circle" (100%)
  // Consistency tasks (Study) show actual progress
  const finalProgress = category === 'EFFICIENCY' ? 100 : progress;
  
  // COLOR LOGIC
  const themeColor = category === 'EFFICIENCY' ? 'text-emerald-500' : 'text-indigo-500';
  const ringColor = category === 'EFFICIENCY' ? 'text-emerald-400' : 'text-indigo-400';
  const bgClass = category === 'EFFICIENCY' ? 'bg-emerald-50' : 'bg-indigo-50';

  // SVG Math for w-16 h-16 (64px)
  // Center (32,32), Radius 28, Stroke 3
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalProgress / 100) * circumference;

  return (
    <div 
      onClick={!isEditing ? onClick : undefined} 
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative flex flex-col items-center gap-3 group flex-shrink-0 snap-center transition-all duration-300 ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {/* DELETE BUTTON */}
      {isEditing && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="absolute -top-2 -right-1 z-20 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}

      {/* CIRCLE CONTAINER */}
      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
        ${isActive 
          ? `scale-110 shadow-indigo-200 ${category === 'EFFICIENCY' ? 'bg-emerald-600' : 'bg-indigo-600'}`
          : `${bgClass} group-hover:scale-105 group-hover:-translate-y-1`
        }
      `}>
        
        {/* PROGRESS RING SVG */}
        <svg className="absolute inset-0 transform -rotate-90 w-full h-full p-0.5">
           {/* Track */}
           <circle 
             cx="30" cy="30" r={radius} 
             stroke="currentColor" 
             strokeWidth="3" 
             fill="transparent" 
             className={`${isActive ? 'text-white/20' : 'text-slate-200'}`} 
           />
           {/* Progress */}
           <circle 
             cx="30" cy="30" r={radius} 
             stroke="currentColor" 
             strokeWidth="3" 
             fill="transparent" 
             strokeDasharray={circumference} 
             strokeDashoffset={strokeDashoffset} 
             strokeLinecap="round"
             className={`transition-all duration-1000 ease-in-out ${isActive ? 'text-white' : ringColor}`} 
           />
        </svg>

        {/* ICON */}
        <Icon size={24} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-700'}`} />
      </div>
      
      {/* TEXT LABELS */}
      <div className="text-center">
        <p className={`text-xs font-bold ${isActive ? themeColor : 'text-slate-800'}`}>{title}</p>
        <p className="text-[10px] font-medium text-slate-400">{duration}</p>
      </div>
    </div>
  );
};

export default TaskCircle;