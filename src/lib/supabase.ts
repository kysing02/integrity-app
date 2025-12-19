import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- UPDATED HELPER ---
export const getTodayId = (userId: string): string => {
  const now = new Date();
  // 5 AM Rule
  if (now.getHours() < 5) {
    now.setDate(now.getDate() - 1);
  }
  
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  
  // NEW FORMAT: Combine Date + UserID
  return `${y}-${m}-${d}_${userId}`;
};