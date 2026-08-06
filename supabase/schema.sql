-- Runway360 Database Schema Specification
-- Run this in your Supabase SQL Editor to set up the database tables, triggers, and Row Level Security (RLS) policies.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- 1. Profiles Table (Linked to auth.users)
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Automatically create a profile when a new user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------
-- 2. Interviews Table
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Interviews Policies
CREATE POLICY "Users can view their own interviews"
    ON public.interviews FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL); -- Allow anonymous interviews or owner view

CREATE POLICY "Users can create interviews"
    ON public.interviews FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own interviews"
    ON public.interviews FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own interviews"
    ON public.interviews FOR DELETE
    USING (auth.uid() = user_id);

--------------------------------------------------
-- 3. Transition Plans Table
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL,          -- Phased transition details (Immediate, Short, Mid term)
    journey_data JSONB NOT NULL,       -- Obstacles, emotional phases, reality check
    financial_metrics JSONB NOT NULL,  -- Calculated runway, safety status, risk level, buffer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on Transition Plans
ALTER TABLE public.transition_plans ENABLE ROW LEVEL SECURITY;

-- Transition Plans Policies
CREATE POLICY "Users can view their own transition plans"
    ON public.transition_plans FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create transition plans"
    ON public.transition_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own transition plans"
    ON public.transition_plans FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own transition plans"
    ON public.transition_plans FOR DELETE
    USING (auth.uid() = user_id);
