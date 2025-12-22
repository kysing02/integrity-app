"use client";

import { useEffect, useRef } from 'react'; // <--- IMPORTED
import { Clock } from 'lucide-react';

// --- COMPONENTS ---
import TimelineRibbon from '@/components/dashboard/TimelineRibbon';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskEditorModal from '@/components/dashboard/TaskEditorModal';
import DaySummaryModal from '@/components/dashboard/DaySummaryModal';
import DaySettingsModal from '@/components/dashboard/DaySettingsModal';
import LoadingSkeleton from '@/components/dashboard/LoadingSkeleton';

// --- NEW VIEWS (The Split) ---
import ViewSleeping from '@/components/dashboard/views/ViewSleeping';
import ViewActive from '@/components/dashboard/views/ViewActive';
import ViewCompleted from '@/components/dashboard/views/ViewCompleted';
import PlannerView from '@/components/dashboard/views/PlannerView';

// --- HOOK ---
import { useDashboard } from '@/hooks/useDashboard';
import { useState } from 'react';

export default function Dashboard() {
  const { state, actions, helpers } = useDashboard();
  
  // 1. REF FOR SCROLL CONTAINER
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'planner'>('dashboard');

  // 2. EFFECT: SCROLL TO TOP ON DATE CHANGE
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [state.viewDate]); // Trigger whenever the date changes

  // Helper Formatter
  const formatCheckInTime = (date: Date | null) => 
    date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
  
  return (
    <main className="h-full w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col">
      
      {/* GLOBAL HEADER */}
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
        onPlannerClick={() => setCurrentTab('planner')}
        showDateBar={currentTab === 'dashboard'}
      />
      
      {/* GLOBAL MODALS */}
      <TaskEditorModal 
        isOpen={state.modalConfig.isOpen}
        mode={state.modalConfig.mode}
        type={state.modalConfig.type}
        initialData={state.modalConfig.initialData}
        existingTasks={state.scheduleTasks}
        minTime={state.modalConfig.minTime}
        maxTime={state.modalConfig.maxTime}
        plannedCheckIn={state.plannedCheckIn}
        plannedSleep={state.plannedSleep}
        onClose={actions.closeModal}
        onSave={actions.saveTask}
        onDelete={() => {
            if (state.modalConfig.initialData?.id) {
              actions.deleteTask(state.modalConfig.initialData.id, state.modalConfig.type === 'daily');
            }
        }}
      />
      
      <DaySettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        plannedCheckIn={state.plannedCheckIn}
        plannedSleep={state.plannedSleep}
        onSave={actions.updateDayConfig}
        onEndDay={actions.endDay}
        showEndDay={!state.isFuture}
      />
      
      <DaySummaryModal 
        isOpen={state.isSummaryOpen}
        onClose={() => actions.setIsSummaryOpen(false)}
        onConfirmEnd={() => actions.confirmEndDay()}
        events={state.timerEvents}
        tasks={[...state.scheduleTasks, ...state.dailyActions]}
        checkInTime={state.checkInTime}
        currentDate={state.viewDate}
      />

      {/* 3. SCROLLABLE CONTENT AREA - ATTACH REF HERE */}
      <div 
        ref={scrollRef} // <--- ATTACH REF
        className="scroller flex-1 overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth"
      >
        <div className="min-h-[101%] pb-48"> 
            
            {/* LOADING STATE */}
            {state.isLoading ? (
               <LoadingSkeleton />
            ) : currentTab === 'planner' ? (
              <div className="px-6 mt-6">
                <PlannerView setViewDate={(d) => {
                  actions.setViewDate(d);
                  setCurrentTab('dashboard');
                }} />
              </div>
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
                     tasks={state.scheduleTasks} 
                     plannedCheckIn={state.plannedCheckIn} 
                     plannedSleep={state.plannedSleep}
                     showCurrentTime={state.isToday}
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
                         onOpenSettings={() => setIsSettingsOpen(true)}
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
      
      {/* GLOBAL BOTTOM NAV */}
      <DashboardNavbar 
        activeTask={state.activeTask || undefined} 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />
    </main>
  );
}
