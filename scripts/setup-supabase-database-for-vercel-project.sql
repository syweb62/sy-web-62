-- Complete Supabase Database Setup for Restaurant Application
-- Project: pjoelkxkcwtzmbyswfhu
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS social_media_links CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
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
CREATE TABLE menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
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
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE reservations (
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
CREATE TABLE social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_social_media_display_order ON social_media_links(display_order);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url, is_available) VALUES
-- Sushi
('Salmon Nigiri', 'Fresh salmon over seasoned rice', 4.50, 'Sushi', '/placeholder.svg?height=200&width=200&text=Salmon+Nigiri', true),
('Tuna Nigiri', 'Premium tuna over seasoned rice', 5.00, 'Sushi', '/placeholder.svg?height=200&width=200&text=Tuna+Nigiri', true),
('California Roll', 'Crab, avocado, and cucumber roll', 8.50, 'Sushi', '/placeholder.svg?height=200&width=200&text=California+Roll', true),
('Spicy Tuna Roll', 'Spicy tuna with cucumber and avocado', 9.00, 'Sushi', '/placeholder.svg?height=200&width=200&text=Spicy+Tuna+Roll', true),
('Dragon Roll', 'Eel and cucumber topped with avocado', 12.50, 'Sushi', '/placeholder.svg?height=200&width=200&text=Dragon+Roll', true),

-- Yakitori
('Chicken Teriyaki', 'Grilled chicken with teriyaki sauce', 7.50, 'Yakitori', '/placeholder.svg?height=200&width=200&text=Chicken+Teriyaki', true),
('Beef Yakitori', 'Grilled beef skewers with tare sauce', 8.00, 'Yakitori', '/placeholder.svg?height=200&width=200&text=Beef+Yakitori', true),
('Vegetable Skewers', 'Mixed grilled vegetables', 6.00, 'Yakitori', '/placeholder.svg?height=200&width=200&text=Vegetable+Skewers', true),

-- Ramen
('Tonkotsu Ramen', 'Rich pork bone broth with chashu', 13.50, 'Ramen', '/placeholder.svg?height=200&width=200&text=Tonkotsu+Ramen', true),
('Miso Ramen', 'Fermented soybean paste broth', 12.00, 'Ramen', '/placeholder.svg?height=200&width=200&text=Miso+Ramen', true),
('Shoyu Ramen', 'Clear soy sauce based broth', 11.50, 'Ramen', '/placeholder.svg?height=200&width=200&text=Shoyu+Ramen', true),

-- Appetizers
('Gyoza', 'Pan-fried pork dumplings (6 pieces)', 7.00, 'Appetizers', '/placeholder.svg?height=200&width=200&text=Gyoza', true),
('Edamame', 'Steamed and salted young soybeans', 4.50, 'Appetizers', '/placeholder.svg?height=200&width=200&text=Edamame', true),
('Agedashi Tofu', 'Lightly fried tofu in savory broth', 6.50, 'Appetizers', '/placeholder.svg?height=200&width=200&text=Agedashi+Tofu', true),

-- Desserts
('Mochi Ice Cream', 'Sweet rice cake with ice cream (3 pieces)', 6.00, 'Desserts', '/placeholder.svg?height=200&width=200&text=Mochi+Ice+Cream', true),
('Dorayaki', 'Pancake sandwich with sweet red bean filling', 5.50, 'Desserts', '/placeholder.svg?height=200&width=200&text=Dorayaki', true),

-- Beverages
('Green Tea', 'Traditional Japanese green tea', 3.00, 'Beverages', '/placeholder.svg?height=200&width=200&text=Green+Tea', true),
('Sake', 'Premium Japanese rice wine', 8.00, 'Beverages', '/placeholder.svg?height=200&width=200&text=Sake', true),
('Ramune', 'Japanese carbonated soft drink', 3.50, 'Beverages', '/placeholder.svg?height=200&width=200&text=Ramune', true),

-- Special Items
('Chirashi Bowl', 'Assorted sashimi over sushi rice', 18.50, 'Special', '/placeholder.svg?height=200&width=200&text=Chirashi+Bowl', true);

-- Insert sample social media links
INSERT INTO social_media_links (platform_name, link, button_type, display_order) VALUES
('Facebook', 'https://facebook.com/sushiyaki', 'primary', 1),
('Instagram', 'https://instagram.com/sushiyaki', 'secondary', 2),
('Twitter', 'https://twitter.com/sushiyaki', 'outline', 3),
('WhatsApp', 'https://wa.me/1234567890', 'success', 4),
('TikTok', 'https://tiktok.com/@sushiyaki', 'ghost', 5);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for menu_items (public read, admin write)
CREATE POLICY "Anyone can view available menu items" ON menu_items
    FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage menu items" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM profiles 
                     WHERE profiles.id = auth.uid() 
                     AND profiles.role = 'admin'
                 )
            )
        )
    );

CREATE POLICY "Users can create order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- RLS Policies for reservations
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create reservations" ON reservations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Admins can update reservations" ON reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for social_media_links (public read, admin write)
CREATE POLICY "Anyone can view social media links" ON social_media_links
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage social media links" ON social_media_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
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
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created 6 tables with proper relationships';
    RAISE NOTICE '🍣 Inserted 20 sample menu items';
    RAISE NOTICE '📱 Added 5 social media links';
    RAISE NOTICE '🔒 Configured Row Level Security policies';
    RAISE NOTICE '⚡ Added performance indexes';
    RAISE NOTICE '🎉 Your restaurant database is ready to use!';
END $$;
