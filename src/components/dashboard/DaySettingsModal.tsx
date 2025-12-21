"use client";
import React, { useState, useEffect } from 'react';
import { X, Check, Moon, Sun, ArrowRight } from 'lucide-react';

interface DaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedCheckIn: string;
  plannedSleep: string;
  onSave: (checkIn: string, sleep: string) => void;
  onEndDay: () => void;
}

const DaySettingsModal = ({ isOpen, onClose, plannedCheckIn, plannedSleep, onSave, onEndDay }: DaySettingsModalProps) => {
  const [checkIn, setCheckIn] = useState(plannedCheckIn);
  const [sleep, setSleep] = useState(plannedSleep);

  // Sync when opening
  useEffect(() => {
    if (isOpen) {
        setCheckIn(plannedCheckIn);
        setSleep(plannedSleep);
    }
  }, [isOpen, plannedCheckIn, plannedSleep]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center mb-8">
           <h3 className="font-bold text-slate-800 text-lg">Day Settings</h3>
           <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-8">
           {/* Check In Input */}
           <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-xl text-amber-500 shadow-sm"><Sun size={20} /></div>
                 <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start</div>
                    <div className="font-bold text-slate-700">Check-in Time</div>
                 </div>
              </div>
              <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="bg-transparent text-right font-black text-xl text-slate-800 outline-none w-24" />
           </div>

           {/* Sleep Input */}
           <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-xl text-indigo-500 shadow-sm"><Moon size={20} /></div>
                 <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End</div>
                    <div className="font-bold text-slate-700">Sleep Target</div>
                 </div>
              </div>
              <input type="time" value={sleep} onChange={e => setSleep(e.target.value)} className="bg-transparent text-right font-black text-xl text-slate-800 outline-none w-24" />
           </div>
        </div>

        <div className="space-y-4">
           {/* Primary: Save Changes */}
           <button 
             onClick={() => { onSave(checkIn, sleep); onClose(); }} 
             className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
           >
             <Check size={20} /> Update Plan
           </button>
           
           {/* Secondary: End Day */}
           <button 
             onClick={onEndDay} 
             className="w-full text-xs font-bold text-rose-400 py-3 hover:text-rose-600 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
           >
              Complete Day <ArrowRight size={12} />
           </button>
        </div>

      </div>
    </>
  );
};

export default DaySettingsModal;