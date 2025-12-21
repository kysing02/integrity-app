-- ==========================================
-- INTEGRITY APP SCHEMA (Consolidated)
-- ==========================================

-- 1. CLEANUP (Optional - Uncomment if you want to wipe and reset)
-- drop table if exists timer_logs;
-- drop table if exists tasks;
-- drop table if exists days;

-- 2. CREATE DAYS TABLE
create table days (
  id text primary key, -- Format: "YYYY-MM-DD_USERID"
  user_id uuid not null,
  status text check (status in ('active', 'completed')) default 'active',
  
  -- Time Configuration
  check_in_time timestamptz, -- Actual start time (execution)
  completed_at timestamptz,  -- Actual end time (execution)
  planned_check_in text default '07:00', -- Target start time
  planned_sleep text default '23:00',    -- Target end time
  
  created_at timestamptz default now()
);

-- 3. CREATE TASKS TABLE
create table tasks (
  id uuid primary key default gen_random_uuid(),
  day_id text references days(id) on delete cascade not null, -- Links to "YYYY-MM-DD_USERID"
  user_id uuid not null,
  
  -- Core Data
  title text not null,
  icon text not null, -- Stores string name (e.g., 'Brain', 'Coffee')
  category text check (category in ('CONSISTENCY', 'EFFICIENCY')) not null,
  time_range text, -- e.g. "07:00 - 08:00"
  is_daily boolean default false,
  
  -- State & Timer Logic
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  elapsed_seconds integer default 0,
  last_started_at timestamptz, -- Used for client-side timer recovery on refresh
  
  created_at timestamptz default now()
);

-- 4. CREATE LOGS TABLE
create table timer_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid not null,
  action text check (action in ('START', 'STOP')) not null,
  recorded_at timestamptz default now()
);

-- 5. DISABLE RLS PERMANENTLY (For Development)
-- Allows Guest ID ('0000...') to read/write without auth policies
alter table days disable row level security;
alter table tasks disable row level security;
alter table timer_logs disable row level security;