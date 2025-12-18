import { TaskItem } from '@/types/dashboard';

export const getTodayDateAtTime = (timeStr: string): Date => {
  // FIX: Safety check for undefined/empty strings
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

export const parseDurationToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;

  // Handle Range: "17:30 - 18:00"
  if (timeStr.includes('-')) {
    const parts = timeStr.split('-');
    const start = parts[0].trim();
    const end = parts[1] ? parts[1].trim() : start;

    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    
    // Calculate difference in minutes
    let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
    
    // Handle overnight (e.g. 23:00 - 01:00)
    if (diffMins < 0) diffMins += 24 * 60;
    
    return diffMins * 60;
  }
  
  // Handle Duration: "1h 30m"
  let total = 0;
  const hours = timeStr.match(/(\d+)h/);
  const minutes = timeStr.match(/(\d+)m/);
  if (hours) total += parseInt(hours[1]) * 3600;
  if (minutes) total += parseInt(minutes[1]) * 60;
  
  // Fallback for just number "30" -> assumed minutes
  if (!hours && !minutes && !isNaN(Number(timeStr))) {
      return parseInt(timeStr) * 60;
  }
  
  return total > 0 ? total : 0;
};