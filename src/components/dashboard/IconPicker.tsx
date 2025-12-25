import React from 'react';
import {
  Brain, Users, Dumbbell, Pencil, BookOpen, Brush, Sparkles,
  Coffee, Sun, Briefcase, Utensils, Music, ShoppingCart, Code, Tv
} from 'lucide-react';

export const ICONS = [
  { icon: Brain, label: 'Deep Work', category: 'CONSISTENCY', recommendedMinutes: 90 },
  { icon: Code, label: 'Coding', category: 'CONSISTENCY', recommendedMinutes: 120 },
  { icon: BookOpen, label: 'Study', category: 'CONSISTENCY', recommendedMinutes: 60 },
  { icon: Pencil, label: 'Write', category: 'CONSISTENCY', recommendedMinutes: 45 },
  { icon: Briefcase, label: 'Work', category: 'CONSISTENCY', recommendedMinutes: 120 },
  { icon: Dumbbell, label: 'Exercise', category: 'CONSISTENCY', recommendedMinutes: 60 },
  { icon: Brush, label: 'Create', category: 'CONSISTENCY', recommendedMinutes: 90 },
  { icon: Music, label: 'Relax', category: 'CONSISTENCY', recommendedMinutes: 30 },
  { icon: Tv, label: 'Leisure', category: 'CONSISTENCY', recommendedMinutes: 60 },
  { icon: Users, label: 'Meeting', category: 'EFFICIENCY', recommendedMinutes: 30 },
  { icon: Utensils, label: 'Meal', category: 'EFFICIENCY', recommendedMinutes: 30 },
  { icon: Coffee, label: 'Break', category: 'EFFICIENCY', recommendedMinutes: 15 },
  { icon: Sun, label: 'Morning', category: 'EFFICIENCY', recommendedMinutes: 30 },
  { icon: Sparkles, label: 'Routine', category: 'EFFICIENCY', recommendedMinutes: 20 },
  { icon: ShoppingCart, label: 'Errand', category: 'EFFICIENCY', recommendedMinutes: 45 },
];

interface IconPickerProps {
  selectedIcon: any;
  category: 'EFFICIENCY' | 'CONSISTENCY';
  onChange: (icon: any, label: string, recommendedMinutes: number, category: string) => void;
}

const IconPicker = ({ selectedIcon, category, onChange }: IconPickerProps) => {
  const filteredIcons = ICONS.filter(i => i.category === category);

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {filteredIcons.map(({ icon: Icon, label, recommendedMinutes, category: iconCat }, idx) => {
        const isSelected = selectedIcon === Icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(Icon, label, recommendedMinutes, iconCat)}
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