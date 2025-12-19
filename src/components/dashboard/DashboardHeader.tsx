import React from 'react';
import { Settings, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface DashboardHeaderProps {
  hasSchedule: boolean;
  isPast: boolean;
  isEditing: boolean;
  isEditingActions: boolean;
  onFinishEdit: () => void;
  
  // NEW PROPS
  viewDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const DashboardHeader = ({ 
  hasSchedule, isPast, isEditing, isEditingActions, onFinishEdit,
  viewDate, onPrevDay, onNextDay 
}: DashboardHeaderProps) => {
  
  // Format: "20 Dec 2025"
  const dateStr = viewDate.toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  });

  // Check if "Today" to maybe disable 'Next' (Optional, but let's allow future planning)
  // const isToday = new Date().toDateString() === viewDate.toDateString();

  return (
    <header className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 flex justify-between items-center shrink-0">
      <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
        <Settings size={20} className="text-slate-400" />
      </button>
      
      <div className="text-center select-none">
        <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</h1>
        <div className="flex items-center gap-2">
          <button onClick={onPrevDay} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
          </button>
          
          <span className="text-lg font-bold text-slate-800 w-28 block">{dateStr}</span>
          
          <button onClick={onNextDay} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
             <ChevronRight size={16} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
          </button>
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