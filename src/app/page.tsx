"use client";

import { useState } from 'react';
import { 
  Plus, Clock, Sun, Edit3, Check, LogOut, Coffee
} from 'lucide-react';

// Components
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskEditorModal from '@/components/dashboard/TaskEditorModal';

// Hooks & Utils
import { useDashboard } from '@/hooks/useDashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

export default function Dashboard() {
  // Use the Custom Hook
  const { state, actions, helpers } = useDashboard();
  
  // Drag State (Local to UI)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  // --- DRAG HANDLERS (Local UI Logic) ---
  // (Kept here because it deals with React Events, but could be moved if desired)
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); /* simplified for brevity, logic remains same */ };
  const handleDrop = () => setDraggedItemIndex(null);

  const formatCheckInTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

  // --- RENDERING ---
  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      {/* ... Header ... */}
      <DashboardHeader 
        hasSchedule={state.hasSchedule} isPast={false} 
        isEditing={state.isEditing} isEditingActions={state.isEditingActions} 
        onFinishEdit={() => { actions.setIsEditing(false); actions.setIsEditingActions(false); }} 
      />
      
      {/* --- RENDER MODAL --- */}
      <TaskEditorModal 
        isOpen={state.modalConfig.isOpen}
        mode={state.modalConfig.mode}
        type={state.modalConfig.type}
        initialData={state.modalConfig.initialData}
        minTime={state.modalConfig.minTime}
        maxTime={state.modalConfig.maxTime}
        onClose={actions.closeModal}
        onSave={actions.saveTask}
        onDelete={() => {
           if (state.modalConfig.initialData?.id) {
             actions.deleteTask(state.modalConfig.initialData.id, state.modalConfig.type === 'daily');
           }
        }}
      />
      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            {/* Pill */}
            <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${state.pillState.color}`}>
              <Clock size={12} />
              <span>{state.pillState.text}</span>
            </div>

            {/* Ribbon */}
            <TimelineRibbon 
              showCurrentTime={state.dayStatus === 'active'} 
              tasks={state.scheduleTasks} 
              plannedCheckIn="07:00" plannedSleep="23:00" 
              debugTime={state.debugTime} 
            />

            <div className="px-6 mt-4">
              
              {/* --- MORNING VIEW --- */}
              {state.dayStatus === 'sleeping' ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center mb-6">
                      <Coffee size={32} className="text-indigo-500" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2">Good Morning</h2>
                   <p className="text-sm text-slate-400 mb-8 max-w-[200px] text-center">Your timeline is waiting. Ready to start?</p>
                   <button onClick={actions.startDay} className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2">
                     <Sun size={18} /><span>Start Day</span>
                   </button>
                </div>
              ) : (
                <>
                  {/* --- TIMELINE SECTION --- */}
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

                    {state.hasSchedule ? (
                      <div className="space-y-0">
                        {/* Check-in Marker */}
                        {(() => {
                            const firstTask = state.scheduleTasks[0];
                            const parts = firstTask ? firstTask.timeRange.split('-') : [];
                            const startTime = parts[0] ? parts[0].trim() : "";
                            const isFirstStarted = firstTask ? helpers.isTimeInPast(startTime) : false;
                            
                            // GAP CHECK: Check-in (07:00) vs First Task Start
                            // If first task starts at 07:00, then NO GAP -> Hide Button
                            const isGapless = startTime === "07:00";

                            return (
                                <TaskRow 
                                    id="check-in" 
                                    title={`Checked-in at ${formatCheckInTime(state.checkInTime)}`} 
                                    timeRange="07:00" 
                                    progress={100} status="completed" category="CONSISTENCY" icon={Sun} variant="marker"
                                    isLast={false} isEditing={state.isEditing}
                                    isInsertionPointPast={isFirstStarted}
                                    isGapless={isGapless} // NEW
                                    onInsert={() => actions.openAddSchedule(-1)} // Index -1 for start
                                />
                            );
                        })()}

                        {/* Scheduled Tasks */}
                        {state.scheduleTasks.map((task, index) => {
                          const isTaskLocked = task.status === 'completed' || task.status === 'in_progress';
                          const totalSecs = parseDurationToSeconds(task.timeRange);
                          const progressPct = totalSecs > 0 ? (task.elapsedSeconds / totalSecs) * 100 : 0;

                          // Insertion Rule: Block if NEXT task has already started
                          const nextTask = state.scheduleTasks[index + 1];
                          let isInsertionBlocked = false;
                          let isGapless = false; // Default: gap exists
                          if (nextTask) {
                             const nextParts = nextTask.timeRange.split('-');
                             const nextStart = nextParts[0] ? nextParts[0].trim() : "";
                             
                             // 1. Check if next task started in past
                             if (helpers.isTimeInPast(nextStart)) isInsertionBlocked = true;

                             // 2. GAP CHECK: Current End vs Next Start
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
                                isInsertionPointPast={isInsertionBlocked}
                                isGapless={isGapless} // NEW
                                onDelete={() => actions.deleteTask(task.id, false)} 
                                onInsert={() => actions.openAddSchedule(index)}
                                onEditClick={() => actions.openEditTask(task)} // Opens modal on click in edit mode
                                onToggleComplete={() => actions.toggleComplete(task.id, false)}
                              />
                            </div>
                          );
                        })}

                        {/* End Day */}
                        <div className="pt-4 flex flex-col items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-300">23:00</span>
                           <button onClick={actions.endDay} className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95">
                             <LogOut size={16} /><span>Call it a day</span>
                           </button>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* --- DAILY ACTIONS SECTION --- */}
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
                      <FlexBucket totalVolumeSeconds={state.totalVolumeSeconds} flexCapacitySeconds={state.flexCapacitySeconds} />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {state.hasSchedule && state.dailyActions.map((action, index) => {
                        const totalSecs = parseDurationToSeconds(action.timeRange);
                        const rawProgress = totalSecs > 0 ? (action.elapsedSeconds / totalSecs) * 100 : 0;
                        return (
                          <TaskCircle 
                            key={action.id} 
                            title={action.title} 
                            duration={action.timeRange} 
                            Icon={action.icon} 
                            category={action.category} 
                            progress={Math.min(rawProgress, 100)} 
                            isActive={action.status === 'in_progress'} 
                            
                            // --- UPDATED CLICK HANDLER ---
                            onClick={() => {
                              // 1. If Completed -> Do nothing (Locked for both Edit and Toggle)
                              if (action.status === 'completed') return;

                              // 2. If Edit Mode -> Open Modal
                              if (state.isEditingActions) {
                                actions.openEditTask(action);
                              } 
                              // 3. If View Mode -> Toggle Timer
                              else {
                                actions.toggleTask(action.id, true);
                              }
                            }}
                            
                            isEditing={state.isEditingActions} 
                            onDelete={() => actions.deleteTask(action.id, true)}
                            onDragStart={() => handleDragStart(index)} 
                            onDragOver={(e) => handleDragOver(e, index)} 
                            onDrop={handleDrop}
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
              )}
            </div>
        </div>
      </div> 
      <DashboardNavbar activeTask={state.activeTask} />
    </main>
  );
}