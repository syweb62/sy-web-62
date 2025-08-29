-- Universal Order ID System Fix
-- This script ensures all orders have short_order_id and creates universal lookup functions

-- Step 1: Ensure all orders have a short_order_id
UPDATE orders 
SET short_order_id = 
  COALESCE(
    short_order_id,
    LPAD((EXTRACT(EPOCH FROM created_at)::bigint % 100000)::text, 5, '0')
  )
WHERE short_order_id IS NULL OR short_order_id = '';

-- Step 2: Unique constraint & performance index
CREATE UNIQUE INDEX IF NOT EXISTS orders_short_order_id_unique_idx ON orders(short_order_id);
CREATE INDEX IF NOT EXISTS orders_short_order_id_idx ON orders(short_order_id);

-- Step 3: Helper view (optional)
-- Fixed column name from 'id' to 'order_id' to match actual database schema
CREATE OR REPLACE VIEW order_lookup AS
SELECT 
  order_id AS uuid_order_id,
  short_order_id,
  created_at,
  status,
  customer_name,
  phone,
  address,
  total_price,
  vat,
  delivery_charge,
  message,
  updated_at
FROM orders;

-- Step 4: Updated universal function to fetch by short_order_id OR UUID
-- Fixed all column references from 'id' to 'order_id'
CREATE OR REPLACE FUNCTION get_order_by_identifier(identifier TEXT)
RETURNS TABLE (
  order_id UUID,
  short_order_id TEXT,
  created_at TIMESTAMPTZ,
  status TEXT,
  customer_name TEXT,
  phone TEXT,
  address TEXT,
  total_price NUMERIC,
  vat NUMERIC,
  delivery_charge NUMERIC,
  message TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.order_id, o.short_order_id, o.created_at, o.status, 
         o.customer_name, o.phone, o.address,
         o.total_price, o.vat, o.delivery_charge, o.message, o.updated_at
  FROM orders o
  WHERE o.short_order_id = identifier 
     OR o.order_id::text = identifier
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to update order status by identifier
-- Fixed all column references from 'id' to 'order_id'
CREATE OR REPLACE FUNCTION update_order_status_by_identifier(identifier TEXT, new_status TEXT)
RETURNS TABLE (
  order_id UUID,
  short_order_id TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  UPDATE orders 
  SET status = new_status, updated_at = NOW()
  WHERE orders.short_order_id = identifier 
     OR orders.order_id::text = identifier
  RETURNING orders.order_id, orders.short_order_id, orders.status, orders.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Debugging queries to check data integrity
-- Check if any short_order_id has letters (alphanumeric)
-- SELECT * FROM orders WHERE short_order_id ~ '[a-zA-Z]';

-- See if any orders missing short_order_id
-- SELECT * FROM orders WHERE short_order_id IS NULL OR short_order_id = '';
