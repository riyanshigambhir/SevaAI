-- ============================================================
-- SevaAI — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable PostGIS for geospatial queries
create extension if not exists postgis;

-- ────────────────────────────────────────
-- TABLE 1: users
-- Stores both citizens and officers
-- ────────────────────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  role text not null check (role in ('citizen', 'officer', 'dept_head', 'admin')),
  ward text,
  city text default 'Pilani',
  department text,          -- only for officers
  language text default 'en',
  seva_score integer default 0,  -- only for citizens
  created_at timestamptz default now()
);

-- ────────────────────────────────────────
-- TABLE 2: complaints
-- The master record for every complaint
-- ────────────────────────────────────────
create table complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null,   -- e.g. SEVA-2024-08421
  citizen_id uuid references users(id),
  officer_id uuid references users(id),

  -- What the citizen said (raw)
  raw_input text not null,
  language text default 'en',

  -- What Claude extracted (structured)
  category text,              -- "Street Lighting"
  department text,            -- "Municipal Electrical Dept"
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  sla_days integer,           -- auto-set from priority

  -- Where it is
  latitude float,
  longitude float,
  address text,
  ward text,

  -- Current state
  status text default 'filed' check (
    status in ('filed','assigned','in_progress','resolved','closed','escalated')
  ),
  photo_url text,

  -- Timestamps
  sla_deadline timestamptz,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ────────────────────────────────────────
-- TABLE 3: messages
-- Every chat message in a complaint thread
-- ────────────────────────────────────────
create table messages (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  sender_type text check (sender_type in ('citizen', 'agent', 'officer')),
  content text not null,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────
-- TABLE 4: validations
-- Neighbour votes on a complaint
-- ────────────────────────────────────────
create table validations (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  citizen_id uuid references users(id),
  vote text check (vote in ('confirmed', 'denied', 'already_fixed')),
  created_at timestamptz default now(),
  unique(complaint_id, citizen_id)   -- one vote per person per complaint
);

-- ────────────────────────────────────────
-- TABLE 5: escalations
-- Log every escalation event
-- ────────────────────────────────────────
create table escalations (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  reason text,
  escalated_to text,          -- "dept_head" or "senior_officer"
  triggered_by text,          -- "auto" or "citizen"
  created_at timestamptz default now()
);

-- ────────────────────────────────────────
-- Enable Realtime on messages table
-- (so citizen sees officer updates instantly)
-- ────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table complaints;

-- ────────────────────────────────────────
-- SEED DATA: Demo users
-- ────────────────────────────────────────
insert into users (email, name, phone, role, ward, department, language) values
  ('priya@demo.com',  'Priya Sharma',   '+91-9876543210', 'citizen', 'Ward 7', null, 'en'),
  ('rajan@demo.com',  'Rajan Sharma',   '+91-9876543211', 'officer',  'Ward 7', 'Municipal Electrical Dept', 'en'),
  ('admin@demo.com',  'Admin User',     '+91-9876543212', 'admin',    null, null, 'en');

-- ────────────────────────────────────────
-- SEED DATA: Sample complaints
-- ────────────────────────────────────────
insert into complaints (
  ticket_id, citizen_id, category, department, priority, sla_days,
  raw_input, address, ward, status, sla_deadline, created_at
) values (
  'SEVA-2024-08421',
  (select id from users where email = 'priya@demo.com'),
  'Street Lighting',
  'Municipal Electrical Dept',
  'medium',
  5,
  'Streetlight outside BITS Pilani main gate hasn''t worked for 2 weeks',
  'BITS Pilani Main Gate, Pilani, Rajasthan',
  'Ward 7',
  'assigned',
  now() + interval '2 days',
  now() - interval '3 days'
),(
  'SEVA-2024-08390',
  (select id from users where email = 'priya@demo.com'),
  'Road - Pothole',
  'Public Works Dept',
  'medium',
  5,
  'Large pothole near Delhi Gate causing accidents',
  'Delhi Gate, Pilani, Rajasthan',
  'Ward 7',
  'resolved',
  now() - interval '1 day',
  now() - interval '7 days'
);

-- Seed messages for first complaint
insert into messages (complaint_id, sender_type, content, created_at) values
(
  (select id from complaints where ticket_id = 'SEVA-2024-08421'),
  'agent',
  'Your complaint has been filed. Ticket: SEVA-2024-08421. Category: Street Lighting. Location: BITS Pilani Main Gate. Department: Municipal Electrical Dept. Priority: MEDIUM. SLA: 5 days. You can ask me anything about this complaint.',
  now() - interval '3 days'
),(
  (select id from complaints where ticket_id = 'SEVA-2024-08421'),
  'agent',
  'Update: Your complaint has been assigned to Officer Rajan Sharma. Work has been scheduled for tomorrow.',
  now() - interval '1 day'
);
