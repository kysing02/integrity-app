"use client";
import React, { useState, useEffect } from 'react';
import IntegrityCalendar from '@/components/dashboard/IntegrityCalendar';
import PlanningHealth from '@/components/dashboard/PlanningHealth';
import { fetchCalendarData, getUserId } from '@/lib/dashboardService';
import { calculatePlanningMetrics } from '@/lib/planningUtils';
import LoadingSkeleton from '@/components/dashboard/LoadingSkeleton';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

const PlannerView = ({ setViewDate }: { setViewDate: (d: Date) => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>({ days: [], tasks: [] });
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const userId = await getUserId();
      
      // Load current, prev, and next month for smooth transition
      const start = format(subMonths(new Date(), 2), 'yyyy-MM-dd');
      const end = format(addMonths(new Date(), 2), 'yyyy-MM-dd');
      
      const result = await fetchCalendarData(start, end);
      setData(result);
      setMetrics(calculatePlanningMetrics(result.days, result.tasks));
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      
      {/* 1. HEALTH DASHBOARD */}
      <section>
         <div className="mb-6 border-b border-slate-100 pb-2 flex justify-between items-end">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planning Health</h2>
         </div>
         <PlanningHealth metrics={metrics} />
      </section>

      {/* 2. CALENDAR */}
      <section>
         <div className="mb-6 border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calendar View</h2>
         </div>
         <IntegrityCalendar 
            days={data.days} 
            tasks={data.tasks} 
            onDateClick={(date) => {
               setViewDate(date);
               // The parent will switch view to dashboard
            }} 
         />
      </section>

    </div>
  );
};

export default PlannerView;
