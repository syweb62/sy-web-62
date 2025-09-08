-- Fix delivery charges based on payment method
-- Pickup orders should have 0 delivery charge, delivery orders should have proper charge

BEGIN;

-- Update delivery charges based on payment method
UPDATE orders 
SET 
  delivery_charge = CASE 
    WHEN payment_method = 'pickup' THEN 0
    ELSE 50
  END;

-- Recalculate total_amount = subtotal + vat + delivery_charge - discount
UPDATE orders 
SET total_amount = COALESCE(subtotal, 0) + COALESCE(vat, 0) + COALESCE(delivery_charge, 0) - COALESCE(discount, 0);

-- For orders where subtotal is null, calculate it from total_amount
UPDATE orders 
SET subtotal = total_amount - COALESCE(vat, 0) - COALESCE(delivery_charge, 0) + COALESCE(discount, 0)
WHERE subtotal IS NULL;

-- Ensure VAT is calculated (5% of subtotal)
UPDATE orders 
SET vat = ROUND((COALESCE(subtotal, 0) * 0.05)::numeric, 2)
WHERE vat IS NULL OR vat = 0;

-- Final total recalculation
UPDATE orders 
SET total_amount = COALESCE(subtotal, 0) + COALESCE(vat, 0) + COALESCE(delivery_charge, 0) - COALESCE(discount, 0);

COMMIT;

-- Verify the changes
SELECT 
  short_order_id,
  payment_method,
  subtotal,
  vat,
  delivery_charge,
  discount,
  total_amount,
  CASE 
    WHEN payment_method = 'pickup' THEN 'Should be 0'
    ELSE 'Should be 50'
  END as expected_delivery
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
