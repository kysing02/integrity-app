import React, { useRef } from 'react';
import { LucideIcon, X, Check } from 'lucide-react';

interface TaskCircleProps {
  id?: string;
  title: string;
  duration: string;
  Icon: LucideIcon;
  bgColor?: string; 
  isActive?: boolean;
  onClick?: () => void;
  
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  progress?: number; 
  isCompleted?: boolean;
  
  isEditing?: boolean;
  onDelete?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onLongPress?: () => void;
}

const TaskCircle = ({ 
  title, duration, Icon, bgColor = "bg-slate-50", isActive, onClick,
  category = 'CONSISTENCY', progress = 0, isCompleted = false,
  isEditing, onDelete, onDragStart, onDragOver, onDrop, onLongPress
}: TaskCircleProps) => {
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    if (isEditing) return;
    timerRef.current = setTimeout(() => {
      if (onLongPress) onLongPress();
    }, 600);
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  // --- PROGRESS LOGIC ---
  const finalProgress = category === 'EFFICIENCY' ? 100 : progress;

  // --- COLOR LOGIC ---
  const themeColor = category === 'EFFICIENCY' ? 'text-emerald-500' : 'text-indigo-500';
  
  // Ring Color: If completed, match the category check color
  // Efficiency = Green Ring, Consistency = Indigo Ring (when completed)
  const ringColor = isCompleted 
    ? (category === 'EFFICIENCY' ? 'text-emerald-400' : 'text-indigo-400')
    : (category === 'EFFICIENCY' ? 'text-emerald-400' : 'text-indigo-400');
    
  const bgClass = isCompleted 
    ? (category === 'EFFICIENCY' ? 'bg-emerald-50' : 'bg-indigo-50')
    : (category === 'EFFICIENCY' ? 'bg-emerald-50' : 'bg-indigo-50');

  // Check Icon Color
  const checkColor = category === 'EFFICIENCY' ? 'text-emerald-600' : 'text-indigo-600';

  // SVG Math
  const radius = 28; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalProgress / 100) * circumference;

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative flex flex-col items-center gap-3 group flex-shrink-0 snap-center transition-all duration-300 ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isCompleted ? 'opacity-70 grayscale-[0.1]' : ''}`}
    >
      {isEditing && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="absolute -top-2 -right-1 z-20 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}

      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
        ${isActive 
          ? `scale-110 shadow-indigo-200 ${category === 'EFFICIENCY' ? 'bg-emerald-600' : 'bg-indigo-600'}`
          : `${bgClass} group-hover:scale-105 group-hover:-translate-y-1`
        }
      `}>
        
        <svg className="absolute inset-0 transform -rotate-90 w-full h-full p-0.5">
           <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className={`${isActive ? 'text-white/20' : 'text-slate-200'}`} />
           <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`transition-all duration-1000 ease-in-out ${isActive ? 'text-white' : ringColor}`} />
        </svg>

        {isCompleted ? (
           <Check size={24} className={isActive ? 'text-white' : checkColor} strokeWidth={3} />
        ) : (
           <Icon size={24} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-700'}`} />
        )}
      </div>
      
      <div className="text-center">
        <p className={`text-xs font-bold ${isActive ? themeColor : 'text-slate-800'} ${isCompleted ? 'line-through text-slate-400' : ''}`}>{title}</p>
        <p className="text-[10px] font-medium text-slate-400">{duration}</p>
      </div>
    </div>
  );
};

export default TaskCircle;