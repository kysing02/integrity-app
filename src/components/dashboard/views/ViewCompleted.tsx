import React from 'react';
import { CalendarCheck } from 'lucide-react';
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