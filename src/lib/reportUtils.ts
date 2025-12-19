import { TaskItem, TimerEvent } from '@/types/dashboard';
import { parseDurationToSeconds } from '@/lib/timeUtils';

export interface TimelineSegment {
  type: 'TASK' | 'IDLE';
  title: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  originalTask?: TaskItem;
  plannedRange?: string;
  category?: 'EFFICIENCY' | 'CONSISTENCY';
  
  // NEW: For Aggregated Reporting
  isLastForTask?: boolean;
  totalTaskDuration?: number; 
}

export const generateDayReport = (
  events: TimerEvent[], 
  tasks: TaskItem[],
  checkInTime: Date | null,
  now: Date
): TimelineSegment[] => {
  if (!checkInTime || events.length === 0) return [];

  const segments: TimelineSegment[] = [];
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  // 1. Generate Chronological Segments (Existing Logic)
  let cursor = checkInTime.getTime();
  const getTask = (id: string) => tasks.find(t => t.id === id);

  for (let i = 0; i < sortedEvents.length; i++) {
    const e = sortedEvents[i];
    
    // Idle Gap
    if (e.timestamp > cursor + 60 * 1000) {
       segments.push({
         type: 'IDLE',
         title: 'Idle / Transition',
         startTime: new Date(cursor),
         endTime: new Date(e.timestamp),
         durationSeconds: (e.timestamp - cursor) / 1000
       });
    }
    cursor = Math.max(cursor, e.timestamp);

    // Task Session
    if (e.action === 'START') {
      let endTime = now.getTime();
      const nextEvent = sortedEvents[i + 1];
      if (nextEvent) {
         if (nextEvent.taskId === e.taskId && nextEvent.action === 'STOP') {
           endTime = nextEvent.timestamp;
           i++;
         } else {
           endTime = nextEvent.timestamp;
         }
      }
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

  // Final Idle
  if (now.getTime() > cursor + 60 * 1000) {
     segments.push({
       type: 'IDLE',
       title: 'Idle',
       startTime: new Date(cursor),
       endTime: now,
       durationSeconds: (now.getTime() - cursor) / 1000
     });
  }

  // Filter short noise
  const cleanSegments = segments.filter(s => s.durationSeconds >= 5);

  // --- NEW: POST-PROCESSING FOR TOTALS ---
  
  // 1. Calculate Totals & Find Last Index per Task
  const taskTotals: Record<string, number> = {};
  const lastIndexMap: Record<string, number> = {};

  cleanSegments.forEach((seg, index) => {
    if (seg.type === 'TASK' && seg.originalTask) {
      const id = seg.originalTask.id;
      // Accumulate total duration
      taskTotals[id] = (taskTotals[id] || 0) + seg.durationSeconds;
      // Mark this as the latest seen index for this task
      lastIndexMap[id] = index;
    }
  });

  // 2. Assign Data back to Segments
  return cleanSegments.map((seg, index) => {
    if (seg.type === 'TASK' && seg.originalTask) {
      const id = seg.originalTask.id;
      return {
        ...seg,
        totalTaskDuration: taskTotals[id], // Give every segment knowledge of the total (optional)
        isLastForTask: lastIndexMap[id] === index // Only TRUE for the final entry
      };
    }
    return seg;
  });
};