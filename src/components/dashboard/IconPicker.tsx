import React from 'react';
import {
  Brain, Users, Dumbbell, Pencil, BookOpen, Brush, Sparkles,
  Coffee, Sun, Briefcase, Utensils, Music, ShoppingCart, Code, Tv
} from 'lucide-react';

const ICONS = [
  { icon: Brain, label: 'Deep Work' },
  { icon: Code, label: 'Coding' },
  { icon: BookOpen, label: 'Study' },
  { icon: Pencil, label: 'Write' },
  { icon: Users, label: 'Meeting' },
  { icon: Briefcase, label: 'Work' },
  { icon: Dumbbell, label: 'Exercise' },
  { icon: Utensils, label: 'Meal' },
  { icon: Coffee, label: 'Break' },
  { icon: Sun, label: 'Morning' },
  { icon: Brush, label: 'Create' },
  { icon: Sparkles, label: 'Routine' },
  { icon: Music, label: 'Relax' },
  { icon: ShoppingCart, label: 'Errand' },
  { icon: Tv, label: 'Leisure' },
];

interface IconPickerProps {
  selectedIcon: any;
  onChange: (icon: any, label: string) => void;
}

const IconPicker = ({ selectedIcon, onChange }: IconPickerProps) => {
  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {ICONS.map(({ icon: Icon, label }, idx) => {
        const isSelected = selectedIcon === Icon; // Comparison by reference usually works for Lucide components
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(Icon, label)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isSelected
                ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-200'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-bold truncate w-full text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default IconPicker;