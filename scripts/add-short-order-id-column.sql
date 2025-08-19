-- Add short_order_id column to orders table without breaking existing RLS policies
-- This approach keeps the existing UUID system intact while adding user-friendly short IDs

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS short_order_id TEXT UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_short_order_id ON public.orders(short_order_id);

-- Fixed SUBSTRING syntax error - PostgreSQL requires SUBSTRING function, not :: casting
-- Update existing orders with short IDs (optional - can be done gradually)
-- This generates short IDs for existing orders
UPDATE public.orders 
SET short_order_id = CONCAT(
  SUBSTRING(EXTRACT(EPOCH FROM created_at)::TEXT, 7, 4),
  UPPER(SUBSTRING(MD5(order_id::TEXT), 1, 2))
)
WHERE short_order_id IS NULL;
