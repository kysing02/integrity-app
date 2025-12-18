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
}