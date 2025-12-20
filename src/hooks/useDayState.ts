import { useState, useEffect, useMemo } from 'react';
import { getTodayId } from '@/lib/supabase';
import * as api from '@/lib/dashboardService';

export function useDayState() {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return d;
  });

  const [dayStatus, setDayStatus] = useState<'sleeping' | 'active' | 'completed'>('sleeping');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // These hold the raw data payload to pass to the engine
  const [initialData, setInitialData] = useState<any>(null);

  // --- DERIVED DATES ---
  const dateState = useMemo(() => {
    const logicalToday = new Date();
    if (logicalToday.getHours() < 5) logicalToday.setDate(logicalToday.getDate() - 1);
    logicalToday.setHours(0, 0, 0, 0);

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
    const d = new Date();
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    setViewDate(d);
  };

  // --- LOAD DATA ---
  useEffect(() => {
    const load = async () => {
    setIsLoading(true);

      const userId = await api.getUserId();
      const dateId = getTodayId(userId, viewDate);
      
      setInitialData(null); // Reset
      const data = await api.fetchDayData(dateId);

      if (data) {
        setDayStatus(data.status as any);
        setCheckInTime(data.checkInTime);
        setCompletedAt(data.completedAt);
        setInitialData(data); // Pass this to Task Engine
      } else {
        setDayStatus('sleeping');
        setCheckInTime(null);
        setCompletedAt(null);
      }

      setIsLoading(false);
    };
    load();
  }, [viewDate]);

  return {
    viewDate, dayStatus, checkInTime, completedAt, initialData, dateState, isLoading,
    setDayStatus, setCheckInTime, navigateDay, goToToday
  };
}