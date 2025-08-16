-- Safe Supabase Database Setup - Bangladesh Restaurant
-- This script can be run multiple times safely

-- Set timezone to Bangladesh (Dhaka)
SET timezone = 'Asia/Dhaka';

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    -- Fixed column name from 'available' to 'is_available' to match existing schema
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    phone TEXT,
    address TEXT,
    total_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2),
    vat NUMERIC(10,2) DEFAULT 0,
    delivery_charge NUMERIC(10,2) DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'cash',
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    item_name TEXT,
    item_description TEXT,
    item_image TEXT,
    item_price NUMERIC(10,2),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

CREATE TABLE IF NOT EXISTS public.reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT,
    phone TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
-- Fixed index reference to use correct column name
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);

-- Create helper function to prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop existing RLS policies
    DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Orders are viewable by owner or admin" ON public.orders;
    DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Order items are viewable by order owner" ON public.order_items;
    DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
    DROP POLICY IF EXISTS "Reservations are viewable by owner" ON public.reservations;
    DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Social links are viewable by everyone" ON public.social_media_links;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using helper function to avoid recursion
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);

-- Profiles policies - no self-referencing queries to avoid recursion
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Orders policies using helper function
CREATE POLICY "Orders are viewable by owner or admin" ON public.orders FOR SELECT USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR
    user_id IS NULL
);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR
    user_id IS NULL
);

-- Order items policies using helper function
CREATE POLICY "Order items are viewable by order owner" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR public.is_admin(auth.uid()) OR orders.user_id IS NULL)
    )
);
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Reservations policies using helper function
CREATE POLICY "Reservations are viewable by owner" ON public.reservations FOR SELECT USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR
    user_id IS NULL
);
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own reservations" ON public.reservations FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR
    user_id IS NULL
);

CREATE POLICY "Social links are viewable by everyone" ON public.social_media_links FOR SELECT USING (true);

-- Create or replace functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Dhaka';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing updated_at triggers if they exist and recreate
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_updated_at ON public.menu_items;
DROP TRIGGER IF EXISTS handle_updated_at ON public.orders;
DROP TRIGGER IF EXISTS handle_updated_at ON public.reservations;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
