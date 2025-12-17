import React, { useState, useEffect } from 'react';

// You can pass specific tasks here later to render the colored blocks
const TimelineRibbon = () => {
  const [percentagePos, setPercentagePos] = useState(0);

  useEffect(() => {
    // Update the red line position every minute
    const updatePosition = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setPercentagePos((minutesSinceMidnight / 1440) * 100);
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-3 px-6 py-4">
      {/* The Glass Container */}
      <div className="relative h-6 w-full bg-slate-100/80 backdrop-blur-sm overflow-hidden rounded-full border border-slate-200">
        
        {/* Example Background Blocks (Static for MVP, Dynamic later) */}
        <div className="absolute inset-0 flex">
           {/* Example: 9am - 11:30am (Deep Work) */}
           <div className="absolute h-full bg-indigo-400/20" style={{ left: '37.5%', width: '10.4%' }} />
           {/* Example: 1pm - 2pm (Meeting) */}
           <div className="absolute h-full bg-emerald-400/20" style={{ left: '54.1%', width: '4.1%' }} />
        </div>

        {/* The "Now" Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-10 transition-all duration-1000"
          style={{ left: `${percentagePos}%` }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-600 rounded-full" />
        </div>
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>00:00</span>
      </div>
    </div>
  );
};

export default TimelineRibbon;