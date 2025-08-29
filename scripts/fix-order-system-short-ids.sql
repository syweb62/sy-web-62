-- Ensure all orders have short_order_id
UPDATE orders 
SET short_order_id = LPAD((EXTRACT(EPOCH FROM created_at)::bigint % 100000)::text, 5, '0')
WHERE short_order_id IS NULL OR short_order_id = '';

-- Ensure unique constraint on short_order_id
CREATE UNIQUE INDEX IF NOT EXISTS orders_short_order_id_unique_idx 
ON orders(short_order_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS orders_short_order_id_idx 
ON orders(short_order_id);
