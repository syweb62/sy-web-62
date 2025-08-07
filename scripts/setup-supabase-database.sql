-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
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
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    phone TEXT,
    address TEXT,
    payment_method TEXT,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending',
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
    quantity INTEGER NOT NULL,
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
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for menu_items (public read, admin write)
CREATE POLICY "Anyone can view menu items" ON public.menu_items
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for order_items
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE order_id = public.order_items.order_id 
            AND (user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for reservations
CREATE POLICY "Users can view own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can create reservations" ON public.reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update reservations" ON public.reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for social_media_links (public read, admin write)
CREATE POLICY "Anyone can view social media links" ON public.social_media_links
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify social media links" ON public.social_media_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category, is_available) VALUES
('Salmon Sashimi', 'Fresh Atlantic salmon, thinly sliced', 18.99, 'Sashimi', true),
('Tuna Sashimi', 'Premium bluefin tuna, expertly cut', 22.99, 'Sashimi', true),
('California Roll', 'Crab, avocado, cucumber with sesame seeds', 12.99, 'Rolls', true),
('Spicy Tuna Roll', 'Spicy tuna with cucumber and spicy mayo', 14.99, 'Rolls', true),
('Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 16.99, 'Specialty Rolls', true),
('Rainbow Roll', 'California roll topped with assorted sashimi', 18.99, 'Specialty Rolls', true),
('Miso Soup', 'Traditional soybean paste soup with tofu and seaweed', 4.99, 'Soup', true),
('Edamame', 'Steamed young soybeans with sea salt', 6.99, 'Appetizers', true),
('Gyoza', 'Pan-fried pork dumplings with dipping sauce', 8.99, 'Appetizers', true),
('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 16.99, 'Entrees', true);

-- Insert sample social media links
INSERT INTO public.social_media_links (platform_name, link, button_type, display_order) VALUES
('Facebook', 'https://facebook.com/sushiyaki', 'primary', 1),
('Instagram', 'https://instagram.com/sushiyaki', 'secondary', 2),
('Twitter', 'https://twitter.com/sushiyaki', 'secondary', 3);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
