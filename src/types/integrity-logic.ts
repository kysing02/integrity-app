export type TaskCategory = 'EFFICIENCY' | 'CONSISTENCY';
export type TaskStatus = 'SCHEDULED' | 'UNSCHEDULED';

interface Task {
  category: TaskCategory;
  status: TaskStatus;
  priority: number; // 1.0, 1.5, 2.0
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  isCompleted: boolean;
}

export const calculateTaskScore = (task: Task): number => {
  const pStart = task.plannedStart.getTime();
  const pEnd = task.plannedEnd.getTime();
  const pDuration = pEnd - pStart;

  // 1. UNSCHEDULED TASK LOGIC
  if (task.status === 'UNSCHEDULED') {
    if (!task.actualStart || !task.actualEnd) return 0;
    const aDuration = task.actualEnd.getTime() - task.actualStart.getTime();
    
    if (task.category === 'EFFICIENCY') {
      return task.isCompleted ? 1.0 : Math.min(0.9, aDuration / pDuration);
    } else {
      return Math.min(1.0, aDuration / pDuration);
    }
  }

  // 2. SCHEDULED TASK LOGIC (Intersection Model)
  if (!task.actualStart || !task.actualEnd) return 0;
  const aStart = task.actualStart.getTime();
  const aEnd = task.actualEnd.getTime();

  // Calculate Overlap (The "Intersection")
  const overlapStart = Math.max(pStart, aStart);
  const overlapEnd = Math.min(pEnd, aEnd);
  const intersection = Math.max(0, overlapEnd - overlapStart);

  let score = intersection / pDuration;

  // Handle Efficiency Completion Early
  if (task.category === 'EFFICIENCY' && task.isCompleted && aEnd <= pEnd) {
    score = 1.0; // Refunded time
  }

  return Math.min(1.0, score);
};

export const calculateDailyResponsibilityScore = (tasks: Task[]): number => {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  tasks.forEach(task => {
    const durationMins = (task.plannedEnd.getTime() - task.plannedStart.getTime()) / 60000;
    const weight = durationMins * task.priority;
    const score = calculateTaskScore(task);

    totalWeightedScore += (score * weight);
    totalWeight += weight;
  });

  return totalWeight === 0 ? 0 : (totalWeightedScore / totalWeight) * 100;
};