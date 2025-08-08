-- Remove foreign key constraint from order_items table
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Make menu_item_id nullable to allow cart items without menu references
ALTER TABLE order_items ALTER COLUMN menu_item_id DROP NOT NULL;

-- Add columns to store cart item details directly
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS item_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS item_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS item_description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Update existing order_items to have item details from menu_items where possible
UPDATE order_items 
SET 
  item_name = menu_items.name,
  item_price = menu_items.price,
  item_image = menu_items.image_url,
  item_description = menu_items.description
FROM menu_items 
WHERE order_items.menu_item_id = menu_items.id 
AND order_items.item_name IS NULL;

-- Add a check constraint to ensure either menu_item_id exists or item details are provided
ALTER TABLE order_items 
ADD CONSTRAINT check_item_details 
CHECK (
  menu_item_id IS NOT NULL OR 
  (item_name IS NOT NULL AND item_price IS NOT NULL)
);

-- Create a view for easy order history retrieval
CREATE OR REPLACE VIEW order_history_view AS
SELECT 
  o.id as order_id,
  o.user_id,
  o.total_amount,
  o.status,
  o.created_at,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.delivery_address,
  oi.id as item_id,
  COALESCE(oi.item_name, mi.name) as item_name,
  COALESCE(oi.item_price, mi.price) as item_price,
  COALESCE(oi.item_image, mi.image_url) as item_image,
  COALESCE(oi.item_description, mi.description) as item_description,
  oi.quantity,
  oi.price as total_item_price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
ORDER BY o.created_at DESC, oi.id;

-- Grant necessary permissions
GRANT SELECT ON order_history_view TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON order_items TO authenticated;

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
  -- Orders RLS policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can manage their own orders'
  ) THEN
    CREATE POLICY "Users can manage their own orders" ON orders
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Order items RLS policy  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Users can manage their own order items'
  ) THEN
    CREATE POLICY "Users can manage their own order items" ON order_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id 
          AND orders.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
