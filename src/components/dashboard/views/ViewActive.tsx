import React, { useState } from 'react';
import { Plus, Edit3, Check, LogOut, Settings2 } from 'lucide-react';
import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds, getAdjustedMinutes } from '@/lib/timeUtils';

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
  onOpenSettings: () => void;
}

const ViewActive = ({ state, actions, helpers, formatCheckInTime, onOpenSettings }: ViewActiveProps) => {
  // Local Drag State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = () => setDraggedItemIndex(null);

  // --- LOGIC: Check if we have tasks ---
  const hasTasks = state.scheduleTasks.length > 0;

  // --- LOGIC: Boundary Clashes ---
  const boundaryClashes = state.scheduleTasks.some((t: TaskItem) => {
    if (!t.timeRange.includes(' - ')) return false;
    const [start, end] = t.timeRange.split(' - ');
    return getAdjustedMinutes(start.trim()) < getAdjustedMinutes(state.plannedCheckIn) ||
      getAdjustedMinutes(end.trim()) > getAdjustedMinutes(state.plannedSleep);
  });

  return (
    <>
      <section className="mb-10 animate-in fade-in duration-500">
        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {state.isToday ? "Today's" : state.isFuture ? "Planned" : "Past"} Timeline
            </h2>
            {boundaryClashes && (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                <Settings2 size={10} /> Tasks outside day boundaries
              </span>
            )}
          </div>
          {!state.isEditing && (
            <button onClick={() => actions.setIsEditing(true)} disabled={state.isEditingActions} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${state.isEditingActions ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
              <Edit3 size={12} /><span>Edit Schedule</span>
            </button>
          )}
          {state.isEditing && <button onClick={() => actions.setIsEditing(false)} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"><Check size={12} /><span>Save Changes</span></button>}
        </div>

        <div className="space-y-0">

          {/* 1. Check-in Marker (ALWAYS SHOW) */}
          {(() => {
            const firstTask = state.scheduleTasks[0];
            const parts = firstTask ? firstTask.timeRange.split('-') : [];
            const startTime = parts[0] ? parts[0].trim() : "";
            const isFirstStarted = firstTask ? helpers.isTimeInPast(startTime) : false;
            const isGapless = startTime === state.plannedCheckIn;
            return (
              <CheckInRow
                timeStr={state.checkInTime ? formatCheckInTime(state.checkInTime) : "--:--"}
                isInsertionPointPast={isFirstStarted}
                isGapless={isGapless}
                onInsert={() => actions.openAddSchedule(-1)}

                // --- NEW PROPS ---
                isFuture={state.isFuture}
                hasCheckInTime={!!state.checkInTime}
                plannedCheckIn={state.plannedCheckIn}
                onCheckInNow={actions.startDay} // Re-use startDay to trigger the Check-In timestamp
                onPlanClick={state.isEditing ? onOpenSettings : undefined}
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
                  progress={progressPct}
                  isLast={false} isEditing={state.isEditing} isLocked={isTaskLocked}
                  isInsertionPointPast={isInsertionBlocked} isGapless={isGapless}
                  isFuture={state.isFuture}
                  onDelete={() => actions.deleteTask(task.id, false)}
                  onInsert={() => actions.openAddSchedule(index)}
                  onEditClick={() => actions.openEditTask(task)}
                  onToggleComplete={() => actions.toggleComplete(task.id, false)}
                />
              </div>
            );
          })}

          {/* 3. Add Task Button (ALWAYS SHOW) */}
          <div
            onClick={() => actions.openAddSchedule(state.scheduleTasks.length - 1)}
            className={`py-8 text-center cursor-pointer group animate-in zoom-in-95 duration-300 ${hasTasks ? 'mt-2 border-t border-dashed border-slate-100' : ''}`}
          >
            <div className={`inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-400 group-hover:scale-110 transition-transform shadow-sm ring-4 ring-white ${hasTasks ? 'w-10 h-10 mb-2' : 'w-16 h-16 mb-4'}`}>
              <Plus size={hasTasks ? 20 : 32} />
            </div>
            <p className={`font-bold text-slate-800 group-hover:text-indigo-600 transition-colors ${hasTasks ? 'text-xs' : 'text-sm'}`}>Add new task</p>
            {!hasTasks && <p className="text-xs text-slate-400 mt-1">Start defining your day</p>}
          </div>

          {/* 4. End Day Button (ALWAYS SHOW AS TARGET MARKER) */}
          <div className="pt-4 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300">{state.plannedSleep}</span>
            {state.isFuture ? (
              state.isEditing && (
                <button onClick={onOpenSettings} className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95">
                  <Settings2 size={16} /><span>Plan Sleep Time</span>
                </button>
              )
            ) : (
              <button onClick={actions.endDay} className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95">
                <LogOut size={16} /><span>Call it a day</span>
              </button>
            )}
          </div>
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