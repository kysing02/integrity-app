import React, { useState } from 'react';
import { Plus, Edit3, Check, LogOut } from 'lucide-react';
import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

// Components
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import CheckInRow from '@/components/dashboard/CheckInRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';

interface ViewActiveProps {
  state: any; 
  actions: any;
  helpers: any;
  formatCheckInTime: (d: Date | null) => string;
}

const ViewActive = ({ state, actions, helpers, formatCheckInTime }: ViewActiveProps) => {
  // Local Drag State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = () => setDraggedItemIndex(null);

  // --- LOGIC: Check if we have tasks ---
  const hasTasks = state.scheduleTasks.length > 0;

  return (
    <>
      <section className="mb-10 animate-in fade-in duration-500">
        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Timeline</h2>
          {state.hasSchedule && !state.isEditing && (
            <button onClick={() => actions.setIsEditing(true)} disabled={state.isEditingActions} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${state.isEditingActions ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
              <Edit3 size={12} /><span>Edit Schedule</span>
            </button>
          )}
          {state.isEditing && <button onClick={() => actions.setIsEditing(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"><Check size={12} /><span>Save Changes</span></button>}
        </div>

        <div className="space-y-0">
          
          {/* 1. Check-in Marker (HIDE IF NO TASKS) */}
          {hasTasks && (() => {
              const firstTask = state.scheduleTasks[0];
              const parts = firstTask ? firstTask.timeRange.split('-') : [];
              const startTime = parts[0] ? parts[0].trim() : "";
              const isFirstStarted = firstTask ? helpers.isTimeInPast(startTime) : false;
              const isGapless = startTime === "07:00";
              return (
                  <CheckInRow 
                    timeStr={formatCheckInTime(state.checkInTime)}
                    isInsertionPointPast={isFirstStarted}
                    isGapless={isGapless}
                    onInsert={() => actions.openAddSchedule(-1)}
                  />
              );
          })()}

          {/* 2. Scheduled Tasks */}
          {state.scheduleTasks.map((task: TaskItem, index: number) => {
            const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
            const totalSecs = parseDurationToSeconds(task.timeRange);
            const progressPct = totalSecs > 0 ? (task.elapsedSeconds / totalSecs) * 100 : 0;
            const nextTask = state.scheduleTasks[index + 1];
            let isInsertionBlocked = false;
            let isGapless = false;

            if (nextTask) {
                const nextParts = nextTask.timeRange.split('-');
                const nextStart = nextParts[0] ? nextParts[0].trim() : "";
                if (helpers.isTimeInPast(nextStart)) isInsertionBlocked = true;
                const currParts = task.timeRange.split('-');
                const currEnd = currParts[1] ? currParts[1].trim() : "";
                if (currEnd === nextStart) isGapless = true;
            }

            return (
              <div key={task.id} onClick={() => !state.isEditing && task.status !== 'completed' && actions.toggleTask(task.id, false)}>
                <TaskRow 
                  id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                  progress={Math.min(progressPct, 100)} 
                  isLast={false} isEditing={state.isEditing} isLocked={isTaskLocked}
                  isInsertionPointPast={isInsertionBlocked} isGapless={isGapless}
                  onDelete={() => actions.deleteTask(task.id, false)} 
                  onInsert={() => actions.openAddSchedule(index)}
                  onEditClick={() => actions.openEditTask(task)}
                  onToggleComplete={() => actions.toggleComplete(task.id, false)}
                />
              </div>
            );
          })}

          {/* 3. Empty State (SHOW ONLY IF NO TASKS) */}
          {!hasTasks && (
            <div onClick={() => actions.openAddSchedule(-1)} className="py-8 text-center cursor-pointer group animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-400 mb-4 group-hover:scale-110 transition-transform shadow-sm ring-4 ring-white">
                    <Plus size={32} />
                </div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Add your first task</p>
                <p className="text-xs text-slate-400 mt-1">Start defining your day</p>
            </div>
          )}

          {/* 4. End Day Button (HIDE IF NO TASKS) */}
          {hasTasks && (
            <div className="pt-4 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-slate-300">23:00</span>
                <button onClick={actions.endDay} className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95">
                  <LogOut size={16} /><span>Call it a day</span>
                </button>
            </div>
          )}
        </div>
      </section>

      {/* Daily Actions Section */}
      <section className="mb-10 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Actions</h2>
          {!state.isEditingActions ? (
            <button onClick={() => actions.setIsEditingActions(true)} disabled={state.isEditing} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${state.isEditing ? 'text-slate-300 bg-slate-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
              <Edit3 size={12} /><span>Edit Actions</span>
            </button>
          ) : (
            <button onClick={() => actions.setIsEditingActions(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"><Check size={12} /><span>Save Changes</span></button>
          )}
        </div>

        <div className="-mx-6 mb-4"> 
          <FlexBucket 
            totalVolumeSeconds={state.totalVolumeSeconds} 
            workLeftSeconds={state.workLeftSeconds}
            plannedSleep={state.plannedSleep}
            plannedCheckIn={state.plannedCheckIn} // <--- Pass Config
            isFuture={state.isFuture}             // <--- Pass Future Flag
          />
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {state.dailyActions.map((action: TaskItem, index: number) => {
            const totalSecs = parseDurationToSeconds(action.timeRange);
            const rawProgress = totalSecs > 0 ? (action.elapsedSeconds / totalSecs) * 100 : 0;
            return (
              <TaskCircle 
                key={action.id} title={action.title} duration={action.timeRange} Icon={action.icon} category={action.category} 
                progress={Math.min(rawProgress, 100)} isActive={action.status === 'in_progress'} 
                onClick={() => {
                  if (action.status === 'completed') return;
                  if (state.isEditingActions) actions.openEditTask(action);
                  else actions.toggleTask(action.id, true);
                }}
                isEditing={state.isEditingActions} 
                onDelete={() => actions.deleteTask(action.id, true)}
                onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={handleDrop}
                isCompleted={action.status === 'completed'} 
                onLongPress={() => actions.toggleComplete(action.id, true)}
              />
            );
          })}
          {state.isEditingActions && (
            <div onClick={actions.openAddDaily} className="flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all shadow-sm"><Plus size={24} /></div>
              <p className="text-xs font-bold text-slate-300">Add New</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ViewActive;