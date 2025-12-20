import { 
  Brain, Users, Dumbbell, Pencil, BookOpen, Brush, Sparkles, 
  Coffee, Sun, Moon, Briefcase, Utensils, Music, ShoppingCart, 
  Code, Tv, Calendar, Check, X, Plus, Clock, Edit3, LogOut,
  Play, History, CalendarCheck, HelpCircle
} from 'lucide-react';

// 1. The Registry
// Add any new icon you use here.
export const ICON_MAP: Record<string, any> = {
  'Brain': Brain,
  'Users': Users,
  'Dumbbell': Dumbbell,
  'Pencil': Pencil,
  'BookOpen': BookOpen,
  'Brush': Brush,
  'Sparkles': Sparkles,
  'Coffee': Coffee,
  'Sun': Sun,
  'Moon': Moon,
  'Briefcase': Briefcase,
  'Utensils': Utensils,
  'Music': Music,
  'ShoppingCart': ShoppingCart,
  'Code': Code,
  'Tv': Tv,
  'Calendar': Calendar,
  // Fallbacks / UI Icons (Optional, but good for safety)
  'Check': Check,
  'Plus': Plus,
  'Clock': Clock
};

// 2. Helper: String -> Component (For Loading from DB)
export const getIconComponent = (iconName: string | null) => {
  if (!iconName) return Brain; // Default
  return ICON_MAP[iconName] || HelpCircle; // Fallback
};

// 3. Helper: Component -> String (For Saving to DB)
export const getIconName = (IconComponent: any) => {
  // Loop through map to find match
  for (const [name, component] of Object.entries(ICON_MAP)) {
    if (component === IconComponent) return name;
  }
  return 'Brain'; // Default
};