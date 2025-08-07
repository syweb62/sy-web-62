-- Supabase Database Setup Script v2
-- This script safely sets up all tables and policies for the SushiYaki restaurant app
-- It handles existing policies and tables gracefully

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies for profiles table
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    
    -- Drop policies for menu_items table
    DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
    DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
    
    -- Drop policies for orders table
    DROP POLICY IF EXISTS "Users can view own orders" ON orders;
    DROP POLICY IF EXISTS "Users can create orders" ON orders;
    DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
    DROP POLICY IF EXISTS "Admins can update orders" ON orders;
    
    -- Drop policies for order_items table
    DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can create order items" ON order_items;
    DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
    
    -- Drop policies for reservations table
    DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
    DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
    DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
    DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
    
    -- Drop policies for social_media_links table
    DROP POLICY IF EXISTS "Anyone can view social media links" ON social_media_links;
    DROP POLICY IF EXISTS "Admins can manage social media links" ON social_media_links;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Table doesn't exist yet, continue
    WHEN undefined_object THEN
        NULL; -- Policy doesn't exist, continue
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_media_links table
CREATE TABLE IF NOT EXISTS social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for menu_items
CREATE POLICY "Anyone can view menu items" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu items" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for order_items
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = order_items.order_id 
            AND orders.user_id = auth.uid()
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

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for reservations
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all reservations" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update reservations" ON reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for social_media_links
CREATE POLICY "Anyone can view social media links" ON social_media_links
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage social media links" ON social_media_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample menu items (only if they don't exist)
INSERT INTO menu_items (name, description, price, category, image_url, is_available)
SELECT * FROM (VALUES
    ('Salmon Nigiri', 'Fresh Atlantic salmon over seasoned sushi rice', 4.50, 'Nigiri', '/placeholder.svg?height=200&width=200&text=Salmon+Nigiri', true),
    ('Tuna Sashimi', 'Premium bluefin tuna, sliced fresh', 8.00, 'Sashimi', '/placeholder.svg?height=200&width=200&text=Tuna+Sashimi', true),
    ('California Roll', 'Crab, avocado, cucumber with sesame seeds', 7.50, 'Rolls', '/placeholder.svg?height=200&width=200&text=California+Roll', true),
    ('Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 12.00, 'Specialty Rolls', '/placeholder.svg?height=200&width=200&text=Dragon+Roll', true),
    ('Miso Soup', 'Traditional soybean paste soup with tofu and seaweed', 3.50, 'Appetizers', '/placeholder.svg?height=200&width=200&text=Miso+Soup', true),
    ('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 14.00, 'Entrees', '/placeholder.svg?height=200&width=200&text=Chicken+Teriyaki', true),
    ('Spicy Tuna Roll', 'Spicy tuna mix with cucumber and spicy mayo', 8.50, 'Rolls', '/placeholder.svg?height=200&width=200&text=Spicy+Tuna+Roll', true),
    ('Edamame', 'Steamed young soybeans with sea salt', 4.00, 'Appetizers', '/placeholder.svg?height=200&width=200&text=Edamame', true),
    ('Rainbow Roll', 'California roll topped with assorted fresh fish', 13.50, 'Specialty Rolls', '/placeholder.svg?height=200&width=200&text=Rainbow+Roll', true),
    ('Green Tea Ice Cream', 'Traditional Japanese green tea flavored ice cream', 5.00, 'Desserts', '/placeholder.svg?height=200&width=200&text=Green+Tea+Ice+Cream', true)
) AS new_items(name, description, price, category, image_url, is_available)
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE menu_items.name = new_items.name);

-- Insert sample social media links (only if they don't exist)
INSERT INTO social_media_links (platform_name, link, button_type, display_order)
SELECT * FROM (VALUES
    ('Facebook', 'https://facebook.com/sushiyaki', 'primary', 1),
    ('Instagram', 'https://instagram.com/sushiyaki', 'secondary', 2),
    ('Twitter', 'https://twitter.com/sushiyaki', 'outline', 3),
    ('WhatsApp', 'https://wa.me/1234567890', 'success', 4)
) AS new_links(platform_name, link, button_type, display_order)
WHERE NOT EXISTS (SELECT 1 FROM social_media_links WHERE social_media_links.platform_name = new_links.platform_name);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: profiles, menu_items, orders, order_items, reservations, social_media_links';
    RAISE NOTICE 'Sample data inserted: % menu items, % social media links', 
        (SELECT COUNT(*) FROM menu_items),
        (SELECT COUNT(*) FROM social_media_links);
END $$;
