-- Creating a demo order for testing the order management functionality
INSERT INTO orders (
  order_id,
  short_order_id,
  customer_name,
  phone,
  address,
  payment_method,
  status,
  subtotal,
  vat,
  delivery_charge,
  discount,
  total_price,
  message,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ORD-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  'John Doe',
  '+8801712345678',
  '123 Main Street, Dhaka, Bangladesh',
  'cash',
  'pending',
  450.00,
  67.50,
  50.00,
  0.00,
  567.50,
  'Please deliver quickly',
  NOW(),
  NOW()
);

-- Get the order_id for adding items
WITH new_order AS (
  SELECT order_id FROM orders WHERE customer_name = 'John Doe' ORDER BY created_at DESC LIMIT 1
)
INSERT INTO order_items (
  id,
  order_id,
  menu_item_id,
  item_name,
  item_description,
  quantity,
  item_price,
  price_at_purchase,
  created_at
) 
SELECT 
  gen_random_uuid(),
  new_order.order_id,
  gen_random_uuid(),
  'Dragon Roll',
  'Fresh salmon and avocado roll',
  2,
  200.00,
  200.00,
  NOW()
FROM new_order
UNION ALL
SELECT 
  gen_random_uuid(),
  new_order.order_id,
  gen_random_uuid(),
  'Miso Soup',
  'Traditional Japanese soup',
  1,
  50.00,
  50.00,
  NOW()
FROM new_order;
