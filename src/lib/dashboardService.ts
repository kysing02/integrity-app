import { supabase } from './supabase';
import { TaskItem } from '@/types/dashboard';
import { getTodayId } from './supabase';
import { getIconComponent, getIconName } from './iconMap'; // Helper still needed for conversion

// --- DATA MAPPERS (DB <-> App) ---

const mapTaskFromDB = (dbTask: any): TaskItem => {
  let adjustedSeconds = dbTask.elapsed_seconds;

  // IF TASK IS RUNNING: Add the time passed since it started
  if (dbTask.status === 'in_progress' && dbTask.last_started_at) {
    const now = new Date().getTime();
    const start = new Date(dbTask.last_started_at).getTime();
    const diff = Math.floor((now - start) / 1000); // Difference in seconds
    adjustedSeconds += diff;
  }

  return {
    id: dbTask.id,
    title: dbTask.title,
    timeRange: dbTask.time_range,
    score: 0,
    status: dbTask.status,
    category: dbTask.category,
    icon: getIconComponent(dbTask.icon),
    elapsedSeconds: adjustedSeconds, // <--- USE CALCULATED VALUE
    isDaily: dbTask.is_daily
  };
};

// --- CONSTANTS ---
const GUEST_ID = '00000000-0000-0000-0000-000000000000';

// --- API FUNCTIONS ---

export const getUserId = async () => {
  return GUEST_ID;
};

export const fetchDayData = async (dateId: string) => {
  const userId = await getUserId();
  if (!userId) return null;
  const dateOnly = dateId.split('_')[0];

  // 1. Get Day Status
  const { data: day, error } = await supabase
    .from('days')
    .select('*')
    .eq('id', dateId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error("Error fetching day:", error);
  if (!day) return null;

  // 2. Get Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('day_id', dateId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  // 3. Get Timer Logs
  const { data: logs } = await supabase
    .from('timer_logs')
    .select('*')
    .gte('recorded_at', `${dateOnly}T00:00:00`)
    .lte('recorded_at', `${dateOnly}T23:59:59`)
    .eq('user_id', userId);

  const appTasks = (tasks || []).map(mapTaskFromDB);

  return {
    status: day.status,
    checkInTime: day.check_in_time ? new Date(day.check_in_time) : null,
    completedAt: day.completed_at ? new Date(day.completed_at) : null,
    // --- READ CONFIG ---
    plannedCheckIn: day?.planned_check_in || "07:00",
    plannedSleep: day?.planned_sleep || "23:00",

    scheduleTasks: appTasks.filter(t => !t.isDaily),
    dailyActions: appTasks.filter(t => t.isDaily),
    timerEvents: (logs || []).map(l => ({
       id: l.id,
       taskId: l.task_id,
       action: l.action,
       timestamp: new Date(l.recorded_at).getTime()
    }))
  };
};

export const apiUpdateDayConfig = async (dayId: string, plannedCheckIn: string, plannedSleep: string) => {
    const userId = await getUserId();
    await supabase.from('days').update({ 
        planned_check_in: plannedCheckIn, 
        planned_sleep: plannedSleep 
    }).eq('id', dayId).eq('user_id', userId);
};

export const apiStartDay = async (specificDateId?: string, checkInTime?: string | null) => {
  const userId = await getUserId();
  const dateId = specificDateId || getTodayId(userId); 
  
  // UPSERT LOGIC:
  // 1. Try to selecting the day first
  const { data: existing } = await supabase.from('days').select('id').eq('id', dateId).maybeSingle();

  if (existing) {
    // A. If it exists (e.g. was planned), just UPDATE the status/time
    // Only update check_in_time if we are actually checking in (not null)
    const updates: any = { status: 'active' };
    if (checkInTime) {
        updates.check_in_time = checkInTime;
    }
    await supabase.from('days').update(updates).eq('id', dateId);

  } else {
    // B. If new, INSERT it
    await supabase.from('days').insert({
      id: dateId,
      user_id: userId,
      status: 'active',
      check_in_time: checkInTime
    });
  }
};

export const apiEndDay = async (specificDayId?: string, overrideCompletedAt?: string) => {
  const userId = await getUserId();
  
  // Extra Safety: Ensure we don't pass an Event object as an ID
  const dayId = typeof specificDayId === 'string' ? specificDayId : undefined;
  const timestamp = typeof overrideCompletedAt === 'string' ? overrideCompletedAt : new Date().toISOString();

  if (dayId) {
      await supabase
        .from('days')
        .update({ status: 'completed', completed_at: timestamp })
        .eq('id', dayId)
        .eq('user_id', userId);
  } else {
      // Fallback: Close whatever is active
      await supabase
        .from('days')
        .update({ status: 'completed', completed_at: timestamp })
        .eq('status', 'active')
        .eq('user_id', userId);
  }
};

// 2. UPDATE START LOGIC (New Helper)
export const apiStartTask = async (taskId: string) => {
  const userId = await getUserId();
  
  // Set Status AND Timestamp
  await supabase
    .from('tasks')
    .update({ 
      status: 'in_progress', 
      last_started_at: new Date().toISOString() 
    })
    .eq('id', taskId)
    .eq('user_id', userId);
    
  await apiLogTimer(taskId, 'START');
};

// 3. UPDATE STOP LOGIC (New Helper)
export const apiStopTask = async (taskId: string, totalSeconds: number) => {
  const userId = await getUserId();

  // Update Progress, Set Status to Pending, CLEAR Timestamp
  await supabase
    .from('tasks')
    .update({ 
      status: 'pending', 
      elapsed_seconds: totalSeconds,
      last_started_at: null 
    })
    .eq('id', taskId)
    .eq('user_id', userId);

  await apiLogTimer(taskId, 'STOP');
};


export const apiCreateTask = async (task: TaskItem, specificDayId?: string) => {
  const userId = await getUserId();
  
  // Use the passed dayId if available, fallback to today's calculation
  const dateId = specificDayId || getTodayId(userId); 
  
  // Convert Component -> String
  const iconName = getIconName(task.icon);

  const { error } = await supabase.from('tasks').insert({
    id: task.id,
    day_id: dateId,
    user_id: userId,
    title: task.title,
    // 2. FIX INSERT: Use 'icon' column
    icon: iconName, 
    category: task.category,
    time_range: task.timeRange,
    is_daily: task.isDaily || false,
    status: 'pending',
    elapsed_seconds: 0
  });

  if (error) console.error("Supabase Create Error:", error);
};

export const apiUpdateTask = async (taskId: string, updates: Partial<TaskItem>) => {
  const userId = await getUserId();
  if (!userId) return;

  const dbUpdates: any = {};
  if (updates.title) dbUpdates.title = updates.title;
  if (updates.timeRange) dbUpdates.time_range = updates.timeRange;
  if (updates.category) dbUpdates.category = updates.category;
  
  // 3. FIX UPDATE: Handle Component -> String conversion for 'icon' column
  if (updates.icon) {
    dbUpdates.icon = getIconName(updates.icon);
  }

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId).eq('user_id', userId);
  if (error) console.error("Supabase Update Error:", error);
};

