import React from 'react';

interface FlexBucketProps {
  totalFlexMinutes: number;
  usedMinutes: number;
}

const FlexBucket = ({ totalFlexMinutes, usedMinutes }: FlexBucketProps) => {
  const usedPercentage = Math.min(100, (usedMinutes / totalFlexMinutes) * 100);
  
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? m + 'm' : '00'}`;
  };

  return (
    <div className="w-full space-y-3 px-6 py-4">
      <div className="flex justify-between items-end">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Flex Capacity</h3>
        <p className="text-xs font-medium">
          <span className="text-indigo-600">{formatTime(usedMinutes)}</span> 
          <span className="text-slate-400"> / {formatTime(totalFlexMinutes)}</span>
        </p>
      </div>

      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-700 ease-out rounded-full shadow-sm shadow-indigo-200"
          style={{ width: `${usedPercentage}%` }} 
        />
      </div>
    </div>
  );
};

export default FlexBucket;