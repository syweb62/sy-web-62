-- Add short_order_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS short_order_id TEXT;

-- Create a function to generate short order IDs
CREATE OR REPLACE FUNCTION generate_short_order_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    short_id TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(short_order_id FROM 5) AS INTEGER)), 0) + 1
    INTO next_id
    FROM orders
    WHERE short_order_id IS NOT NULL AND short_order_id ~ '^ORD-[0-9]+$';
    
    -- Format as ORD-XXX with zero padding
    short_id := 'ORD-' || LPAD(next_id::TEXT, 3, '0');
    
    RETURN short_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate short order ID on insert
CREATE OR REPLACE FUNCTION set_short_order_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_order_id IS NULL THEN
        NEW.short_order_id := generate_short_order_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_short_order_id ON orders;
CREATE TRIGGER trigger_set_short_order_id
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_short_order_id();

-- Update existing orders that don't have short_order_id
DO $$
DECLARE
    order_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR order_record IN 
        SELECT order_id FROM orders WHERE short_order_id IS NULL ORDER BY created_at
    LOOP
        UPDATE orders 
        SET short_order_id = 'ORD-' || LPAD(counter::TEXT, 3, '0')
        WHERE order_id = order_record.order_id;
        counter := counter + 1;
    END LOOP;
END $$;
