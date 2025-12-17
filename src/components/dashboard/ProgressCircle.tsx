import React from 'react';

interface ProgressCircleProps {
  size: number;
  progress: number;
  color: string;
  children: React.ReactNode;
}

const ProgressCircle = ({ size, progress, color, children }: ProgressCircleProps) => {
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className="text-slate-100"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {children}
    </div>
  );
};

export default ProgressCircle;