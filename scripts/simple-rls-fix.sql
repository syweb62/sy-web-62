-- Simple RLS Fix - Remove Infinite Recursion
-- This script removes problematic policies and creates simple ones

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop the problematic is_admin function
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create simple policies that only use auth.uid() - NO database queries
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
