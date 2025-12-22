import { TaskItem } from '@/types/dashboard';

/**
 * Returns a Date object for a given time string (HH:MM) relative to Today.
 * Note: This is primarily for display/local comparison.
 */
export const getTodayDateAtTime = (timeStr: string): Date => {
  if (!timeStr) return new Date(); 

  const [hours, minutes] = timeStr.split(/[:h]/).map(str => parseInt(str) || 0);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
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
    const startStr = parts[0].trim();
    const endStr = parts[1] ? parts[1].trim() : startStr;

    const startMins = getAdjustedMinutes(startStr);
    const endMins = getAdjustedMinutes(endStr);
    
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    const nowMins = (nowH < 5 ? nowH + 24 : nowH) * 60 + nowM;

    if (nowMins >= endMins) return 0;
    
    const effectiveStartMins = Math.max(startMins, nowMins);
    return Math.max(0, (endMins - effectiveStartMins) * 60);
  }
  
  return 0;
};

/**
 * Parses a duration string (e.g., "09:00 - 10:30" or "1h 30m") into total seconds.
 * Correctly handles 5AM boundary.
 */
export const parseDurationToSeconds = (timeRange: string): number => {
  if (!timeRange) return 0;

  // Case A: "Start - End" format (Schedule)
  if (timeRange.includes(' - ')) {
    const [startStr, endStr] = timeRange.split(' - ');
    if (!startStr || !endStr) return 0;

    const startMins = getAdjustedMinutes(startStr);
    const endMins = getAdjustedMinutes(endStr);

    let diffMins = endMins - startMins;
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
 * * 23:59 -> 1439
 * * 00:00 -> 1440 (24h)
 * * 04:59 -> 1739 (28h 59m)
 */
export const getAdjustedMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr || "0");
  const m = parseInt(mStr || "0");

  const adjustedHour = h < 5 ? h + 24 : h;
  return (adjustedHour * 60) + m;
};

/**
 * Returns true if the given time string (HH:MM) is logically "in the past" 
 * relative to the current "Shifted Time".
 */
export const isTimeInPastShifted = (timeStr: string): boolean => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  
  const currentAdjustedHour = h < 5 ? h + 24 : h;
  const currentTotalMins = (currentAdjustedHour * 60) + m;
  const targetTotalMins = getAdjustedMinutes(timeStr);

  return targetTotalMins < currentTotalMins;
};

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// --- TIME TRAVEL DEBUGGER ---
const DEBUG_TIME = null as string | null; 

export const getNow = (): Date => {
  const now = new Date();
  if (DEBUG_TIME) {
    const [h, m] = (DEBUG_TIME as string).split(':').map(Number);
    now.setHours(h, m, 0, 0);
  }
  return now;
};

/**
 * Checks if a proposed time range overlaps with an existing range.
 * Respects Shifted Time.
 */
export const doRangesOverlap = (rangeA: string, rangeB: string): boolean => {
  const cleanRange = (r: string) => r.includes(' - ') ? r : r.replace('-', ' - ');
  const rA = cleanRange(rangeA);
  const rB = cleanRange(rangeB);

  if (!rA.includes(' - ') || !rB.includes(' - ')) return false;

  const [startA, endA] = rA.split(' - ').map(s => getAdjustedMinutes(s.trim()));
  const [startB, endB] = rB.split(' - ').map(s => getAdjustedMinutes(s.trim()));

  return Math.max(startA, startB) < Math.min(endA, endB);
};
