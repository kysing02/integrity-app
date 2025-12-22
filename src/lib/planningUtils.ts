import { TaskItem } from '@/types/dashboard';
import { parseDurationToSeconds } from './timeUtils';

export interface PlanningMetrics {
  totalPlannedDays: number;
  totalRecordedDays: number;
  totalMissedDays: number;
  averageFocusTimeSeconds: number;
  consistencyScore: number; // 0-100
}

export const calculatePlanningMetrics = (days: any[], tasks: any[]): PlanningMetrics => {
  const totalDays = days.length;
  if (totalDays === 0) {
    return {
      totalPlannedDays: 0,
      totalRecordedDays: 0,
      totalMissedDays: 0,
      averageFocusTimeSeconds: 0,
      consistencyScore: 0
    };
  }

  const recordedDays = days.filter(d => d.status === 'completed');
  const plannedDays = days.filter(d => d.status === 'active');
  
  // A "Missed" day is an 'active' day in the past with 0 elapsed seconds on all tasks
  const now = new Date();
  const todayId = now.toISOString().split('T')[0];
  
  const missedDays = days.filter(d => {
    const isPast = d.id < todayId;
    if (!isPast || d.status === 'completed') return false;
    
    const dayTasks = tasks.filter(t => t.day_id === d.id);
    const totalElapsed = dayTasks.reduce((acc, t) => acc + (t.elapsed_seconds || 0), 0);
    return totalElapsed === 0;
  });

  const totalFocusTime = tasks.reduce((acc, t) => acc + (t.elapsed_seconds || 0), 0);
  const avgFocusTime = recordedDays.length > 0 ? totalFocusTime / recordedDays.length : 0;

  // Consistency Score: (Recorded / (Recorded + Missed)) * 100
  const denominator = recordedDays.length + missedDays.length;
  const consistencyScore = denominator > 0 ? (recordedDays.length / denominator) * 100 : 0;

  return {
    totalPlannedDays: plannedDays.length,
    totalRecordedDays: recordedDays.length,
    totalMissedDays: missedDays.length,
    averageFocusTimeSeconds: Math.floor(avgFocusTime),
    consistencyScore: Math.round(consistencyScore)
  };
};
