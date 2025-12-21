import { LucideIcon } from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  timeRange: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  category: 'EFFICIENCY' | 'CONSISTENCY';
  icon: any; // Using any for simplicity with Lucide icons in state
  isDaily?: boolean;
  elapsedSeconds: number;
  wasScheduled?: boolean; 
  originalTimeRange?: string;
}

export interface TimerEvent {
  id: string;
  taskId: string;
  action: 'START' | 'STOP';
  timestamp: number; // Unix timestamp
}

// Deprecated: Not used by any other code
// export interface DayLog {
//   date: string;
//   originalSchedule: TaskItem[]; // Snapshot taken at "Start Day"
//   events: TimerEvent[];
// }

export interface DayData {
  status: 'sleeping' | 'active' | 'completed';
  checkInTime: Date | null;
  completedAt: Date | null;
  // --- NEW FIELDS ---
  plannedCheckIn: string;
  plannedSleep: string;
}