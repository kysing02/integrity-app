import React from 'react';
import { Coffee, Sun, Calendar, Brain, History } from 'lucide-react';

interface ViewSleepingProps {
  isFuture: boolean;
  isPast: boolean;
  isToday: boolean;
  viewDate: Date;
  actions: {
    startDay: () => void;
    navigateDay: (offset: number) => void;
  };
}

const ViewSleeping = ({ isFuture, isPast, isToday, viewDate, actions }: ViewSleepingProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      
      {/* --- SCENARIO A: FUTURE (Planning) --- */}
      {isFuture && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center mb-6">
            <Calendar size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Plan Ahead</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[200px] text-center">
            Prepare your schedule for {viewDate.toLocaleDateString('en-GB', { weekday: 'long' })}.
          </p>
          <button 
            onClick={actions.startDay} 
            className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2"
          >
            <Brain size={18} /><span>Start Planning</span>
          </button>
        </div>
      )}

      {/* --- SCENARIO B: PAST (No Record) --- */}
      {isPast && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-slate-200 flex items-center justify-center mb-6">
            <History size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Record</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[200px] text-center">
            No activity was tracked on this day.
          </p>
          
          <button 
             onClick={() => {
                 const today = new Date();
                 const diffTime = Math.abs(today.getTime() - viewDate.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                 actions.navigateDay(diffDays);
             }}
             className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2 mb-4"
          >
            <span>Go to Today</span>
          </button>
        </div>
      )}

      {/* --- SCENARIO C: TODAY (Good Morning) --- */}
      {isToday && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center mb-6">
            <Coffee size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Good Morning</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[200px] text-center">
            Your timeline is waiting. Ready to start?
          </p>
          <button 
            onClick={actions.startDay} 
            className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sun size={18} /><span>Start Day</span>
          </button>
        </div>
      )}
      
    </div>
  );
};

export default ViewSleeping;