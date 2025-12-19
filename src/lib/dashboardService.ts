import { supabase } from './supabase';
import { TaskItem, DayData } from '@/types/dashboard';
import { 
  Brain, Users, Dumbbell, Pencil, BookOpen, Brush, Sparkles, 
  Coffee, Sun, Briefcase, Utensils, Music, ShoppingCart, Code, Tv 
} from 'lucide-react';
import { getTodayId } from './supabase';

// --- ICON MAPPER ---
const ICON_MAP: Record<string, any> = {
  'Brain': Brain, 'Users': Users, 'Dumbbell': Dumbbell, 'Pencil': Pencil,
  'BookOpen': BookOpen, 'Brush': Brush, 'Sparkles': Sparkles, 'Coffee': Coffee,
  'Sun': Sun, 'Briefcase': Briefcase, 'Utensils': Utensils, 'Music': Music,
  'ShoppingCart': ShoppingCart, 'Code': Code, 'Tv': Tv,
  'Default': Brain
};

// --- DATA MAPPERS (DB <-> App) ---

const mapTaskFromDB = (dbTask: any): TaskItem => ({
  id: dbTask.id,
  title: dbTask.title,
  timeRange: dbTask.time_range,
  score: 0, // Calculated field, default 0
  status: dbTask.status,
  category: dbTask.category,
  icon: ICON_MAP[dbTask.icon] || Brain,
  elapsedSeconds: dbTask.elapsed_seconds,
  isDaily: dbTask.is_daily
});

// --- 1. USE A FAKE GUEST ID ---
// A valid UUID so the database doesn't complain

const GUEST_ID = '00000000-0000-0000-0000-000000000000';

// --- API FUNCTIONS ---

export const getUserId = async () => {
  // SKIP AUTH CHECK for now
  // const { data } = await supabase.auth.getUser();
  // return data.user?.id;
  
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
    .maybeSingle(); // <--- CHANGED FROM .single()

  if (error) console.error("Error fetching day:", error);
  if (!day) return null; // Cleanly returns null, no 406 error

  // 2. Get Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('day_id', dateId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  // 3. Get Timer Logs (for Report)
  const { data: logs } = await supabase
    .from('timer_logs')
    .select('*')
    .gte('recorded_at', `${dateOnly}T00:00:00`)
    .lte('recorded_at', `${dateOnly}T23:59:59`)
    .eq('user_id', userId);

  // Transform for App
  const appTasks = (tasks || []).map(mapTaskFromDB);

  return {
    status: day.status,
    checkInTime: day.check_in_time ? new Date(day.check_in_time) : null,
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

export const apiStartDay = async () => {
  const userId = await getUserId();
  // Generate the new unique ID
  const dateId = getTodayId(userId); 

  await supabase.from('days').insert({
    id: dateId,
    user_id: userId,
    status: 'active',
    check_in_time: new Date().toISOString()
  });
};

export const apiEndDay = async () => {
  const userId = await getUserId();
  const dateId = getTodayId(userId);

  await supabase.from('days').update({
    status: 'completed',
    completed_at: new Date().toISOString()
  }).eq('id', dateId);
};

// --- 2. UPDATE CREATE TASK ---
// We need to be careful with the icon mapping logic we discussed before
export const apiCreateTask = async (task: TaskItem) => {
  const userId = await getUserId();
  const dateId = getTodayId(userId);
  
  // MAP ICON FUNCTION TO STRING NAME
  // This prevents the "object" error you saw earlier
  let iconName = 'Brain'; // Default
  
  // We need to match the function back to a string name
  // Note: This requires you to import the ICON_MAP or recreate it here.
  // For safety, let's just default to 'Brain' if you haven't set up the map export yet.
  // Ideally, move ICON_MAP to a shared file or export it here.
  
  // Simple check if you passed a string (from localstorage fix) or function
  if (typeof task.icon === 'string') iconName = task.icon;

  const { error } = await supabase.from('tasks').insert({
    id: task.id,
    day_id: dateId,
    user_id: userId,
    title: task.title,
    icon: iconName, // Sending String
    category: task.category,
    time_range: task.timeRange,
    is_daily: task.isDaily || false,
    status: 'pending',
    elapsed_seconds: 0
  });

  if (error) console.error("Supabase Create Error:", error);
};

export const apiUpdateTaskStatus = async (taskId: string, status: string) => {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('tasks').update({ status }).eq('id', taskId).eq('user_id', userId);
};

export const apiUpdateTaskProgress = async (taskId: string, seconds: number) => {
  const userId = await getUserId();
  if (!userId) return;
  // We don't await this (fire and forget) to keep UI snappy
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