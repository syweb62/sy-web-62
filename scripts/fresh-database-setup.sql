-- Fresh Supabase Database Setup for Sushi Yaki Restaurant
-- This script creates a clean database with proper column names and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS social_media_links CASCADE;

-- Create profiles table for user management
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create menu_items table with proper column names
CREATE TABLE menu_items (
    menu_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create orders table with proper status constraints
CREATE TABLE orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    short_order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    phone_number TEXT NOT NULL,
    address TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create order_items table with proper column names
CREATE TABLE order_items (
    item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu_items(menu_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create reservations table
CREATE TABLE reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    phone_number TEXT NOT NULL,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create social_media_links table
CREATE TABLE social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Dhaka')
);

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_short_id ON orders(short_order_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Function to generate short order ID
CREATE OR REPLACE FUNCTION generate_short_order_id()
RETURNS TEXT AS $$
DECLARE
    short_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        short_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE short_order_id = short_id) THEN
            RETURN short_id;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            short_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
            RETURN short_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate short_order_id
CREATE OR REPLACE FUNCTION set_short_order_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_order_id IS NULL OR NEW.short_order_id = '' THEN
        NEW.short_order_id := generate_short_order_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_short_order_id
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_short_order_id();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (NOW() AT TIME ZONE 'Asia/Dhaka');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC function for updating order status (fixes UUID/short_order_id issues)
CREATE OR REPLACE FUNCTION update_order_status(
    order_identifier TEXT,
    new_status TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record orders%ROWTYPE;
    result JSON;
BEGIN
    -- Try to find order by short_order_id first, then by UUID
    SELECT * INTO order_record 
    FROM orders 
    WHERE short_order_id = order_identifier 
       OR order_id::TEXT = order_identifier;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Order not found',
            'order_identifier', order_identifier
        );
    END IF;
    
    -- Validate status
    IF new_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid status',
            'valid_statuses', ARRAY['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
        );
    END IF;
    
    -- Update the order
    UPDATE orders 
    SET status = new_status, 
        updated_at = (NOW() AT TIME ZONE 'Asia/Dhaka')
    WHERE order_id = order_record.order_id;
    
    -- Get updated record
    SELECT * INTO order_record FROM orders WHERE order_id = order_record.order_id;
    
    RETURN json_build_object(
        'success', true,
        'order', json_build_object(
            'order_id', order_record.order_id,
            'short_order_id', order_record.short_order_id,
            'status', order_record.status,
            'updated_at', order_record.updated_at
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for menu_items (public read, admin write)
CREATE POLICY "Anyone can view available menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Admins can manage menu items" ON menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for orders (public insert, admin manage)
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for order_items
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for reservations
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reservations" ON reservations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for social_media_links
CREATE POLICY "Anyone can view active social links" ON social_media_links FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage social links" ON social_media_links FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, is_available) VALUES
('California Roll', 'Fresh avocado, cucumber, and crab meat', 12.99, 'Sushi Rolls', true),
('Salmon Nigiri', 'Fresh salmon over seasoned rice', 8.99, 'Nigiri', true),
('Chicken Teriyaki', 'Grilled chicken with teriyaki sauce', 15.99, 'Main Dishes', true),
('Miso Soup', 'Traditional soybean paste soup', 4.99, 'Soups', true),
('Tempura Shrimp', 'Lightly battered and fried shrimp', 13.99, 'Appetizers', true),
('Dragon Roll', 'Eel, cucumber, topped with avocado', 16.99, 'Sushi Rolls', true),
('Tuna Sashimi', 'Fresh raw tuna slices', 14.99, 'Sashimi', true),
('Beef Yakitori', 'Grilled beef skewers with tare sauce', 11.99, 'Appetizers', true);

-- Insert social media links
INSERT INTO social_media_links (platform, url, is_active) VALUES
('Facebook', 'https://facebook.com/sushiyakiresto', true),
('Instagram', 'https://instagram.com/sushiyakiresto', true),
('Twitter', 'https://twitter.com/sushiyakiresto', true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_order_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_short_order_id TO anon, authenticated;
