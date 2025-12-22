"use client";
import React from 'react';
import { Target, Zap, Award, Activity } from 'lucide-react';
import { PlanningMetrics } from '@/lib/planningUtils';

interface PlanningHealthProps {
  metrics: PlanningMetrics;
}

const PlanningHealth = ({ metrics }: PlanningHealthProps) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const statCards = [
    {
      label: 'Focus Time',
      value: formatTime(metrics.averageFocusTimeSeconds),
      sublabel: 'Daily Average',
      icon: Target,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Recorded Days',
      value: metrics.totalRecordedDays,
      sublabel: 'Total Sessions',
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Consistency',
      value: `${metrics.consistencyScore}%`,
      sublabel: 'Execution Rate',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Planned Days',
      value: metrics.totalPlannedDays,
      sublabel: 'Future Targets',
      icon: Award,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-4">
               <div className={`${stat.bg} p-2.5 rounded-2xl ${stat.color}`}>
                  <stat.icon size={18} />
               </div>
            </div>
            <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <p className="text-xl font-black text-slate-800">{stat.value}</p>
               <p className="text-[10px] font-medium text-slate-400">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanningHealth;
