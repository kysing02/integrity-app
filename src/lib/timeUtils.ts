import { TaskItem } from '@/types/dashboard';

export const getTodayDateAtTime = (timeStr: string): Date => {
  if (!timeStr) return new Date(); 

  const [hours, minutes] = timeStr.split(/[:h]/).map(str => parseInt(str) || 0);
  const date = new Date();
  
  // LOGIC FIX:
  // If the requested time is 00:00-04:59, treat it as "Tomorrow" relative to standard calendar 
  // IF we are currently in the "Day" (05:00-23:59). 
  // However, dealing with Date objects in Shifted Time is messy. 
  // For MVP safety: We perform the standard setHours.
  // The 'Pill State' comparison logic in useDashboard should ideally use getAdjustedMinutes instead.
  
  date.setHours(hours, minutes, 0, 0);
  
  // Optional: If you strictly want this function to return "The Date Occurring in this Logical Day"
  // e.g. If today is Dec 20 (logical), and timeStr is "01:00", it implies Dec 21 01:00.
  // But let's stick to standard behavior to avoid breaking calendar checks unless necessary.
  
  return date;
};

export const getTaskRemainingSeconds = (task: TaskItem, now: Date): number => {
  if (task.status === 'completed') return 0;

  if (task.isDaily) {
    const totalSeconds = parseDurationToSeconds(task.timeRange);
    return Math.max(0, totalSeconds - task.elapsedSeconds);
  }

  // Robust check for range
  if (task.timeRange.includes('-')) {
    const parts = task.timeRange.split('-');
    // Handle "09:00 - 11:30" and "09:00-11:30"
    const startStr = parts[0].trim();
    const endStr = parts[1] ? parts[1].trim() : startStr; // Fallback if split fails

    const end = getTodayDateAtTime(endStr);
    
    if (now >= end) return 0;

    const start = getTodayDateAtTime(startStr);
    const effectiveStart = now > start ? now : start;
    
    return Math.max(0, (end.getTime() - effectiveStart.getTime()) / 1000);
  }
  
  return 0;
};

/**
 * Parses a duration string (e.g., "09:00 - 10:30" or "1h 30m") into total seconds.
 * Handles overnight logic (e.g. 23:00 - 01:00) correctly using Shifted Day.
 */
export const parseDurationToSeconds = (timeRange: string): number => {
  if (!timeRange) return 0;

  // Case A: "Start - End" format (Schedule)
  if (timeRange.includes(' - ')) {
    const [startStr, endStr] = timeRange.split(' - ');
    if (!startStr || !endStr) return 0;

    const startMins = getAdjustedMinutes(startStr);
    const endMins = getAdjustedMinutes(endStr);

    // Calculate difference (e.g. 25:00 - 23:00 = 2 hours)
    let diffMins = endMins - startMins;

    // Safety clamp
    if (diffMins < 0) diffMins = 0;

    return diffMins * 60;
  }

  // Case B: "Xh Ym" format (Daily Actions)
  const hMatch = timeRange.match(/(\d+)h/);
  const mMatch = timeRange.match(/(\d+)m/);
  
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  
  return (h * 3600) + (m * 60);
};

/**
 * THE CORE LOGIC: "Shifted Day"
 * Converts "HH:MM" to minutes from 00:00, but SHIFTS early morning hours (00:00-04:59)
 * to be "after" midnight (24:00-28:59).
 * * 05:00 -> 300
 * 23:59 -> 1439
 * 00:00 -> 1440 (24h)
 * 04:59 -> 1739 (28h 59m)
 */
export const getAdjustedMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr || "0");
  const m = parseInt(mStr || "0");

  // The Shift: If hour is 0-4, add 24 hours to it.
  const adjustedHour = h < 5 ? h + 24 : h;

  return (adjustedHour * 60) + m;
};

/**
 * Returns true if the given time string (HH:MM) is logically "in the past" 
 * relative to the current "Shifted Time".
 */
export const isTimeInPastShifted = (timeStr: string): boolean => {
  const now = new Date();
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  
  // Convert current real time to shifted minutes
  const currentAdjustedHour = currentH < 5 ? currentH + 24 : currentH;
  const currentTotalMins = (currentAdjustedHour * 60) + currentM;

  // Convert target time to shifted minutes
  const targetTotalMins = getAdjustedMinutes(timeStr);

  return targetTotalMins < currentTotalMins;
};

/**
 * Standard Helper for display
 */
export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// --- TIME TRAVEL DEBUGGER ---
// Change this to "HH:MM" (e.g. "23:30") to test late-night logic.
// Set to null for real time.
const DEBUG_TIME: string | null = null; 

export const getNow = (): Date => {
  const now = new Date();
  if (DEBUG_TIME) {
    const [h, m] = DEBUG_TIME.split(':').map(Number);
    now.setHours(h, m, 0, 0);
  }
  return now;
};