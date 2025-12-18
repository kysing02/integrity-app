import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface TaskCircleProps {
  id?: string;
  title: string;
  duration: string;
  Icon: LucideIcon;
  bgColor?: string;
  isActive?: boolean;
  onClick?: () => void;
  
  // NEW: Edit & Drag Props
  isEditing?: boolean;
  onDelete?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const TaskCircle = ({ 
  title, duration, Icon, bgColor = "bg-slate-50", isActive, onClick,
  isEditing, onDelete, onDragStart, onDragOver, onDrop
}: TaskCircleProps) => {
  return (
    <div 
      onClick={!isEditing ? onClick : undefined} // Disable click-to-activate during edit
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative flex flex-col items-center gap-3 group flex-shrink-0 snap-center transition-all duration-300 ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {/* DELETE BUTTON (Edit Mode Only) */}
      {isEditing && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="absolute -top-2 -right-1 z-20 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}

      <div className={`relative w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm
        ${isActive 
          ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200' 
          : `${bgColor} border border-transparent ${!isEditing && 'group-hover:border-indigo-100 group-hover:scale-105 group-hover:-translate-y-1'}`
        }
      `}>
        {isActive && (
          <div className="absolute -inset-1 rounded-[26px] border-2 border-indigo-100 animate-pulse" />
        )}
        
        <Icon size={24} className={isActive ? 'text-white' : 'text-slate-700 group-hover:text-indigo-600 transition-colors'} />
      </div>
      
      <div className="text-center">
        <p className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>{title}</p>
        <p className="text-[10px] font-medium text-slate-400">{duration}</p>
      </div>
    </div>
  );
};

export default TaskCircle;