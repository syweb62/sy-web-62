-- Fix infinite recursion in profiles table RLS policies
-- This script removes problematic policies and creates simple, non-recursive ones

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop any functions that might cause recursion
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create simple, non-recursive RLS policies for profiles
-- These policies only use auth.uid() and don't query the profiles table

-- Allow users to view their own profile only
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile only  
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile only
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin access, we'll handle this in the application layer instead of RLS
-- This eliminates the need to query profiles table from within profiles policies

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
