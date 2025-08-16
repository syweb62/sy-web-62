-- Enhanced admin role management setup
-- Add role column if it doesn't exist and set up proper admin roles

-- Update profiles table to ensure role column exists with proper constraints
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'manager', 'admin'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing admin user role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@sushiyaki.com';

-- Create admin role management policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can update user roles" ON public.profiles;
CREATE POLICY "Admins can update user roles" ON public.profiles 
FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin();

-- Create function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
