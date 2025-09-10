-- Grant proper permissions for real-time subscriptions on orders table
-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Grant usage on schema to anon role for real-time subscriptions
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select permission on orders table to anon role for real-time subscriptions
GRANT SELECT ON public.orders TO anon;

-- Remove IF NOT EXISTS clause which is not supported in PostgreSQL for CREATE POLICY
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow anon to read orders for real-time" ON orders;

CREATE POLICY "Allow anon to read orders for real-time" 
ON orders FOR SELECT 
TO anon 
USING (true);

-- Grant real-time permissions
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;

-- Handle case where orders table is already in publication
-- Check if orders table is already in the publication before adding it
DO $$
BEGIN
    -- Only add table to publication if it's not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;
