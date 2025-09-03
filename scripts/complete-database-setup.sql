-- Complete Database Setup for Sushi Yaki Restaurant
-- Safe to run even if some tables or data already exist

-- Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table if not exists
CREATE TABLE IF NOT EXISTS public.menu_items (
    menu_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Appetizer', 'Sashimi', 'Sushi Rolls', 'Main Course', 'Desserts')),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table if not exists
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    short_order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if not exists
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.menu_items(menu_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table if not exists
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_media_links table if not exists
CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu items policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage menu items" ON public.menu_items;
CREATE POLICY "Only admins can manage menu items" ON public.menu_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Orders policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;
CREATE POLICY "Only admins can update orders" ON public.orders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Order items policies
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Reservations policies
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;
CREATE POLICY "Anyone can view reservations" ON public.reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update reservations" ON public.reservations;
CREATE POLICY "Only admins can update reservations" ON public.reservations FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Social media links policies
DROP POLICY IF EXISTS "Anyone can view social media links" ON public.social_media_links;
CREATE POLICY "Anyone can view social media links" ON public.social_media_links FOR SELECT USING (true);

-- Create function for generating short order IDs
CREATE OR REPLACE FUNCTION generate_short_order_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating short order IDs
CREATE OR REPLACE FUNCTION set_short_order_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_order_id IS NULL OR NEW.short_order_id = '' THEN
        LOOP
            NEW.short_order_id := generate_short_order_id();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE short_order_id = NEW.short_order_id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_short_order_id ON public.orders;
CREATE TRIGGER trigger_set_short_order_id
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION set_short_order_id();

-- Create RPC function for updating order status
CREATE OR REPLACE FUNCTION update_order_status(
    order_identifier TEXT,
    new_status TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
    result JSON;
BEGIN
    -- Try to find order by short_order_id first, then by order_id
    SELECT * INTO order_record 
    FROM public.orders 
    WHERE short_order_id = order_identifier 
       OR order_id::TEXT = order_identifier;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Update the order status
    UPDATE public.orders 
    SET status = new_status, updated_at = NOW()
    WHERE order_id = order_record.order_id;
    
    -- Return the updated order
    SELECT json_build_object(
        'success', true,
        'order', json_build_object(
            'order_id', order_id,
            'short_order_id', short_order_id,
            'customer_name', customer_name,
            'status', status,
            'total_amount', total_amount,
            'updated_at', updated_at
        )
    ) INTO result
    FROM public.orders 
    WHERE order_id = order_record.order_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample menu items (only if they don't exist)
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available)
SELECT * FROM (VALUES
    ('Edamame', 'Steamed young soybeans with sea salt', 6.99, 'Appetizer', '/images/menu/edamame.jpg', true),
    ('Gyoza', 'Pan-fried pork dumplings with ponzu sauce', 8.99, 'Appetizer', '/images/menu/gyoza.jpg', true),
    ('Agedashi Tofu', 'Lightly fried tofu in savory dashi broth', 7.99, 'Appetizer', '/images/menu/agedashi-tofu.jpg', true),
    ('Salmon Sashimi', 'Fresh Atlantic salmon, 6 pieces', 14.99, 'Sashimi', '/images/menu/salmon-sashimi.jpg', true),
    ('Tuna Sashimi', 'Premium bluefin tuna, 6 pieces', 16.99, 'Sashimi', '/images/menu/tuna-sashimi.jpg', true),
    ('Yellowtail Sashimi', 'Fresh yellowtail, 6 pieces', 15.99, 'Sashimi', '/images/menu/yellowtail-sashimi.jpg', true),
    ('California Roll', 'Crab, avocado, cucumber with sesame seeds', 8.99, 'Sushi Rolls', '/images/menu/california-roll.jpg', true),
    ('Spicy Tuna Roll', 'Spicy tuna with cucumber and sriracha mayo', 10.99, 'Sushi Rolls', '/images/menu/spicy-tuna-roll.jpg', true),
    ('Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 13.99, 'Sushi Rolls', '/images/menu/dragon-roll.jpg', true),
    ('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 16.99, 'Main Course', '/images/menu/chicken-teriyaki.jpg', true),
    ('Beef Yakitori', 'Grilled beef skewers with tare sauce', 18.99, 'Main Course', '/images/menu/beef-yakitori.jpg', true),
    ('Chirashi Bowl', 'Assorted sashimi over seasoned sushi rice', 22.99, 'Main Course', '/images/menu/chirashi-bowl.jpg', true),
    ('Mochi Ice Cream', 'Sweet rice cake filled with ice cream, 3 pieces', 6.99, 'Desserts', '/images/menu/mochi-ice-cream.jpg', true),
    ('Dorayaki', 'Pancake sandwich filled with sweet red bean paste', 5.99, 'Desserts', '/images/menu/dorayaki.jpg', true),
    ('Matcha Cheesecake', 'Creamy cheesecake with matcha flavor', 7.99, 'Desserts', '/images/menu/matcha-cheesecake.jpg', true)
) AS new_items(name, description, price, category, image_url, is_available)
WHERE NOT EXISTS (
    SELECT 1 FROM public.menu_items WHERE public.menu_items.name = new_items.name
);

-- Insert sample social media links (only if they don't exist)
INSERT INTO public.social_media_links (platform, url, is_active)
SELECT * FROM (VALUES
    ('Facebook', 'https://facebook.com/sushiyaki', true),
    ('Instagram', 'https://instagram.com/sushiyaki', true),
    ('Twitter', 'https://twitter.com/sushiyaki', true)
) AS new_links(platform, url, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM public.social_media_links WHERE public.social_media_links.platform = new_links.platform
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_short_order_id ON public.orders(short_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
