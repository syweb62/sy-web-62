-- Populate short_order_id for existing orders that don't have one
UPDATE orders 
SET short_order_id = CONCAT(
  SUBSTRING(EXTRACT(EPOCH FROM created_at)::TEXT, 7, 4),
  SUBSTRING(MD5(order_id::TEXT), 1, 2)
)
WHERE short_order_id IS NULL;

-- Verify the update
SELECT order_id, short_order_id, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
