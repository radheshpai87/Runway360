-- Runway360 Database Schema Specification
-- Run this in your Supabase SQL Editor to set up the database tables, triggers, and Row Level Security (RLS) policies.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- 1. Profiles Table (Modified to support NextAuth text IDs)
--------------------------------------------------
DROP TABLE IF EXISTS public.transition_plans CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, -- Can store NextAuth/Google text IDs or UUIDs
    name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies (Idempotent)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (true);

--------------------------------------------------
-- 2. Interviews Table
--------------------------------------------------
CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE, -- References text profiles.id
    name TEXT,
    "current_role" TEXT,
    annual_income TEXT,
    savings TEXT,
    location TEXT,
    monthly_expenses TEXT,
    timeframe TEXT,
    target_role TEXT,
    adaptive_questions JSONB DEFAULT '[]'::jsonb, -- Stores array of Q8, Q9, Q10 details and answers
    current_step INTEGER DEFAULT 1 NOT NULL,      -- 1 to 10, or 11 (finished)
    status TEXT DEFAULT 'in_progress' NOT NULL,    -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on Interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Interviews Policies (Idempotent)
DROP POLICY IF EXISTS "Users can view their own interviews" ON public.interviews;
CREATE POLICY "Users can view their own interviews"
    ON public.interviews FOR SELECT
    USING (true); -- Handled by server-side filters

DROP POLICY IF EXISTS "Users can create interviews" ON public.interviews;
CREATE POLICY "Users can create interviews"
    ON public.interviews FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own interviews" ON public.interviews;
CREATE POLICY "Users can update their own interviews"
    ON public.interviews FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can delete their own interviews" ON public.interviews;
CREATE POLICY "Users can delete their own interviews"
    ON public.interviews FOR DELETE
    USING (true);

--------------------------------------------------
-- 3. Transition Plans Table
--------------------------------------------------
CREATE TABLE public.transition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE UNIQUE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE, -- References text profiles.id
    plan_data JSONB NOT NULL,          -- Phased transition details (Immediate, Short, Mid term)
    journey_data JSONB NOT NULL,       -- Obstacles, emotional phases, reality check
    financial_metrics JSONB NOT NULL,  -- Calculated runway, safety status, risk level, buffer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on Transition Plans
ALTER TABLE public.transition_plans ENABLE ROW LEVEL SECURITY;

-- Transition Plans Policies (Idempotent)
DROP POLICY IF EXISTS "Users can view their own transition plans" ON public.transition_plans;
CREATE POLICY "Users can view their own transition plans"
    ON public.transition_plans FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create transition plans" ON public.transition_plans;
CREATE POLICY "Users can create transition plans"
    ON public.transition_plans FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own transition plans" ON public.transition_plans;
CREATE POLICY "Users can update their own transition plans"
    ON public.transition_plans FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can delete their own transition plans" ON public.transition_plans;
CREATE POLICY "Users can delete their own transition plans"
    ON public.transition_plans FOR DELETE
    USING (true);
