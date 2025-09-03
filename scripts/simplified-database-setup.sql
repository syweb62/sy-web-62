-- Simplified Database Setup for Supabase (No Superuser Commands Required)
-- Safe to run multiple times

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table if not exists
CREATE TABLE IF NOT EXISTS menu_items (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menu_items(menu_id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table if not exists
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_media_links table if not exists
CREATE TABLE IF NOT EXISTS social_media_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Menu items policies (public read, admin write)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Anyone can view menu items') THEN
    CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT TO public USING (true);
  END IF;

  -- Orders policies (users can create, admins can manage)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can create orders') THEN
    CREATE POLICY "Anyone can create orders" ON orders FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can view orders') THEN
    CREATE POLICY "Anyone can view orders" ON orders FOR SELECT TO public USING (true);
  END IF;

  -- Order items policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Anyone can view order items') THEN
    CREATE POLICY "Anyone can view order items" ON order_items FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Anyone can create order items') THEN
    CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT TO public WITH CHECK (true);
  END IF;

  -- Reservations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'Anyone can create reservations') THEN
    CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'Anyone can view reservations') THEN
    CREATE POLICY "Anyone can view reservations" ON reservations FOR SELECT TO public USING (true);
  END IF;

  -- Social media policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_media_links' AND policyname = 'Anyone can view social media links') THEN
    CREATE POLICY "Anyone can view social media links" ON social_media_links FOR SELECT TO public USING (true);
  END IF;
END $$;

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

-- Create function for updating order status
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID DEFAULT NULL,
  p_short_order_id TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  updated_order orders%ROWTYPE;
BEGIN
  -- Update by order_id or short_order_id
  IF p_order_id IS NOT NULL THEN
    UPDATE orders 
    SET status = p_new_status, updated_at = NOW()
    WHERE order_id = p_order_id
    RETURNING * INTO updated_order;
  ELSIF p_short_order_id IS NOT NULL THEN
    UPDATE orders 
    SET status = p_new_status, updated_at = NOW()
    WHERE short_order_id = p_short_order_id
    RETURNING * INTO updated_order;
  ELSE
    RETURN json_build_object('error', 'Either order_id or short_order_id must be provided');
  END IF;

  IF updated_order.order_id IS NULL THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'order', row_to_json(updated_order)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for short order ID generation
CREATE OR REPLACE FUNCTION set_short_order_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_order_id IS NULL OR NEW.short_order_id = '' THEN
    LOOP
      NEW.short_order_id := generate_short_order_id();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE short_order_id = NEW.short_order_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_short_order_id') THEN
    CREATE TRIGGER trigger_set_short_order_id
      BEFORE INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION set_short_order_id();
  END IF;
END $$;

-- Insert sample menu items (only if table is empty)
INSERT INTO menu_items (name, description, price, category, image_url, is_available)
SELECT * FROM (VALUES
  ('Edamame', 'Steamed young soybeans with sea salt', 6.99, 'Appetizer', '/placeholder.svg?height=200&width=300', true),
  ('Gyoza', 'Pan-fried pork dumplings with dipping sauce', 8.99, 'Appetizer', '/placeholder.svg?height=200&width=300', true),
  ('Agedashi Tofu', 'Lightly fried tofu in savory dashi broth', 7.99, 'Appetizer', '/placeholder.svg?height=200&width=300', true),
  
  ('Salmon Sashimi', 'Fresh Atlantic salmon, 6 pieces', 14.99, 'Sashimi', '/placeholder.svg?height=200&width=300', true),
  ('Tuna Sashimi', 'Premium bluefin tuna, 6 pieces', 16.99, 'Sashimi', '/placeholder.svg?height=200&width=300', true),
  ('Yellowtail Sashimi', 'Fresh yellowtail, 6 pieces', 15.99, 'Sashimi', '/placeholder.svg?height=200&width=300', true),
  
  ('California Roll', 'Crab, avocado, cucumber with sesame seeds', 8.99, 'Sushi Rolls', '/placeholder.svg?height=200&width=300', true),
  ('Spicy Tuna Roll', 'Spicy tuna with cucumber and spicy mayo', 10.99, 'Sushi Rolls', '/placeholder.svg?height=200&width=300', true),
  ('Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 13.99, 'Sushi Rolls', '/placeholder.svg?height=200&width=300', true),
  
  ('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 16.99, 'Main Course', '/placeholder.svg?height=200&width=300', true),
  ('Beef Yakitori', 'Grilled beef skewers with tare sauce', 18.99, 'Main Course', '/placeholder.svg?height=200&width=300', true),
  ('Salmon Bento', 'Grilled salmon with rice, miso soup, and sides', 19.99, 'Main Course', '/placeholder.svg?height=200&width=300', true),
  
  ('Mochi Ice Cream', 'Sweet rice cake filled with ice cream, 3 pieces', 6.99, 'Desserts', '/placeholder.svg?height=200&width=300', true),
  ('Dorayaki', 'Pancake sandwich filled with sweet red bean paste', 5.99, 'Desserts', '/placeholder.svg?height=200&width=300', true),
  ('Matcha Cheesecake', 'Creamy cheesecake with matcha flavor', 7.99, 'Desserts', '/placeholder.svg?height=200&width=300', true)
) AS v(name, description, price, category, image_url, is_available)
WHERE NOT EXISTS (SELECT 1 FROM menu_items LIMIT 1);

-- Insert sample social media links (only if table is empty)
INSERT INTO social_media_links (platform, url, is_active)
SELECT * FROM (VALUES
  ('Facebook', 'https://facebook.com/sushiyaki', true),
  ('Instagram', 'https://instagram.com/sushiyaki', true),
  ('Twitter', 'https://twitter.com/sushiyaki', true)
) AS v(platform, url, is_active)
WHERE NOT EXISTS (SELECT 1 FROM social_media_links LIMIT 1);
