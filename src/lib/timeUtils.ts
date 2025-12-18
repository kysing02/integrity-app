export const parseDurationToSeconds = (timeStr: string): number => {
  // Case 1: "09:00 - 11:30" (Schedule Range)
  if (timeStr.includes(' - ')) {
    const [start, end] = timeStr.split(' - ');
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return ((eH * 60 + eM) - (sH * 60 + sM)) * 60;
  }
  // Case 2: "1h 30m" or "45m" (Daily Duration)
  let total = 0;
  const hours = timeStr.match(/(\d+)h/);
  const minutes = timeStr.match(/(\d+)m/);
  if (hours) total += parseInt(hours[1]) * 3600;
  if (minutes) total += parseInt(minutes[1]) * 60;
  return total > 0 ? total : 0;
};

export const getTodayDateAtTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getTaskRemainingSeconds = (task: any, now: Date): number => {
  // Case 1: Daily Action (Simple duration subtraction)
  if (task.isDaily) {
    if (task.status === 'completed') return 0;
    const totalSeconds = parseDurationToSeconds(task.timeRange);
    return Math.max(0, totalSeconds - task.elapsedSeconds);
  }

  // Case 2: Scheduled Task (Time Block logic)
  if (task.status === 'completed') return 0; // Completed tasks release their time
  
  if (task.timeRange.includes(' - ')) {
    const [startStr, endStr] = task.timeRange.split(' - ');
    const end = getTodayDateAtTime(endStr);
    
    // If the task is in the past, it consumes 0 FUTURE time
    if (now >= end) return 0;

    // If we are currently IN the task, or it's in the future
    // The "Load" is the time from NOW (or Start) until End
    const start = getTodayDateAtTime(startStr);
    const effectiveStart = now > start ? now : start;
    
    return Math.max(0, (end.getTime() - effectiveStart.getTime()) / 1000);
  }
  
  return 0;
};