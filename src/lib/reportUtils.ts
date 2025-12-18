import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

interface TimelineSegment {
  type: 'TASK' | 'IDLE';
  title: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  originalTask?: TaskItem;
  plannedRange?: string;
  category?: 'EFFICIENCY' | 'CONSISTENCY';
}

export const generateDayReport = (
  events: TimerEvent[], 
  tasks: TaskItem[],
  checkInTime: Date | null,
  now: Date // This MUST be the same "Now" reference used for logging (Debug Time)
): TimelineSegment[] => {
  if (!checkInTime || events.length === 0) return [];

  const segments: TimelineSegment[] = [];
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  // 1. Start cursor at Check-in
  let cursor = checkInTime.getTime();
  const getTask = (id: string) => tasks.find(t => t.id === id);

  for (let i = 0; i < sortedEvents.length; i++) {
    const e = sortedEvents[i];
    
    // A. IDLE GAP DETECTION
    // If the next event starts > 60s after the cursor, mark as Idle
    // Safe Math: Ensure we don't calculate idle if event is somehow before cursor
    if (e.timestamp > cursor + 60 * 1000) {
       segments.push({
         type: 'IDLE',
         title: 'Idle / Transition',
         startTime: new Date(cursor),
         endTime: new Date(e.timestamp),
         durationSeconds: (e.timestamp - cursor) / 1000
       });
    }
    
    // Move cursor to event start (or keep it if event was in past, though sort prevents this)
    cursor = Math.max(cursor, e.timestamp);

    // B. TASK SESSION
    if (e.action === 'START') {
      let endTime = now.getTime(); // Default end is "Now"
      
      // Look ahead for the STOP event or next START
      const nextEvent = sortedEvents[i + 1];
      if (nextEvent) {
         // If next event is the STOP for this task, use its time
         if (nextEvent.taskId === e.taskId && nextEvent.action === 'STOP') {
           endTime = nextEvent.timestamp;
           i++; // Skip the STOP event in next loop iteration
         } else {
           // Implicit switch: Next event is a START for something else
           endTime = nextEvent.timestamp;
         }
      }

      // Safety: End Time cannot be before Start Time
      endTime = Math.max(endTime, e.timestamp);

      const task = getTask(e.taskId);
      if (task) {
        segments.push({
          type: 'TASK',
          title: task.title,
          startTime: new Date(e.timestamp),
          endTime: new Date(endTime),
          durationSeconds: (endTime - e.timestamp) / 1000,
          originalTask: task,
          plannedRange: task.timeRange,
          category: task.category
        });
      }
      cursor = endTime;
    }
  }

  // C. FINAL IDLE (From last event until Now)
  if (now.getTime() > cursor + 60 * 1000) {
     segments.push({
       type: 'IDLE',
       title: 'Idle',
       startTime: new Date(cursor),
       endTime: now,
       durationSeconds: (now.getTime() - cursor) / 1000
     });
  }

  // FILTER: Hide any segments shorter than 1 minute (60 seconds)
  // This cleans up "0min" logs caused by accidental clicks
  // FIX: Lower threshold to 5 seconds for easier testing
  return segments.filter(s => s.durationSeconds >= 5);
};