-- Ensure all required tables exist with proper structure
-- This script is safe to run multiple times

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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

-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.menu_items (
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

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    phone TEXT,
    address TEXT,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
    item_name TEXT,
    item_description TEXT,
    item_image TEXT,
    notes TEXT,
    modifiers TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL CHECK (people_count > 0 AND people_count <= 20),
    special_requests TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_media_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    link TEXT NOT NULL,
    button_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample menu items if table is empty
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available)
SELECT * FROM (VALUES
    ('Sushi Platter', 'Assortment of fresh nigiri and maki rolls with wasabi, ginger, and soy sauce.', 24.99, 'sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Teriyaki Salmon', 'Grilled salmon glazed with our signature teriyaki sauce, served with steamed rice.', 22.99, 'bento', 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Tonkotsu Ramen', 'Rich pork broth with ramen noodles, soft-boiled egg, chashu pork, and fresh vegetables.', 18.99, 'ramen', 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Gyoza', 'Pan-fried dumplings filled with seasoned ground pork and vegetables.', 8.99, 'appetizers', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Dragon Roll', 'Eel and cucumber inside, avocado and tobiko on top, drizzled with eel sauce.', 16.99, 'sushi', 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Miso Soup', 'Traditional Japanese soup with tofu, seaweed, and green onions.', 4.99, 'appetizers', 'https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Chicken Katsu Bento', 'Crispy breaded chicken cutlet served with rice, salad, and miso soup.', 19.99, 'bento', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Matcha Green Tea Ice Cream', 'Creamy ice cream infused with premium matcha green tea.', 6.99, 'desserts', 'https://images.unsplash.com/photo-1561845730-208ad5910553?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Sake', 'Traditional Japanese rice wine, served warm or cold.', 12.99, 'drinks', 'https://images.unsplash.com/photo-1627042633145-b780d842ba0a?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Mochi Ice Cream', 'Sweet rice dough filled with ice cream in various flavors.', 7.99, 'desserts', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Spicy Tuna Roll', 'Fresh tuna mixed with spicy mayo and cucumber, wrapped in seaweed and rice.', 14.99, 'sushi', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Japanese Green Tea', 'Traditional Japanese green tea, served hot.', 3.99, 'drinks', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Salmon Sashimi', 'Freshly sliced salmon sashimi served with wasabi and soy sauce.', 17.99, 'sashimi', 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Beef Udon', 'Thick udon noodles in savory broth with tender beef and scallions.', 15.99, 'udon', 'https://images.unsplash.com/photo-1625944528146-67a5bf02a43e?q=80&w=600&h=400&auto=format&fit=crop', true),
    ('Shrimp Tempura', 'Crispy battered shrimp served with tentsuyu dipping sauce.', 13.99, 'tempura', 'https://images.unsplash.com/photo-1604908554035-2bd3f2b5a726?q=80&w=600&h=400&auto=format&fit=crop', true)
) AS v(name, description, price, category, image_url, is_available)
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items LIMIT 1);

-- Insert sample social media links if table is empty
INSERT INTO public.social_media_links (platform_name, link, button_type, display_order)
SELECT * FROM (VALUES
    ('WhatsApp', 'https://wa.me/message/J5JFSMILYBTQG1', 'chat', 1),
    ('Facebook', 'https://www.facebook.com/yaki24sushipur', 'social', 2),
    ('Instagram', 'https://www.instagram.com/sushi_yaki_mohammadpur', 'social', 3)
) AS v(platform_name, link, button_type, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.social_media_links LIMIT 1);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: Users can read and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Menu items: Everyone can read, only authenticated users for other operations
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items" ON public.menu_items
    FOR SELECT USING (true);

-- Orders: Users can view their own orders, anyone can create orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Order items: Users can view items from their own orders
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.order_id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Reservations: Users can view their own reservations, anyone can create reservations
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations" ON public.reservations
    FOR INSERT WITH CHECK (true);

-- Social media links: Everyone can read
DROP POLICY IF EXISTS "Anyone can view social media links" ON public.social_media_links;
CREATE POLICY "Anyone can view social media links" ON public.social_media_links
    FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.menu_items;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.profiles IS 'User profiles with additional information';
COMMENT ON TABLE public.menu_items IS 'Restaurant menu items with pricing and availability';
COMMENT ON TABLE public.orders IS 'Customer orders with payment and delivery information';
COMMENT ON TABLE public.order_items IS 'Individual items within each order';
COMMENT ON TABLE public.reservations IS 'Table reservations with date, time, and party size';
COMMENT ON TABLE public.social_media_links IS 'Social media links for the restaurant';
