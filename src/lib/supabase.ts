import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- UPDATED HELPER: Accepts optional date ---
export const getTodayId = (userId: string, specificDate?: Date): string => {
  // Use specific date if provided, otherwise use Now
  const targetDate = specificDate ? new Date(specificDate) : new Date();
  
  // 5 AM Rule (Only apply if we are using "Now", or we can assume specificDate is already normalized)
  // Strategy: If specificDate is passed, we assume the caller has already decided "Which Logical Day" it is.
  // But for safety, if no date passed, we apply the 5AM shift.
  if (!specificDate && targetDate.getHours() < 5) {
    targetDate.setDate(targetDate.getDate() - 1);
  }
  
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}_${userId}`;
};