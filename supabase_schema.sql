-- Badminton Coach App Schema

-- 1. Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Pro')) DEFAULT 'Beginner',
  session_quota INTEGER DEFAULT 0,
  notes TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Sessions Table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, -- e.g., 'Saturday Drills', 'Tuesday Match Play'
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  max_capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Attendance Table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Attended', 'Cancelled', 'No Show')) DEFAULT 'Attended',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, student_id) -- A student can only have one attendance record per session
);

-- 4. Payments Table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT CHECK (type IN ('Quota Top-up', 'Monthly Fee', 'Other')) DEFAULT 'Quota Top-up',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a real Supabase setup, we would also enable RLS (Row Level Security) 
-- and create policies, but for this single-coach MVP, we can keep it simple.
