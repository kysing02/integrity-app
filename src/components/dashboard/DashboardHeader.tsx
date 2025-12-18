import React from 'react';
import { Settings, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface DashboardHeaderProps {
  hasSchedule: boolean;
  isPast: boolean;
  isEditing: boolean;
  isEditingActions: boolean;
  onFinishEdit: () => void;
}

const DashboardHeader = ({ hasSchedule, isPast, isEditing, isEditingActions, onFinishEdit }: DashboardHeaderProps) => {
  return (
    <header className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 flex justify-between items-center shrink-0">
      <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
        <Settings size={20} className="text-slate-400" />
      </button>
      
      <div className="text-center">
        <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</h1>
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
          <span className="text-lg font-bold text-slate-800">17 Dec 2025</span>
          <ChevronRight size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
        </div>
      </div>
      
      <div className="w-9 flex justify-end">
        {(isEditing || isEditingActions) ? (
            <button 
              onClick={onFinishEdit} 
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              <Save size={16} />
            </button>
        ) : (
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">JD</div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;