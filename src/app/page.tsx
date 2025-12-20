"use client";

import { Clock } from 'lucide-react';

// --- COMPONENTS ---
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskEditorModal from '@/components/dashboard/TaskEditorModal';
import DaySummaryModal from '@/components/dashboard/DaySummaryModal';
import LoadingSkeleton from '@/components/dashboard/LoadingSkeleton'; // <--- IMPORT

// --- NEW VIEWS (The Split) ---
import ViewSleeping from '@/components/dashboard/views/ViewSleeping';
import ViewActive from '@/components/dashboard/views/ViewActive';
import ViewCompleted from '@/components/dashboard/views/ViewCompleted';

// --- HOOK ---
import { useDashboard } from '@/hooks/useDashboard';

export default function Dashboard() {
  const { state, actions, helpers } = useDashboard();
  
  const formatCheckInTime = (date: Date | null) => 
    date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
  
  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      
      {/* 1. GLOBAL HEADER (Always Visible - Date updates immediately) */}
      <DashboardHeader 
        hasSchedule={state.hasSchedule} 
        isPast={state.isPast} 
        isEditing={state.isEditing} 
        isEditingActions={state.isEditingActions} 
        onFinishEdit={() => { actions.setIsEditing(false); actions.setIsEditingActions(false); }} 
        viewDate={state.viewDate}
        onPrevDay={() => actions.navigateDay(-1)}
        onNextDay={() => actions.navigateDay(1)}
        onJumpToToday={actions.goToToday}
      />
      
      {/* 2. GLOBAL MODALS */}
      <TaskEditorModal 
        isOpen={state.modalConfig.isOpen}
        mode={state.modalConfig.mode}
        type={state.modalConfig.type}
        initialData={state.modalConfig.initialData}
        existingTasks={state.scheduleTasks}
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

      {/* 3. SCROLLABLE CONTENT AREA */}
      <div className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-[101%] pb-48"> 
            
            {/* --- LOADING STATE --- */}
            {state.isLoading ? (
               <LoadingSkeleton />
            ) : (
               <>
                 {/* A. STATUS PILL */}
                 {state.dayStatus !== 'completed' && (
                   <div className={`mt-6 mb-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full px-4 w-fit mx-auto border shadow-sm ${state.pillState.color}`}>
                     <Clock size={12} />
                     <span>{state.pillState.text}</span>
                   </div>
                 )}

                 {/* B. TIMELINE RIBBON */}
                 {state.dayStatus !== 'completed' && (
                   <TimelineRibbon 
                     showCurrentTime={state.dayStatus === 'active'} 
                     tasks={state.scheduleTasks} 
                     plannedCheckIn="07:00" plannedSleep="23:00"
                   />
                 )}

                 <div className="px-6 mt-4">
                   
                   {/* VIEW 1: SLEEPING */}
                   {state.dayStatus === 'sleeping' && (
                      <ViewSleeping 
                        isFuture={state.isFuture} 
                        isPast={state.isPast} 
                        isToday={state.isToday} 
                        viewDate={state.viewDate} 
                        actions={actions} 
                      />
                   )}

                   {/* VIEW 2: ACTIVE */}
                   {state.dayStatus === 'active' && (
                      <ViewActive 
                         state={state} 
                         actions={actions} 
                         helpers={helpers} 
                         formatCheckInTime={formatCheckInTime} 
                      />
                   )}

                   {/* VIEW 3: COMPLETED */}
                   {state.dayStatus === 'completed' && (
                      <ViewCompleted state={state} helpers={helpers} />
                   )}
                   
                 </div>
               </>
            )}
            
        </div>
      </div> 
      
      {/* 4. GLOBAL BOTTOM NAV */}
      <DashboardNavbar activeTask={state.activeTask} />
    </main>
  );
}