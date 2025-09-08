-- Fix delivery charges based on order type
-- Pickup orders should have 0 delivery charge
-- Delivery orders should have proper delivery charge

-- First, let's see what we're working with
DO $$
BEGIN
    RAISE NOTICE 'Current order types and payment methods:';
END $$;

-- Update delivery charges based on payment method
-- Pickup orders should have 0 delivery charge
UPDATE orders 
SET delivery_charge = 0
WHERE payment_method = 'pickup';

-- For delivery orders (cash/bkash), set appropriate delivery charge
-- Check if order qualifies for free delivery (subtotal >= 875)
UPDATE orders 
SET delivery_charge = CASE 
    WHEN payment_method IN ('cash', 'bkash') THEN
        CASE 
            WHEN (subtotal - COALESCE(discount, 0)) >= 875 THEN 0  -- Free delivery over 875
            ELSE 50  -- Standard delivery charge
        END
    ELSE 0  -- Default to 0 for any other cases
END
WHERE payment_method IN ('cash', 'bkash');

-- Update order_type column to match payment_method for consistency
UPDATE orders 
SET order_type = CASE 
    WHEN payment_method = 'pickup' THEN 'pickup'
    ELSE 'delivery'
END;

-- Recalculate total_amount to include proper delivery charges
UPDATE orders 
SET total_amount = COALESCE(subtotal, 0) + COALESCE(vat, 0) + COALESCE(delivery_charge, 0) - COALESCE(discount, 0);

-- Show summary of changes
DO $$
DECLARE
    pickup_count INTEGER;
    delivery_count INTEGER;
    free_delivery_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pickup_count FROM orders WHERE payment_method = 'pickup';
    SELECT COUNT(*) INTO delivery_count FROM orders WHERE payment_method IN ('cash', 'bkash') AND delivery_charge > 0;
    SELECT COUNT(*) INTO free_delivery_count FROM orders WHERE payment_method IN ('cash', 'bkash') AND delivery_charge = 0;
    
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Pickup orders (FREE delivery): %', pickup_count;
    RAISE NOTICE '- Delivery orders (charged): %', delivery_count;
    RAISE NOTICE '- Delivery orders (FREE - over 875 BDT): %', free_delivery_count;
END $$;
