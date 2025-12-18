import { TaskItem } from "@/types/dashboard";

// --- Helper: Get Date Object for Today at specific time ---
// NEW HELPER needed for the math
export const getTodayDateAtTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(/[:h]/).map(str => parseInt(str) || 0);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// --- Helper: Calculate Future Work Load ---
// NEW HELPER to sum up only the work that hasn't happened yet
export const getTaskRemainingSeconds = (task: TaskItem, now: Date): number => {
  // Completed tasks consume 0 future capacity
  if (task.status === 'completed') return 0;

  // 1. Daily Actions (Simple Duration - Elapsed)
  if (task.isDaily) {
    const totalSeconds = parseDurationToSeconds(task.timeRange);
    return Math.max(0, totalSeconds - task.elapsedSeconds);
  }

  // 2. Scheduled Tasks (Time Block - Time already passed)
  if (task.timeRange.includes(' - ')) {
    const [startStr, endStr] = task.timeRange.split(' - ');
    const end = getTodayDateAtTime(endStr);
    
    // If task is already over, it consumes 0 future capacity
    if (now >= end) return 0;

    // We only count the time from NOW (or Start) until End
    const start = getTodayDateAtTime(startStr);
    const effectiveStart = now > start ? now : start;
    
    return Math.max(0, (end.getTime() - effectiveStart.getTime()) / 1000);
  }
  
  return 0;
};

// --- Helper: Parse Time Strings ---
export const parseDurationToSeconds = (timeStr: string): number => {
  // ... (Your existing parseDurationToSeconds logic) ...
  // (Keep this exactly as you had it)
  if (timeStr.includes(' - ')) {
    const [start, end] = timeStr.split(' - ');
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return ((eH * 60 + eM) - (sH * 60 + sM)) * 60;
  }
  let total = 0;
  const hours = timeStr.match(/(\d+)h/);
  const minutes = timeStr.match(/(\d+)m/);
  if (hours) total += parseInt(hours[1]) * 3600;
  if (minutes) total += parseInt(minutes[1]) * 60;
  return total > 0 ? total : 0;
};