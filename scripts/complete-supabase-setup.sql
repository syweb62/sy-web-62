-- Complete Supabase Database Setup Script for Restaurant Application
-- Run this in your Supabase SQL Editor
-- This is the main setup script - run this first

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone to Bangladesh Dhaka (UTC+6)
SET timezone = 'Asia/Dhaka';

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    category TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    phone TEXT,
    address TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
    item_name TEXT,
    item_description TEXT,
    item_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL CHECK (people_count > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_media_links table
CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON public.reservations(date, time);
CREATE INDEX IF NOT EXISTS idx_social_media_display_order ON public.social_media_links(display_order);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for menu items (public read, admin write)
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert menu items" ON public.menu_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update menu items" ON public.menu_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for orders (guest checkout allowed)
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for order items
CREATE POLICY "Order items are viewable by order owner" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE order_id = public.order_items.order_id 
            AND (user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for reservations
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert reservations" ON public.reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reservations" ON public.reservations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all reservations" ON public.reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for social media links (public read, admin write)
CREATE POLICY "Social media links are viewable by everyone" ON public.social_media_links
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert social media links" ON public.social_media_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update social media links" ON public.social_media_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create timezone utility functions
CREATE OR REPLACE FUNCTION get_dhaka_time()
RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'Asia/Dhaka';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION format_dhaka_time(input_time timestamptz)
RETURNS text AS $$
BEGIN
  RETURN to_char(input_time AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Complete database setup finished successfully!';
    RAISE NOTICE 'Timezone set to Asia/Dhaka (Bangladesh)';
    RAISE NOTICE 'Created tables: profiles, menu_items, orders, order_items, reservations, social_media_links';
    RAISE NOTICE 'Configured Row Level Security policies with guest checkout support';
    RAISE NOTICE 'Added performance indexes and utility functions';
    RAISE NOTICE 'Your restaurant database is ready to use!';
END $$;
