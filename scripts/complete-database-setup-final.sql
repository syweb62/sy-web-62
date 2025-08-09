-- Complete Database Setup for Sushi Yaki Restaurant
-- This script creates all tables, policies, and sample data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies for our tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'menu_items', 'orders', 'order_items', 'reservations', 'social_media_links'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    customer_name TEXT,
    phone TEXT,
    address TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    total_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing data
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.reservations CASCADE;
TRUNCATE TABLE public.menu_items CASCADE;
TRUNCATE TABLE public.social_media_links CASCADE;

-- Insert menu items
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available) VALUES
-- Sushi Items
('Salmon Nigiri', 'Fresh Atlantic salmon over seasoned sushi rice', 4.50, 'sushi', '/placeholder.svg?height=300&width=400&text=Salmon+Nigiri', true),
('Tuna Nigiri', 'Premium bluefin tuna over seasoned sushi rice', 5.50, 'sushi', '/placeholder.svg?height=300&width=400&text=Tuna+Nigiri', true),
('Dragon Roll', 'Eel and cucumber inside, avocado and tobiko on top with eel sauce', 16.99, 'sushi', '/placeholder.svg?height=300&width=400&text=Dragon+Roll', true),
('California Roll', 'Crab, avocado, and cucumber wrapped in seaweed and rice', 8.99, 'sushi', '/placeholder.svg?height=300&width=400&text=California+Roll', true),
('Spicy Tuna Roll', 'Fresh tuna mixed with spicy mayo and cucumber', 12.99, 'sushi', '/placeholder.svg?height=300&width=400&text=Spicy+Tuna+Roll', true),
('Rainbow Roll', 'California roll topped with assorted sashimi', 18.99, 'sushi', '/placeholder.svg?height=300&width=400&text=Rainbow+Roll', true),
('Salmon Sashimi', '6 pieces of fresh Atlantic salmon sashimi', 14.99, 'sushi', '/placeholder.svg?height=300&width=400&text=Salmon+Sashimi', true),
('Chirashi Bowl', 'Assorted sashimi over seasoned sushi rice', 22.99, 'sushi', '/placeholder.svg?height=300&width=400&text=Chirashi+Bowl', true),

-- Yakitori Items
('Chicken Teriyaki', 'Grilled chicken glazed with teriyaki sauce', 15.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Chicken+Teriyaki', true),
('Beef Yakitori', 'Grilled beef skewers with tare sauce', 18.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Beef+Yakitori', true),
('Chicken Wings', 'Japanese-style grilled chicken wings', 12.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Chicken+Wings', true),
('Pork Belly Yakitori', 'Grilled pork belly skewers with sweet soy glaze', 16.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Pork+Belly+Yakitori', true),
('Vegetable Skewers', 'Grilled seasonal vegetables with miso glaze', 10.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Vegetable+Skewers', true),
('Chicken Thigh Yakitori', 'Juicy grilled chicken thigh with tare sauce', 14.99, 'yakitori', '/placeholder.svg?height=300&width=400&text=Chicken+Thigh+Yakitori', true),

-- Ramen Items
('Tonkotsu Ramen', 'Rich pork bone broth with chashu, egg, and vegetables', 16.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Tonkotsu+Ramen', true),
('Miso Ramen', 'Savory miso broth with corn, green onions, and chashu', 15.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Miso+Ramen', true),
('Shoyu Ramen', 'Clear soy sauce broth with bamboo shoots and nori', 14.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Shoyu+Ramen', true),
('Spicy Miso Ramen', 'Spicy miso broth with ground pork and bean sprouts', 17.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Spicy+Miso+Ramen', true),
('Vegetarian Ramen', 'Vegetable broth with tofu, mushrooms, and vegetables', 13.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Vegetarian+Ramen', true),
('Tsukemen', 'Thick noodles served with concentrated dipping broth', 18.99, 'ramen', '/placeholder.svg?height=300&width=400&text=Tsukemen', true),

-- Appetizers
('Gyoza', 'Pan-fried pork and vegetable dumplings (6 pieces)', 8.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Gyoza', true),
('Edamame', 'Steamed young soybeans with sea salt', 5.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Edamame', true),
('Agedashi Tofu', 'Lightly fried tofu in savory dashi broth', 7.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Agedashi+Tofu', true),
('Takoyaki', 'Octopus balls with takoyaki sauce and bonito flakes', 9.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Takoyaki', true),
('Chicken Karaage', 'Japanese-style fried chicken with spicy mayo', 11.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Chicken+Karaage', true),
('Miso Soup', 'Traditional soybean paste soup with tofu and wakame', 3.99, 'appetizers', '/placeholder.svg?height=300&width=400&text=Miso+Soup', true),

-- Desserts
('Mochi Ice Cream', 'Sweet rice dough filled with ice cream (3 pieces)', 7.99, 'desserts', '/placeholder.svg?height=300&width=400&text=Mochi+Ice+Cream', true),
('Matcha Cheesecake', 'Creamy cheesecake infused with premium matcha', 8.99, 'desserts', '/placeholder.svg?height=300&width=400&text=Matcha+Cheesecake', true),
('Dorayaki', 'Pancake sandwich filled with sweet red bean paste', 6.99, 'desserts', '/placeholder.svg?height=300&width=400&text=Dorayaki', true),
('Taiyaki', 'Fish-shaped pastry filled with sweet red bean paste', 5.99, 'desserts', '/placeholder.svg?height=300&width=400&text=Taiyaki', true);

-- Insert social media links
INSERT INTO public.social_media_links (platform_name, link, button_type, display_order) VALUES
('Instagram', 'https://instagram.com/sushiyaki', 'social', 1),
('Facebook', 'https://facebook.com/sushiyaki', 'social', 2),
('Twitter', 'https://twitter.com/sushiyaki', 'social', 3),
('WhatsApp', 'https://wa.me/1234567890', 'contact', 4),
('Phone', 'tel:+1234567890', 'contact', 5);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu items policies (public read, admin write)
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Only admins can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update menu items" ON public.menu_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE order_id = order_items.order_id AND (user_id = auth.uid() OR auth.uid() IS NULL)) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE order_id = order_items.order_id AND (user_id = auth.uid() OR auth.uid() IS NULL))
);

-- Reservations policies
CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own reservations" ON public.reservations FOR INSERT WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
);
CREATE POLICY "Users can update their own reservations" ON public.reservations FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Social media links policies (public read, admin write)
CREATE POLICY "Social media links are viewable by everyone" ON public.social_media_links FOR SELECT USING (true);
CREATE POLICY "Only admins can manage social media links" ON public.social_media_links FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.menu_items;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created 6 tables with proper relationships';
    RAISE NOTICE '🍣 Inserted 30 menu items across 5 categories';
    RAISE NOTICE '📱 Added 5 social media links';
    RAISE NOTICE '🔒 Configured Row Level Security policies';
    RAISE NOTICE '⚡ Created performance indexes';
    RAISE NOTICE '👤 Set up automatic user profile creation';
    RAISE NOTICE '🚀 Your Sushi Yaki restaurant is ready!';
END $$;
