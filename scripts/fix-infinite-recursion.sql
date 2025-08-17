-- Fix infinite recursion in profiles RLS policies
-- This script removes the problematic policies and creates simpler ones

-- Drop the problematic helper function that causes recursion
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Drop all existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create simple RLS policies that don't reference the profiles table
-- This eliminates the infinite recursion
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a separate admin access policy that uses auth metadata instead of profiles table
CREATE POLICY "Admin can access all profiles" ON public.profiles 
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Update other policies to use auth metadata instead of profiles table queries
DROP POLICY IF EXISTS "Orders are viewable by owner or admin" ON public.orders;
CREATE POLICY "Orders are viewable by owner or admin" ON public.orders 
FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    user_id IS NULL
);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders 
FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    user_id IS NULL
);

DROP POLICY IF EXISTS "Order items are viewable by order owner" ON public.order_items;
CREATE POLICY "Order items are viewable by order owner" ON public.order_items 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id 
        AND (
          orders.user_id = auth.uid() OR 
          (auth.jwt() ->> 'role') = 'admin' OR
          (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
          orders.user_id IS NULL
        )
    )
);

DROP POLICY IF EXISTS "Reservations are viewable by owner" ON public.reservations;
CREATE POLICY "Reservations are viewable by owner" ON public.reservations 
FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    user_id IS NULL
);

DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
CREATE POLICY "Users can update their own reservations" ON public.reservations 
FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    user_id IS NULL
);
