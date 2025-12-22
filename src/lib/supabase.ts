import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- UPDATED HELPER: Accepts optional date ---
export const getTodayId = (userId: string, dateObj?: Date) => {
  // 1. If dateObj is provided, use it DIRECTLY (it's already adjusted by the UI)
  if (dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${userId}`;
  }

  // 2. If NO date is provided, calculate Logical Today from Now
  const target = new Date(); 
  
  // 5AM SHIFT LOGIC:
  const shifted = new Date(target);
  shifted.setHours(shifted.getHours() - 5);

  const yyyy = shifted.getFullYear();
  const mm = String(shifted.getMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}_${userId}`;
};