export const apiUpdateTaskStatus = async (taskId: string, status: string) => {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('tasks').update({ status }).eq('id', taskId).eq('user_id', userId);
};

export const apiUpdateTaskProgress = async (taskId: string, seconds: number) => {
  const userId = await getUserId();
  if (!userId) return;
  supabase.from('tasks').update({ elapsed_seconds: seconds }).eq('id', taskId).eq('user_id', userId).then();
};

export const apiLogTimer = async (taskId: string, action: 'START' | 'STOP') => {
  const userId = await getUserId();
  if (!userId) return;
  
  await supabase.from('timer_logs').insert({
    task_id: taskId,
    action: action,
    user_id: userId,
    recorded_at: new Date().toISOString()
  });
};

export const apiDeleteTask = async (taskId: string) => {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
};

export const apiGetGlobalActiveTask = async (): Promise<TaskItem | null> => {
  const userId = await getUserId();
  
  // Find any task where status is 'in_progress'
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (error) console.error("Error fetching global active task:", error);
  if (!data) return null;

  return mapTaskFromDB(data);
};

// --- CALENDAR & ANALYTICS ---

export const fetchCalendarData = async (startMonth: string, endMonth: string) => {
  const userId = await getUserId();
  
  // 1. Fetch all days in range
  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('*')
    .eq('user_id', userId)
    .gte('id', startMonth)
    .lte('id', endMonth);

  if (daysError) console.error("Error fetching calendar days:", daysError);

  // 2. Fetch all tasks in range to determine "Planning Health"
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('day_id, status, elapsed_seconds, time_range')
    .eq('user_id', userId)
    .gte('day_id', startMonth)
    .lte('day_id', endMonth);

  if (tasksError) console.error("Error fetching calendar tasks:", tasksError);

  return {
    days: days || [],
    tasks: tasks || []
  };
};
