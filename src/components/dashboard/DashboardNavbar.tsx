import React from 'react';
import { Layout, Calendar, Bot, BarChart3, Play, Users } from 'lucide-react';
import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

interface DashboardNavbarProps {
  activeTask?: TaskItem;
}

const DashboardNavbar = ({ activeTask }: DashboardNavbarProps) => {
  // --- ORB DATA CALCULATION ---
  const activeTotalSeconds = activeTask ? parseDurationToSeconds(activeTask.timeRange) : 0;
  const activeElapsed = activeTask ? activeTask.elapsedSeconds : 0;
  
  const orbHours = Math.floor(activeElapsed / 3600);
  const orbMinutes = Math.floor((activeElapsed % 3600) / 60);
  const orbSeconds = activeElapsed % 60; 
  
  // --- VISUAL THEME LOGIC ---
  const isEfficiency = activeTask?.category === 'EFFICIENCY';
  
  const orbRingColor = isEfficiency ? 'text-emerald-500' : 'text-indigo-500';
  const orbTextColor = isEfficiency ? 'text-emerald-300' : 'text-indigo-300';
  const orbShadowColor = isEfficiency ? 'shadow-emerald-900/20' : 'shadow-indigo-900/20';
  const orbPillColor = isEfficiency ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-indigo-500/20 border-indigo-500/30';

  return (
    <div className="fixed bottom-0 w-full z-50">
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none" />
      <div className="relative pb-[env(safe-area-inset-bottom)]">
        <nav className="mx-4 mb-4 bg-slate-900 text-slate-400 rounded-[2.5rem] px-6 py-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 relative z-50">
          
          {/* Left Group */}
          <div className="flex gap-5">
            <button className="flex flex-col items-center gap-1 text-indigo-400 transition-colors">
              <Layout size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold">Dashboard</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
              <Calendar size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold">Planner</span>
            </button>
          </div>

          <div className="w-24" />

          {/* Right Group */}
          <div className="flex gap-5">
            <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
              <Bot size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold">Templates</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-slate-200 transition-colors">
              <BarChart3 size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold">Analytics</span>
            </button>
          </div>

          {/* THE COMMAND ORB */}
          <div className="absolute left-1/2 -top-10 -translate-x-1/2 flex flex-col items-center z-50">
            <div className={`relative w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-50 shadow-xl ${orbShadowColor} flex items-center justify-center mb-3`}>
              <div className="absolute inset-1 rounded-full border-4 border-slate-800" />
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full p-1" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" stroke="transparent" strokeWidth="4" fill="none" />
                  {(() => {
                      const circumference = 213;
                      let dashOffset = 213;
                      
                      if (activeTask) {
                        if (isEfficiency) {
                          dashOffset = 0; // 100% Filled
                        } else {
                          const rawProgress = activeTotalSeconds > 0 ? (activeElapsed / activeTotalSeconds) * circumference : 0;
                          const clampedProgress = Math.min(rawProgress, circumference);
                          dashOffset = circumference - clampedProgress;
                        }
                      }
                      
                      return (
                        <circle 
                          cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="4" fill="none" 
                          strokeDasharray={circumference} 
                          strokeDashoffset={Math.max(0, dashOffset)} 
                          className={`${activeTask ? orbRingColor : 'text-slate-700'} transition-all duration-1000 ease-in-out`} 
                          strokeLinecap="round" 
                        />
                      );
                  })()}
              </svg>
              
              <div className="relative flex flex-col items-center justify-center text-white z-20 mt-0.5">
                  {activeTask ? (
                    <activeTask.icon size={18} className={`${orbTextColor} animate-pulse`} />
                  ) : (
                    <Play size={18} className="text-slate-500" />
                  )}
                  
                  {activeTask ? (
                    <div className="flex items-baseline gap-[1px]">
                      {orbHours > 0 && (
                        <>
                          <span className="text-[10px] font-black tracking-tighter">{orbHours}</span>
                          <span className={`text-[10px] font-bold ${orbTextColor} mr-0.5`}>h</span>
                        </>
                      )}
                      <span className="text-[10px] font-black tracking-tighter">{orbMinutes}</span>
                      <span className={`text-[10px] font-bold ${orbTextColor} mr-0.5`}>m</span>
                      <span className="text-[10px] font-black tracking-tighter">{orbSeconds}</span>
                      <span className={`text-[10px] font-bold ${orbTextColor}`}>s</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">IDLE</span>
                  )}
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full shadow-sm backdrop-blur-md border ${activeTask ? orbPillColor : 'bg-slate-800/50 border-slate-700'}`}>
               <span className={`text-[9px] font-black uppercase tracking-widest block ${activeTask ? 'text-white animate-pulse' : 'text-white'}`}>
                 {activeTask ? 'Tracking' : 'Ready'}
               </span>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DashboardNavbar;