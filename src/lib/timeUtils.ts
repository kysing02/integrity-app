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