import React from 'react';
import { CalendarCheck, Sun, Moon, Timer } from 'lucide-react';
import TaskRow from '@/components/dashboard/TaskRow';
import { TaskItem } from '@/types/dashboard';

interface ViewCompletedProps {
  state: any;
  helpers: any;
}

const ViewCompleted = ({ state, helpers }: ViewCompletedProps) => {
  
  const formatDur = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (date: Date | null) => 
    date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "--:--";

  const totalElapsed = [...state.scheduleTasks, ...state.dailyActions].reduce((acc: number, t: TaskItem) => acc + t.elapsedSeconds, 0);
  const completedCount = [...state.scheduleTasks, ...state.dailyActions].filter((t: TaskItem) => t.status === 'completed').length;
  const totalCount = state.scheduleTasks.length + state.dailyActions.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
        
        {/* Receipt Header */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm ring-4 ring-white">
            <CalendarCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Day Completed</h2>
          
          {/* CHECK-IN/OUT COMPARISON */}
          <div className="grid grid-cols-2 gap-4 mt-8 w-full">
            {/* Check-in comparison */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                  <Sun size={14} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start of Day</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Planned</p>
                  <p className="text-sm font-bold text-slate-600">{state.plannedCheckIn}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Actual</p>
                  <p className="text-sm font-black text-indigo-600">{formatTime(state.checkInTime)}</p>
                </div>
              </div>
            </div>

            {/* Check-out comparison */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                  <Moon size={14} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End of Day</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Planned</p>
                  <p className="text-sm font-bold text-slate-600">{state.plannedSleep}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Actual</p>
                  <p className="text-sm font-black text-indigo-600">{formatTime(state.completedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="flex gap-3 mt-4 w-full justify-center">
            
            {/* 1. Focus Time */}
            <div className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Focus</p>
                <p className="text-lg font-bold text-slate-700 mt-1">{formatDur(totalElapsed)}</p>
            </div>

            {/* 2. Idle Time (Calculated) */}
            <div className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                {(() => {
                    const startTime = state.checkInTime ? new Date(state.checkInTime) : new Date();
                    const finishTime = state.completedAt ? new Date(state.completedAt) : helpers.getNow();
                    
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
            <div className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Done</p>
                <p className="text-lg font-bold text-slate-700 mt-1">{completedCount}/{totalCount}</p>
            </div>
          </div>
        </div>
        
        {/* Real Timeline Visualization */}
        <section className="mt-4 mb-10">
          <div className="mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Timer size={14} className="text-slate-400" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Timeline</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="relative h-8 w-full bg-slate-100 overflow-hidden rounded-full mb-4">
              {/* This is a simplified version of the ribbon for the "Real" time segments */}
              {(() => {
                const startTime = state.checkInTime ? new Date(state.checkInTime).getTime() : Date.now();
                const finishTime = state.completedAt ? new Date(state.completedAt).getTime() : Date.now();
                const totalDuration = finishTime - startTime;

                if (totalDuration <= 0 || state.timerEvents.length === 0) return <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">No execution data recorded</div>;

                const events = [...state.timerEvents].sort((a, b) => a.timestamp - b.timestamp);
                const segments = [];
                
                for (let i = 0; i < events.length; i++) {
                  const event = events[i];
                  if (event.action === 'START') {
                    const startTs = event.timestamp;
                    let endTs = finishTime;
                    
                    // Look for next STOP for same task, or any next event
                    const nextStop = events.slice(i + 1).find(e => e.taskId === event.taskId && e.action === 'STOP');
                    if (nextStop) {
                      endTs = nextStop.timestamp;
                    } else if (events[i+1]) {
                      endTs = events[i+1].timestamp;
                    }

                    const left = ((startTs - startTime) / totalDuration) * 100;
                    const width = ((endTs - startTs) / totalDuration) * 100;
                    const task = [...state.scheduleTasks, ...state.dailyActions].find(t => t.id === event.taskId);
                    const color = task?.category === 'EFFICIENCY' ? 'bg-emerald-500' : 'bg-indigo-500';

                    segments.push(
                      <div 
                        key={event.id}
                        className={`absolute h-full ${color} opacity-80 border-r border-white/20`}
                        style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(0, width)}%` }}
                        title={task?.title}
                      />
                    );
                  }
                }
                return segments;
              })()}
            </div>
            <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">
              <span>{formatTime(state.checkInTime)}</span>
              <span>{formatTime(state.completedAt)}</span>
            </div>
          </div>
        </section>

        {/* Read-Only Results List */}
        <div className="px-6">
          
          {state.scheduleTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Schedule Results</h3>
              <div className="space-y-0 relative border-l border-slate-200 ml-4 pl-6 py-2">
                {state.scheduleTasks.map((task: TaskItem, index: number) => {
                  const hasFutureInstance = state.scheduleTasks.slice(index + 1).some((t: TaskItem) => t.title === task.title);
                  return (
                    <div key={task.id} className="mb-4">
                      <TaskRow 
                        id={task.id} title={task.title} timeRange={task.timeRange} status={task.status} category={task.category} icon={task.icon} 
                        progress={100} isLast={index === state.scheduleTasks.length - 1}
                        readOnly={true} actualSeconds={task.elapsedSeconds}
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
                  {state.dailyActions.map((task: TaskItem, index: number) => {
                    const hasFutureInstance = state.dailyActions.slice(index + 1).some((t: TaskItem) => t.title === task.title);
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
          
          <div className="mt-10 text-center pb-10">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">See you tomorrow</p>
          </div>
        </div>
    </div>
  );
};

export default ViewCompleted;