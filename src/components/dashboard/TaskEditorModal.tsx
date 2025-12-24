"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Brain, Plus, AlertCircle } from 'lucide-react';
import { TaskItem } from '@/types/dashboard';
import IconPicker from '@/components/dashboard/IconPicker';
import { getAdjustedMinutes, doRangesOverlap } from '@/lib/timeUtils';

interface TaskEditorModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  type: 'schedule' | 'daily';
  initialData?: Partial<TaskItem>;
  existingTasks?: TaskItem[];
  minTime?: string;
  maxTime?: string;
  plannedCheckIn?: string;
  plannedSleep?: string;
  onClose: () => void;
  onSave: (data: Partial<TaskItem>) => void;
  onDelete?: () => void;
}

const TaskEditorModal = ({
  isOpen, mode, type, initialData, existingTasks = [], minTime, maxTime,
  plannedCheckIn, plannedSleep, onClose, onSave, onDelete
}: TaskEditorModalProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<'EFFICIENCY' | 'CONSISTENCY'>('CONSISTENCY');
  const [selectedIcon, setSelectedIcon] = useState<any>(Brain);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);

  // Schedule Inputs
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null); // in minutes

  // Daily Action Inputs
  const [durHours, setDurHours] = useState("");
  const [durMins, setDurMins] = useState("");

  // --- OVERLAP DETECTION LOGIC ---
  const conflictError = useMemo(() => {
    if (type !== 'schedule' || !startTime || !endTime) return null;
    const currentRange = `${startTime} - ${endTime}`;

    if (getAdjustedMinutes(startTime) >= getAdjustedMinutes(endTime)) {
      return "End time must be after start time";
    }

    // BOUNDARY CHECK: Warn if outside logical day boundaries
    if (plannedCheckIn && getAdjustedMinutes(startTime) < getAdjustedMinutes(plannedCheckIn)) {
      return `Starts before Wake up (${plannedCheckIn})`;
    }
    if (plannedSleep && getAdjustedMinutes(endTime) > getAdjustedMinutes(plannedSleep)) {
      return `Ends after Sleep (${plannedSleep})`;
    }

    for (const task of existingTasks) {
      if (mode === 'edit' && initialData?.id === task.id) continue;
      if (doRangesOverlap(currentRange, task.timeRange)) {
        return `Clashes with "${task.title}" (${task.timeRange})`;
      }
    }
    return null;
  }, [startTime, endTime, type, existingTasks, mode, initialData]);

  // --- BODY SCROLL LOCK ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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

  // --- INITIALIZE FORM (SMART DEFAULTS) ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // --- EDIT MODE ---
        setTitle(initialData.title || "");
        setCategory(initialData.category || 'CONSISTENCY');
        setSelectedIcon(initialData.icon || Brain);

        if (type === 'schedule' && initialData.timeRange) {
          // ROBUST SPLIT: Handles "09:00 - 10:00" OR "09:00-10:00"
          const parts = initialData.timeRange.split(/-|–/); // Hyphen or En-dash
          const s = parts[0] ? parts[0].trim() : "";
          const e = parts[1] ? parts[1].trim() : "";

          setStartTime(s || minTime || "09:00");
          setEndTime(e || maxTime || "10:00");
        } else if (type === 'daily' && initialData.timeRange) {
          const h = initialData.timeRange.match(/(\d+)h/);
          const m = initialData.timeRange.match(/(\d+)m/);
          setDurHours(h ? h[1] : "");
          setDurMins(m ? m[1] : "");
        }
      } else {
        // --- ADD MODE (Smart Defaults) ---
        setTitle("");
        setCategory('CONSISTENCY');
        setSelectedIcon(Brain);
        setTitleManuallyEdited(false);

        if (type === 'schedule') {
          // 1. Determine Start Time
          const startDefault = minTime || "07:00"; // Default to morning if completely unknown
          setStartTime(startDefault);

          // 2. Calculate Smart End Time
          const startMins = getAdjustedMinutes(startDefault);

          // If maxTime is not provided (e.g., adding to end of list), default to End of Day (29:00 / 05:00 next day)
          const maxMins = maxTime ? getAdjustedMinutes(maxTime) : (29 * 60);

          // Target: 1 Hour Duration
          let targetEndMins = startMins + 60;

          // Constraint: Don't overlap next task (if next task exists)
          if (maxTime && targetEndMins > maxMins) {
            targetEndMins = maxMins;
          }

          // 3. Convert Minutes -> HH:MM
          let h = Math.floor(targetEndMins / 60);
          const m = targetEndMins % 60;

          // Normalize shifted hours for the HTML Input (which expects 00-23)
          // e.g., 25:00 becomes 01:00
          if (h >= 24) h -= 24;

          const hh = String(h).padStart(2, '0');
          const mm = String(m).padStart(2, '0');

          setEndTime(`${hh}:${mm}`);

        } else {
          // Daily Action Default
          setDurHours("");
          setDurMins("30");
        }
      }
    }
  }, [isOpen, initialData, minTime, maxTime, type]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (conflictError) return;

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

    onSave({ title, category, timeRange, icon: selectedIcon });
    onClose();
  };

  // --- ICON CHANGE HANDLER (Auto-fill Title) ---
  const handleIconChange = (icon: any, label: string) => {
    setSelectedIcon(icon);

    // Auto-fill title until user manually edits it (only in add mode)
    if (mode === 'add' && !titleManuallyEdited) {
      setTitle(label);
    }
  };

  // --- TITLE CHANGE HANDLER (Track manual edits) ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTitleManuallyEdited(true);
  };

  // --- DURATION BUTTON OPTIONS ---
  const DURATION_OPTIONS = [5, 10, 15, 30]; // minutes

  // --- CALCULATE END TIME ---
  const calculateEndTime = (start: string, durationMinutes: number): string => {
    if (!start) return "";

    const startMins = getAdjustedMinutes(start);
    const endMins = startMins + durationMinutes;

    let h = Math.floor(endMins / 60);
    const m = endMins % 60;

    // Handle 24+ hour format for overnight times
    if (h >= 24) h -= 24;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // --- HANDLE DURATION BUTTON CLICK ---
  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
    if (startTime) {
      setEndTime(calculateEndTime(startTime, duration));
    }
  };

  // --- HANDLE START TIME CHANGE (for Efficiency with duration) ---
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    if (category === 'EFFICIENCY' && selectedDuration) {
      setEndTime(calculateEndTime(newStartTime, selectedDuration));
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90dvh] flex flex-col">

        <div className="overflow-y-auto p-5 pb-2">

          {/* HEADER */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {mode === 'add' ? 'New Commitment' : 'Edit Details'}
              </h3>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Title..."
                className="text-xl font-bold text-slate-800 placeholder:text-slate-300 w-full bg-transparent outline-none border-none p-0 focus:ring-0"
                autoFocus
                autoComplete="off"
              />
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* CATEGORY */}
          <div className="mb-5 flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setCategory('CONSISTENCY')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${category === 'CONSISTENCY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${category === 'CONSISTENCY' ? 'bg-indigo-500' : 'bg-slate-300'}`} /> Consistency
            </button>
            <button onClick={() => setCategory('EFFICIENCY')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${category === 'EFFICIENCY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${category === 'EFFICIENCY' ? 'bg-emerald-500' : 'bg-slate-300'}`} /> Efficiency
            </button>
          </div>

          {/* TIME ALLOCATION */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase">Time Allocation</h4>
              {conflictError && (
                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle size={10} /> {conflictError}
                </span>
              )}
            </div>

            {type === 'schedule' ? (
              category === 'EFFICIENCY' ? (
                // EFFICIENCY: Start time + Duration buttons + Calculated end time
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full font-bold text-base p-2.5 rounded-xl outline-none focus:ring-2 text-center bg-slate-50 text-slate-800 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATION_OPTIONS.map(duration => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => handleDurationSelect(duration)}
                          className={`py-2.5 rounded-xl font-bold text-sm transition-all ${selectedDuration === duration
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {duration}min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">End Time</label>
                    <div className="w-full font-bold text-base p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-center border-2 border-emerald-100">
                      {endTime || '--:--'}
                    </div>
                  </div>
                </div>
              ) : (
                // CONSISTENCY: Original start/end time pickers
                <div className={`flex items-center gap-3 p-1 rounded-2xl transition-colors ${conflictError ? 'bg-rose-50 ring-1 ring-rose-200' : ''}`}>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full font-bold text-base p-2.5 rounded-xl outline-none focus:ring-2 text-center transition-all ${conflictError ? 'bg-white text-rose-600 focus:ring-rose-200' : 'bg-slate-50 text-slate-800 focus:ring-indigo-100'}`}
                    />
                  </div>
                  <div className={`text-slate-300 ${conflictError ? 'text-rose-300' : ''}`}>-</div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`w-full font-bold text-base p-2.5 rounded-xl outline-none focus:ring-2 text-center transition-all ${conflictError ? 'bg-white text-rose-600 focus:ring-rose-200' : 'bg-slate-50 text-slate-800 focus:ring-indigo-100'}`}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <input type="number" min="0" max="12" pattern="\d*" inputMode="numeric" value={durHours} onChange={(e) => setDurHours(e.target.value)} placeholder="0" className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 pointer-events-none">h</span>
                </div>
                <div className="flex-1 relative">
                  <input type="number" min="0" max="59" pattern="\d*" inputMode="numeric" value={durMins} onChange={(e) => setDurMins(e.target.value)} placeholder="0" className="w-full bg-slate-50 text-slate-800 font-bold text-base p-2.5 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 pointer-events-none">m</span>
                </div>
              </div>
            )}
          </div>

          {/* ICON PICKER */}
          <div className="mb-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Icon</h4>
            <IconPicker selectedIcon={selectedIcon} onChange={handleIconChange} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 pt-2 flex gap-3 bg-white border-t border-slate-50">
          {mode === 'edit' && onDelete && (
            <button onClick={() => { onDelete(); onClose(); }} className="p-3.5 rounded-xl bg-rose-50 text-rose-500 font-bold hover:bg-rose-100 transition-colors">
              <X size={18} />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!title || !!conflictError}
            className="flex-1 bg-slate-900 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:active:scale-100"
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