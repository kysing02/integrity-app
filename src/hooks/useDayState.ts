import { useState, useEffect, useMemo, useRef } from 'react';
import { getTodayId } from '@/lib/supabase';
import * as api from '@/lib/dashboardService';

export function useDayState() {
  // Helper to calculate Logical Today (5AM rule)
  const getLogicalToday = () => {
    const d = new Date();
    // Use Local Hours to determine if we are in the "Late Night" of the previous day
    const hours = d.getHours();
    if (hours < 5) {
      d.setDate(d.getDate() - 1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [viewDate, setViewDate] = useState(() => getLogicalToday());

  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('sleeping');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plannedCheckIn, setPlannedCheckIn] = useState("07:00");
  const [plannedSleep, setPlannedSleep] = useState("23:00");

  // --- BOUNDARY WATCHER (THE FIX) ---
  // Checks every minute if we crossed 5AM. 
  // If we are currently viewing "Today", we auto-update to the "New Today".
  useEffect(() => {
    const checkBoundary = () => {
      const currentLogicalToday = getLogicalToday();
      
      // Compare timestamps
      if (currentLogicalToday.getTime() !== viewDate.getTime()) {
         // Only auto-update if we were looking at the "Old Today"
         // If user manually navigated to 3 days ago, don't force them back.
         const previousLogicalToday = new Date(currentLogicalToday);
         previousLogicalToday.setDate(previousLogicalToday.getDate() - 1);

         if (viewDate.getTime() === previousLogicalToday.getTime()) {
             console.log("5AM Boundary Crossed: Refreshing View to New Day");
             setViewDate(currentLogicalToday);
         }
      }
    };

    const interval = setInterval(checkBoundary, 60000); // Check every minute
    
    // Also check on window focus (e.g. switching back to tab)
    const onFocus = () => checkBoundary();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [viewDate]); // Re-bind when viewDate updates

  // --- DERIVED DATES ---
  const dateState = useMemo(() => {
    const logicalToday = getLogicalToday();
    const view = new Date(viewDate);
    view.setHours(0, 0, 0, 0);

    return {
      isToday: view.getTime() === logicalToday.getTime(),
      isPast: view.getTime() < logicalToday.getTime(),
      isFuture: view.getTime() > logicalToday.getTime(),
    };
  }, [viewDate]);

  // --- ACTIONS ---
  const navigateDay = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + offset);
    setViewDate(newDate);
  };
  
  const goToToday = () => {
    setViewDate(getLogicalToday());
  };

  // --- LOAD DATA ---
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const userId = await api.getUserId();
      const dateId = getTodayId(userId, viewDate);
      
      setInitialData(null); 
      const data = await api.fetchDayData(dateId);

      if (data) {
        setDayStatus(data.status as any);
        setCheckInTime(data.checkInTime);
        setCompletedAt(data.completedAt);
        setInitialData(data); 
        setPlannedCheckIn(data.plannedCheckIn);
        setPlannedSleep(data.plannedSleep);
      } else {
        setDayStatus('sleeping');
        setCheckInTime(null);
        setCompletedAt(null);
        setPlannedCheckIn("07:00");
        setPlannedSleep("23:00");
      }
      
      setIsLoading(false);
    };
    load();
  }, [viewDate]);

  return {
    viewDate, dayStatus, checkInTime, completedAt, initialData, dateState, isLoading, plannedCheckIn, plannedSleep,
    setDayStatus, setCheckInTime, navigateDay, goToToday, setPlannedCheckIn, setPlannedSleep
  };
}