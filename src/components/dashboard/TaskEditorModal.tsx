"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Check, Brain, Users, Dumbbell, Sun, Moon, 
  Pencil, BookOpen, Brush, Sparkles, Coffee, Briefcase, 
  Music, Utensils, ShoppingCart, Tv, Code, Plus
} from 'lucide-react';
import { TaskItem } from '@/types/dashboard';

// --- ICONS CONFIG ---
const ICON_OPTIONS = [
  { icon: Brain, label: 'Focus' },
  { icon: Users, label: 'Meeting' },
  { icon: Dumbbell, label: 'Fitness' },
  { icon: Pencil, label: 'Study' },
  { icon: BookOpen, label: 'Read' },
  { icon: Brush, label: 'Chore' },
  { icon: Code, label: 'Code' },
  { icon: Briefcase, label: 'Work' },
  { icon: Coffee, label: 'Break' },
  { icon: Utensils, label: 'Eat' },
  { icon: Music, label: 'Relax' },
  { icon: ShoppingCart, label: 'Shop' },
  { icon: Sparkles, label: 'Other' },
];

interface TaskEditorModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  type: 'schedule' | 'daily';
  initialData?: Partial<TaskItem>;
  minTime?: string;
  maxTime?: string;
  onClose: () => void;
  onSave: (data: Partial<TaskItem>) => void;
  onDelete?: () => void;
}

const TaskEditorModal = ({ 
  isOpen, mode, type, initialData, minTime, maxTime, onClose, onSave, onDelete 
}: TaskEditorModalProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<'EFFICIENCY' | 'CONSISTENCY'>('CONSISTENCY');
  const [selectedIconName, setSelectedIconName] = useState<string>('Brain');
  
  // Schedule Inputs
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  // Daily Action Inputs
  const [durHours, setDurHours] = useState("");
  const [durMins, setDurMins] = useState("");

  // --- BODY SCROLL LOCK ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Android Hack: Sometimes helps to force the viewport to not jump
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // --- INITIALIZE FORM ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "");
        setCategory(initialData.category || 'CONSISTENCY');
        setSelectedIconName('Brain'); // Simplified match logic
        
        if (type === 'schedule' && initialData.timeRange) {
          const [s, e] = initialData.timeRange.split(' - ');
          setStartTime(s || minTime || "09:00");
          setEndTime(e || maxTime || "10:00");
        } else if (type === 'daily' && initialData.timeRange) {
           const h = initialData.timeRange.match(/(\d+)h/);
           const m = initialData.timeRange.match(/(\d+)m/);
           setDurHours(h ? h[1] : "");
           setDurMins(m ? m[1] : "");
        }
      } else {
        setTitle("");
        setCategory('CONSISTENCY');
        if (type === 'schedule') {
          setStartTime(minTime || "09:00");
          setEndTime(maxTime || "10:00"); 
        } else {
          setDurHours("");
          setDurMins("30");
        }
      }
    }
  }, [isOpen, initialData, minTime, maxTime, type]);

  if (!isOpen) return null;

  const handleSave = () => {
    let timeRange = "";
    if (type === 'schedule') {
      timeRange = `${startTime} - ${endTime}`;
    } else {
      const h = parseInt(durHours) || 0;
      const m = parseInt(durMins) || 0;
      const safeM = (h === 0 && m === 0) ? 1 : m;
      let str = "";
      if (h > 0) str += `${h}h `;
      if (safeM > 0 || h === 0) str += `${safeM}m`;
      timeRange = str.trim();
    }

    const iconObj = ICON_OPTIONS.find(i => i.label === selectedIconName) || ICON_OPTIONS[0];
    onSave({ title, category, timeRange, icon: iconObj.icon });
    onClose();
  };

  return (
    <>
      {/* OVERLAY */}
      <div 
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* DRAWER CONTAINER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90dvh] flex flex-col">
        
        {/* SCROLLABLE CONTENT WRAPPER 
            This ensures that if the keyboard pushes the drawer up, 
            only this middle section scrolls while footer stays visible if space permits,
            or scrolls with it.
        */}
        <div className="overflow-y-auto p-5 pb-2">

          {/* HEADER */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {mode === 'add' ? 'New Commitment' : 'Edit Details'}
              </h3>
              <input 
                type="text" 
                name="task_title_no_autofill" // Unique name to prevent autofill
                id="task_title_input"
                autoComplete="off" // Primary Disable
                autoCorrect="off" // Disable spellcheck bar
                spellCheck="false"
                data-form-type="other" // Hint to browser
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="text-xl font-bold text-slate-800 placeholder:text-slate-300 w-full bg-transparent outline-none border-none p-0 focus:ring-0"
                autoFocus
              />
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* CATEGORY */}
          <div className="mb-5 flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setCategory('CONSISTENCY')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${category === 'CONSISTENCY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${category === 'CONSISTENCY' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
              Consistency
            </button>
            <button 
              onClick={() => setCategory('EFFICIENCY')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${category === 'EFFICIENCY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${category === 'EFFICIENCY' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              Efficiency
            </button>
          </div>

          {/* TIME INPUTS */}
          <div className="mb-5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Time Allocation</h4>
            
            {type === 'schedule' ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-center"
                    // Time inputs on mobile are native pickers, usually don't trigger text autofill
                  />
                </div>
                <div className="text-slate-300">-</div>
                <div className="flex-1">
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-center"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                 <div className="flex-1 relative">
                   <input 
                     type="number" min="0" max="12"
                     pattern="\d*" // Forces numeric keypad
                     inputMode="numeric"
                     name="duration_hours_no_fill"
                     autoComplete="off"
                     value={durHours}
                     onChange={(e) => setDurHours(e.target.value)}
                     placeholder="0"
                     onFocus={(e) => e.target.select()}
                     className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100"
                   />
                   <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 pointer-events-none">h</span>
                 </div>

                 <div className="flex-1 relative">
                   <input 
                     type="number" min="0" max="59"
                     pattern="\d*"
                     inputMode="numeric"
                     name="duration_mins_no_fill"
                     autoComplete="off"
                     value={durMins}
                     onChange={(e) => setDurMins(e.target.value)}
                     placeholder="0"
                     onFocus={(e) => e.target.select()}
                     className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100"
                   />
                   <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 pointer-events-none">m</span>
                 </div>
              </div>
            )}
          </div>

          {/* ICON PICKER */}
          <div className="mb-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Icon</h4>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedIconName(opt.label)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                    selectedIconName === opt.label 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600' 
                      : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'
                  }`}
                >
                  <opt.icon size={18} />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS - Fixed at bottom of drawer */}
        <div className="p-5 pt-2 flex gap-3 bg-white border-t border-slate-50">
            {mode === 'edit' && onDelete && (
               <button 
                 onClick={() => { onDelete(); onClose(); }}
                 className="p-3.5 rounded-xl bg-rose-50 text-rose-500 font-bold hover:bg-rose-100 transition-colors"
               >
                 <X size={18} />
               </button>
            )}
            
            <button 
              onClick={handleSave}
              disabled={!title}
              className="flex-1 bg-slate-900 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {mode === 'add' ? <Plus size={18} /> : <Check size={18} />}
              <span>{mode === 'add' ? 'Add' : 'Save'}</span>
            </button>
        </div>
        
      </div>
    </>
  );
};

export default TaskEditorModal;