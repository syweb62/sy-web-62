-- Complete Database Setup Script for Sushi Yaki Restaurant
-- This script creates all necessary tables, sample data, and security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT, -- For navbar compatibility
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
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
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
    total_price DECIMAL(10,2) NOT NULL,
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
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
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
    people_count INTEGER NOT NULL,
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

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available) VALUES
-- Sushi Items
('Salmon Nigiri', 'Fresh salmon over seasoned rice', 4.50, 'Sushi', '/placeholder.svg?height=200&width=300', true),
('Tuna Nigiri', 'Premium tuna over seasoned rice', 5.00, 'Sushi', '/placeholder.svg?height=200&width=300', true),
('Eel Nigiri', 'Grilled eel with sweet sauce', 5.50, 'Sushi', '/placeholder.svg?height=200&width=300', true),
('California Roll', 'Crab, avocado, and cucumber roll', 8.00, 'Sushi', '/placeholder.svg?height=200&width=300', true),
('Spicy Tuna Roll', 'Spicy tuna with cucumber', 9.00, 'Sushi', '/placeholder.svg?height=200&width=300', true),

-- Yakitori Items
('Chicken Teriyaki', 'Grilled chicken with teriyaki sauce', 12.00, 'Yakitori', '/placeholder.svg?height=200&width=300', true),
('Beef Skewers', 'Grilled beef skewers with tare sauce', 14.00, 'Yakitori', '/placeholder.svg?height=200&width=300', true),
('Pork Belly', 'Grilled pork belly with miso glaze', 13.00, 'Yakitori', '/placeholder.svg?height=200&width=300', true),
('Chicken Wings', 'Grilled chicken wings with spicy sauce', 10.00, 'Yakitori', '/placeholder.svg?height=200&width=300', true),
('Vegetable Skewers', 'Mixed grilled vegetables', 8.00, 'Yakitori', '/placeholder.svg?height=200&width=300', true),

-- Ramen Items
('Tonkotsu Ramen', 'Rich pork bone broth with chashu', 15.00, 'Ramen', '/placeholder.svg?height=200&width=300', true),
('Miso Ramen', 'Fermented soybean paste broth', 14.00, 'Ramen', '/placeholder.svg?height=200&width=300', true),
('Shoyu Ramen', 'Clear soy sauce based broth', 13.00, 'Ramen', '/placeholder.svg?height=200&width=300', true),
('Spicy Miso Ramen', 'Spicy miso broth with ground pork', 16.00, 'Ramen', '/placeholder.svg?height=200&width=300', true),
('Vegetarian Ramen', 'Vegetable broth with tofu and vegetables', 12.00, 'Ramen', '/placeholder.svg?height=200&width=300', true),

-- Appetizers
('Gyoza', 'Pan-fried pork dumplings (6 pieces)', 8.00, 'Appetizers', '/placeholder.svg?height=200&width=300', true),
('Edamame', 'Steamed and salted young soybeans', 5.00, 'Appetizers', '/placeholder.svg?height=200&width=300', true),
('Tempura Shrimp', 'Lightly battered and fried shrimp', 12.00, 'Appetizers', '/placeholder.svg?height=200&width=300', true),
('Agedashi Tofu', 'Lightly fried tofu in savory broth', 7.00, 'Appetizers', '/placeholder.svg?height=200&width=300', true),
('Takoyaki', 'Octopus balls with takoyaki sauce', 9.00, 'Appetizers', '/placeholder.svg?height=200&width=300', true),

-- Desserts
('Mochi Ice Cream', 'Sweet rice cake with ice cream (3 pieces)', 6.00, 'Desserts', '/placeholder.svg?height=200&width=300', true),
('Dorayaki', 'Pancake sandwich with sweet red bean', 5.00, 'Desserts', '/placeholder.svg?height=200&width=300', true),
('Matcha Cheesecake', 'Green tea flavored cheesecake', 7.00, 'Desserts', '/placeholder.svg?height=200&width=300', true),
('Taiyaki', 'Fish-shaped pastry with sweet filling', 4.00, 'Desserts', '/placeholder.svg?height=200&width=300', true),
('Japanese Fruit Sandwich', 'Soft bread with fresh fruits and cream', 8.00, 'Desserts', '/placeholder.svg?height=200&width=300', true)

ON CONFLICT (id) DO NOTHING;

-- Insert social media links
INSERT INTO public.social_media_links (platform_name, link, button_type, display_order) VALUES
('Instagram', 'https://instagram.com/sushiyaki', 'social', 1),
('Facebook', 'https://facebook.com/sushiyaki', 'social', 2),
('Twitter', 'https://twitter.com/sushiyaki', 'social', 3),
('WhatsApp', 'https://wa.me/1234567890', 'contact', 4),
('Phone', 'tel:+1234567890', 'contact', 5)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for menu_items (public read access)
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Only admins can modify menu items" ON public.menu_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Create policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Create policies for order_items
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id AND orders.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert their own order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id AND orders.user_id = auth.uid()
    )
);

-- Create policies for reservations
CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reservations" ON public.reservations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Create policies for social_media_links (public read access)
CREATE POLICY "Social media links are viewable by everyone" ON public.social_media_links FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);

-- Create function to handle new user registration
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

-- Create trigger for new user registration
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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
