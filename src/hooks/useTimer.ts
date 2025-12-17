// hooks/useTimer.ts
import { useState, useEffect } from 'react';

export const useTimer = (targetTask: Task | null) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && targetTask) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, targetTask]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  return { elapsed, isRunning, toggleTimer };
};