import React, { useState, useEffect } from 'react';

interface FlexBucketProps {
  totalVolumeSeconds: number;
  flexCapacitySeconds: number;
  workLeftSeconds: number;
}

const FlexBucket = ({ totalVolumeSeconds, flexCapacitySeconds, workLeftSeconds }: FlexBucketProps) => {
  
  const isOvertime = flexCapacitySeconds < 0;
  const [etaString, setEtaString] = useState("");

  // --- ETA LIVE UPDATE ---
  useEffect(() => {
    const updateEta = () => {
      const now = new Date();
      // ETA = "Right Now" + "How much work I have left"
      const finishTime = new Date(now.getTime() + workLeftSeconds * 1000);
      setEtaString(finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };

    updateEta(); // Run immediately
    
    // Update every minute so the time doesn't get "stuck"
    const interval = setInterval(updateEta, 60000); 
    
    return () => clearInterval(interval);
  }, [workLeftSeconds]); 

  // --- BAR LOGIC ---
  let percentage = 0;
  if (isOvertime) {
      percentage = 100;
  } else {
      const totalBudget = totalVolumeSeconds + flexCapacitySeconds;
      const safeTotal = totalBudget > 0 ? totalBudget : 1;
      percentage = Math.min(100, (totalVolumeSeconds / safeTotal) * 100);
  }
  
  const formatTime = (totalSeconds: number) => {
    const absSeconds = Math.abs(totalSeconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    return `${h}h ${m > 0 ? m + 'm' : ''}`;
  };

  return (
    <div className="w-full space-y-3 px-6 py-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
           <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Daily Volume</h3>
        </div>
        <div className="text-right">
           <div className="text-xs font-medium flex items-center justify-end gap-1">
             <span className="text-indigo-600 font-black text-lg">{formatTime(totalVolumeSeconds)}</span> 
             <span className="text-slate-400 text-[10px] uppercase font-bold mt-1">Committed</span>
           </div>
        </div>
      </div>

      {/* Bar */}
      <div className={`relative h-3 w-full rounded-full overflow-hidden border ${isOvertime ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-100'}`}>
        <div className="absolute inset-0 opacity-30" 
             style={{ backgroundImage: `linear-gradient(45deg, ${isOvertime ? '#fecdd3' : '#cbd5e1'} 25%, transparent 25%, transparent 50%, ${isOvertime ? '#fecdd3' : '#cbd5e1'} 50%, ${isOvertime ? '#fecdd3' : '#cbd5e1'} 75%, transparent 75%, transparent)`, backgroundSize: '8px 8px' }} 
        />
        <div 
          className={`h-full relative transition-all duration-1000 ease-out shadow-sm ${isOvertime ? 'bg-rose-500' : 'bg-indigo-500'}`}
          style={{ width: `${percentage}%` }} 
        >
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30" />
        </div>
      </div>
      
      {/* Footer */}
      <div className={`flex justify-between items-center text-[10px] font-bold px-3 py-1.5 rounded-lg border mt-1 ${isOvertime ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
        <span className={`${isOvertime ? 'text-rose-400' : 'text-slate-400'} uppercase tracking-wider`}>
            {isOvertime ? 'Capacity Exceeded' : 'Remaining Capacity'}
        </span>
        
        <div className="text-right flex items-center gap-1.5">
           <span className={`${isOvertime ? 'text-rose-600' : (flexCapacitySeconds < 3600 ? 'text-amber-500' : 'text-emerald-600')}`}>
              {isOvertime ? `Over by ${formatTime(flexCapacitySeconds)}` : `${formatTime(flexCapacitySeconds)} left`}
           </span>
           <span className={`w-1 h-1 rounded-full ${isOvertime ? 'bg-rose-300' : 'bg-slate-300'}`} />
           <span className={`${isOvertime ? 'text-rose-400' : 'text-slate-400'}`}>
              Finish ~{etaString}
           </span>
        </div>
      </div>
    </div>
  );
};

export default FlexBucket;