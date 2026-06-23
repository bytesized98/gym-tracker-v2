-- Lift Log database schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- (or via `supabase db push` if using the CLI)

-- ── WORKOUTS ──────────────────────────────────────────────────────────────────
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── EXERCISES ─────────────────────────────────────────────────────────────────
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  name text not null,
  optional boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── ENTRIES ───────────────────────────────────────────────────────────────────
-- One row per exercise per calendar date. Re-saving the same date updates it
-- (handled via upsert on the unique constraint below), matching the old
-- localStorage "one entry per day" behavior.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  date date not null,
  weight numeric not null,
  reps int not null,
  sets int not null,
  created_at timestamptz not null default now(),
  unique (exercise_id, date)
);

create index if not exists idx_exercises_workout on exercises(workout_id);
create index if not exists idx_entries_exercise on entries(exercise_id);
create index if not exists idx_entries_date on entries(date);
create index if not exists idx_workouts_user on workouts(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- Every table is locked to the authenticated user who owns the workout.
-- exercises/entries don't store user_id directly — they inherit ownership
-- by joining up to workouts.user_id.

alter table workouts enable row level security;
alter table exercises enable row level security;
alter table entries enable row level security;

create policy "Users can manage their own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage exercises in their own workouts"
  on exercises for all
  using (
    exists (select 1 from workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  );

create policy "Users can manage entries in their own exercises"
  on entries for all
  using (
    exists (
      select 1 from exercises e
      join workouts w on w.id = e.workout_id
      where e.id = entries.exercise_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from exercises e
      join workouts w on w.id = e.workout_id
      where e.id = entries.exercise_id and w.user_id = auth.uid()
    )
  );

-- ── SEED DEFAULT WORKOUTS FOR A NEW USER (optional helper) ───────────────────
-- Call this manually once after first sign-up, or wire it into a Supabase
-- Function trigger on auth.users insert if you want it automatic.
-- Replace :user_id with your actual auth.users id (Supabase Dashboard -> Authentication).

-- insert into workouts (user_id, name, sort_order) values
--   (:user_id, 'Quads', 0),
--   (:user_id, 'Pull Day', 1),
--   (:user_id, 'Glutes+Hamstrings', 2),
--   (:user_id, 'Push Day', 3);
