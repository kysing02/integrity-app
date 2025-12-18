import React from 'react';

interface FlexBucketProps {
  totalVolumeSeconds: number;  // "Diligence" (Fills the bar)
  flexCapacitySeconds: number; // "Availability" (Text info)
}

const FlexBucket = ({ totalVolumeSeconds, flexCapacitySeconds }: FlexBucketProps) => {
  // CONFIG: Daily Target for the visual bar (e.g., 12 hours = 100% full)
  const VISUAL_TARGET_SECONDS = 12 * 60 * 60; 
  
  // Bar Percentage (Capped at 100%)
  const percentage = Math.min(100, (totalVolumeSeconds / VISUAL_TARGET_SECONDS) * 100);
  
  // Format helpers
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m > 0 ? m + 'm' : ''}`;
  };

  return (
    <div className="w-full space-y-3 px-6 py-4">
      {/* Header: Title + Volume */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
           <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Daily Volume</h3>
           <span className="text-[10px] text-slate-400 font-bold">Target: 12h</span>
        </div>
        
        <div className="text-right">
           <div className="text-xs font-medium flex items-center justify-end gap-1">
             <span className="text-indigo-600 font-black text-lg">{formatTime(totalVolumeSeconds)}</span> 
             <span className="text-slate-400 text-[10px] uppercase font-bold mt-1">Committed</span>
           </div>
        </div>
      </div>

      {/* The Bar (Visualizes Volume) */}
      <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className="absolute inset-0 opacity-30" 
             style={{ backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 50%, #cbd5e1 50%, #cbd5e1 75%, transparent 75%, transparent)', backgroundSize: '8px 8px' }} 
        />
        <div 
          className="h-full bg-indigo-500 relative transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${percentage}%` }} 
        >
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30" />
        </div>
      </div>
      
      {/* Footer: Flex Capacity (The "Scarcity" Logic) */}
      <div className="flex justify-between items-center text-[10px] font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 mt-1">
        <span className="text-slate-400 uppercase tracking-wider">Remaining Capacity</span>
        <span className={`${flexCapacitySeconds < 3600 ? 'text-rose-500' : 'text-emerald-600'}`}>
           {formatTime(flexCapacitySeconds)} left
        </span>
      </div>
    </div>
  );
};

export default FlexBucket;