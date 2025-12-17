import { create } from 'zustand';

interface TaskState {
  activeTaskId: string | null;
  isTimerRunning: boolean;
  setActiveTask: (id: string | null) => void;
  toggleTimer: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  activeTaskId: null,
  isTimerRunning: false,
  setActiveTask: (id) => set({ activeTaskId: id }),
  toggleTimer: () => set((state) => ({ isTimerRunning: !state.isTimerRunning })),
}));