"use client";

import { useState } from 'react';
import { 
  Plus, Clock, Sun, Edit3, Check, LogOut, Coffee, CalendarCheck, Layout
} from 'lucide-react';

// Components
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import TaskRow from '@/components/dashboard/TaskRow';
import FlexBucket from '@/components/dashboard/FlexBucket';
import TaskCircle from '@/components/dashboard/TaskCircle';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskEditorModal from '@/components/dashboard/TaskEditorModal';
import DaySummaryModal from '@/components/dashboard/DaySummaryModal';

// Hooks & Utils
import { useDashboard } from '@/hooks/useDashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

export default function Dashboard() {
  const { state, actions, helpers } = useDashboard();
  
  // Local Drag State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = () => setDraggedItemIndex(null);

  // Helper Formatters
  const formatCheckInTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
  
  const formatDur = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Stats for Completed View
  const totalElapsed = [...state.scheduleTasks, ...state.dailyActions].reduce((acc, t) => acc + t.elapsedSeconds, 0);
  const completedCount = [...state.scheduleTasks, ...state.dailyActions].filter(t => t.status === 'completed').length;
  const totalCount = state.scheduleTasks.length + state.dailyActions.length;
  
  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      <DashboardHeader 
        hasSchedule={state.hasSchedule} 
        isPast={false} // You can compute this: state.viewDate < today
        isEditing={state.isEditing} 
        isEditingActions={state.isEditingActions} 
        onFinishEdit={() => { actions.setIsEditing(false); actions.setIsEditingActions(false); }} 
        
        // NEW WIRING
        viewDate={state.viewDate}
        onPrevDay={() => actions.navigateDay(-1)}
        onNextDay={() => actions.navigateDay(1)}
      />
      
      {/* --- MODALS --- */}
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
      
      <DaySummaryModal 
        isOpen={state.isSummaryOpen}
        onClose={() => actions.setIsSummaryOpen(false)}
        onConfirmEnd={actions.confirmEndDay}
        events={state.timerEvents}
        tasks={[...state.scheduleTasks, ...state.dailyActions]}
        checkInTime={state.checkInTime}
        currentDate={helpers.getNow()}
      />

      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            {/* Pill (Only show if NOT completed) */}
            {state.dayStatus !== 'completed' && (
              <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${state.pillState.color}`}>
                <Clock size={12} />
                <span>{state.pillState.text}</span>
              </div>
            )}

            {/* Ribbon (Only show if NOT completed) */}
            {state.dayStatus !== 'completed' && (
              <TimelineRibbon 
                showCurrentTime={state.dayStatus === 'active'} 
                tasks={state.scheduleTasks} 
                plannedCheckIn="07:00" plannedSleep="23:00"
              />
            )}

            <div className="px-6 mt-4">
              
              {/* =========================================================
                  VIEW 1: SLEEPING (START DAY)
                  ========================================================= */}
              {state.dayStatus === 'sleeping' && (
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
              )}


              {/* =========================================================
                  VIEW 2: ACTIVE (INTERACTIVE TIMELINE)
                  ========================================================= */}
              {state.dayStatus === 'active' && (
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
                      {/* Check-in Marker */}
                      {(() => {
                          const firstTask = state.scheduleTasks[0];
                          const parts = firstTask ? firstTask.timeRange.split('-') : [];
                          const startTime = parts[0] ? parts[0].trim() : "";
                          const isFirstStarted = firstTask ? helpers.isTimeInPast(startTime) : false;
                          const isGapless = startTime === "07:00";
                          return (
                              <TaskRow 
                                  id="check-in" 
                                  title={`Checked-in at ${formatCheckInTime(state.checkInTime)}`} 
                                  timeRange="07:00" 
                                  progress={100} status="completed" category="CONSISTENCY" icon={Sun} variant="marker"
                                  isLast={false} isEditing={state.isEditing}
                                  isInsertionPointPast={isFirstStarted} isGapless={isGapless}
                                  onInsert={() => actions.openAddSchedule(-1)}
                              />
                          );
                      })()}

                      {/* Scheduled Tasks */}
                      {state.scheduleTasks.map((task, index) => {
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

                      {/* Empty State */}
                      {state.scheduleTasks.length === 0 && (
                        <div onClick={() => actions.openAddSchedule(-1)} className="py-8 text-center cursor-pointer group">
                           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-400 mb-2 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                           <p className="text-sm font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">Add your first task</p>
                        </div>
                      )}

                      {/* End Day Button */}
                      <div className="pt-4 flex flex-col items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300">23:00</span>
                          <button onClick={actions.endDay} className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95">
                            <LogOut size={16} /><span>Call it a day</span>
                          </button>
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
                      <FlexBucket totalVolumeSeconds={state.totalVolumeSeconds} flexCapacitySeconds={state.flexCapacitySeconds} workLeftSeconds={state.workLeftSeconds}/>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {state.dailyActions.map((action, index) => {
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
              )}

              {/* =========================================================
                  VIEW 3: COMPLETED (READ-ONLY RECEIPT)
                  ========================================================= */}
              {state.dayStatus === 'completed' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                    
                    {/* Receipt Header */}
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm ring-4 ring-white">
                        <CalendarCheck size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Day Completed</h2>                      
                      {/* STATS ROW */}
                      <div className="flex gap-3 mt-6 w-full justify-center">
                        
                        {/* 1. Focus Time */}
                        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[90px]">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Focus</p>
                            <p className="text-lg font-bold text-slate-700 mt-1">{formatDur(totalElapsed)}</p>
                        </div>

                        {/* 2. Idle Time (Calculated) */}
                        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[90px]">
                            {(() => {
                                // Calculate Idle on the fly for the receipt
                                const startTime = state.checkInTime ? new Date(state.checkInTime) : new Date();
                                // Note: In a real app, 'completedAt' should be saved in DB. 
                                // For MVP display, we approximate using 'now' or logic.
                                // If day is completed, we should ideally rely on a stored 'finishedTime'.
                                // For now, let's assume 'helpers.getNow()' is the finish time if freshly completed.
                                const finishTime = helpers.getNow(); 
                                const totalSession = Math.max(0, Math.floor((finishTime.getTime() - startTime.getTime()) / 1000));
                                const idle = Math.max(0, totalSession - totalElapsed);
                                
                                return (
                                  <>
                                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Idle</p>
                                    <p className="text-lg font-bold text-slate-700 mt-1">{formatDur(idle)}</p>
                                  </>
                                )
                            })()}
                        </div>

                        {/* 3. Task Count */}
                        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[90px]">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Done</p>
                            <p className="text-lg font-bold text-slate-700 mt-1">{completedCount}/{totalCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Read-Only Timeline */}
                    <div className="px-6">
                      
                      {state.scheduleTasks.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Schedule Results</h3>
                          <div className="space-y-0 relative border-l border-slate-200 ml-4 pl-6 py-2">
                            {state.scheduleTasks.map((task, index) => {
                              // LOOK AHEAD LOGIC
                              // Check if any task AFTER this one has the same title
                              const hasFutureInstance = state.scheduleTasks.slice(index + 1).some(t => t.title === task.title);
                              
                              return (
                                <div key={task.id} className="mb-4">
                                  <TaskRow 
                                    id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                                    progress={100} isLast={index === state.scheduleTasks.length - 1}
                                    readOnly={true} actualSeconds={task.elapsedSeconds}
                                    
                                    // HIDE BADGE if this is NOT the last instance of this task
                                    hideBadge={hasFutureInstance} 
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {state.dailyActions.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Daily Actions</h3>
                          <div className="space-y-0 relative border-l border-slate-200 ml-4 pl-6 py-2">
                              {state.dailyActions.map((task, index) => {
                                // LOOK AHEAD LOGIC
                                const hasFutureInstance = state.dailyActions.slice(index + 1).some(t => t.title === task.title);
                                
                                return (
                                  <div key={task.id} className="mb-4">
                                    <TaskRow 
                                      id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                                      progress={100} isLast={index === state.dailyActions.length - 1}
                                      readOnly={true} actualSeconds={task.elapsedSeconds}
                                      hideBadge={hasFutureInstance}
                                    />
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-10 text-center pb-10">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">See you tomorrow</p>
                    </div>
                </div>
              )}
            </div>
        </div>
      </div> 
      <DashboardNavbar activeTask={state.activeTask} />
    </main>
  );
}