-- Migration to change order_id from UUID to TEXT for shorter order IDs
-- This script handles RLS policies and foreign key constraints properly

BEGIN;

-- Step 1: Drop RLS policies that might reference order_id
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;

-- Step 2: Drop foreign key constraint
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Step 3: Drop views that depend on order_id
DROP VIEW IF EXISTS v_customer_orders_summary;
DROP VIEW IF EXISTS v_order_items_with_order;
DROP VIEW IF EXISTS v_order_summary;

-- Step 4: Change column types
ALTER TABLE orders ALTER COLUMN order_id TYPE TEXT;
ALTER TABLE order_items ALTER COLUMN order_id TYPE TEXT;

-- Step 5: Recreate foreign key constraint
ALTER TABLE order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

-- Step 6: Recreate RLS policies
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Step 7: Recreate views
CREATE VIEW v_order_summary AS
SELECT 
  o.order_id,
  o.customer_name,
  o.phone,
  o.address,
  o.status,
  o.payment_method,
  o.created_at as order_created_at,
  COUNT(oi.id) as item_count,
  SUM(oi.price_at_purchase * oi.quantity) as items_total
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.customer_name, o.phone, o.address, o.status, o.payment_method, o.created_at;

CREATE VIEW v_order_items_with_order AS
SELECT 
  oi.id as order_item_id,
  oi.order_id,
  oi.menu_item_id,
  oi.item_name,
  oi.quantity,
  oi.price_at_purchase,
  oi.created_at as item_created_at,
  o.customer_name,
  o.phone,
  o.address,
  o.status,
  o.payment_method,
  o.created_at as order_created_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id;

CREATE VIEW v_customer_orders_summary AS
SELECT 
  o.customer_name,
  o.phone,
  COUNT(DISTINCT o.order_id) as orders_count,
  COUNT(oi.id) as total_items,
  SUM(oi.price_at_purchase * oi.quantity) as total_amount,
  MIN(o.created_at) as first_order,
  MAX(o.created_at) as last_order,
  json_agg(
    json_build_object(
      'item_name', oi.item_name,
      'quantity', oi.quantity,
      'price', oi.price_at_purchase
    )
  ) as items_breakdown
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.customer_name, o.phone;

COMMIT;
