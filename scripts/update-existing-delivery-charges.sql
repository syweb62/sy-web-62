-- Update existing orders with realistic delivery charges
-- This script adds delivery charges to orders that currently have 0 or NULL delivery_charge

UPDATE orders 
SET delivery_charge = 50.00
WHERE delivery_charge IS NULL OR delivery_charge = 0;

-- Update the total_amount to include the delivery charge
UPDATE orders 
SET total_amount = subtotal + COALESCE(vat, 0) - COALESCE(discount, 0) + delivery_charge
WHERE delivery_charge = 50.00;

-- Verify the updates
SELECT 
  short_order_id,
  customer_name,
  subtotal,
  vat,
  discount,
  delivery_charge,
  total_amount,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
