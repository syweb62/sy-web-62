-- Add missing columns to orders table for proper order breakdown display
-- These columns will store the calculated values for subtotal, VAT, and delivery charge

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;

-- Update existing orders to populate the new columns based on total_amount
-- For existing orders, we'll calculate approximate values
UPDATE orders 
SET 
  subtotal = CASE 
    WHEN total_amount > 0 THEN total_amount - COALESCE(discount, 0) - (total_amount * 0.05) - 50
    ELSE 0 
  END,
  vat = CASE 
    WHEN total_amount > 0 THEN total_amount * 0.05 
    ELSE 0 
  END,
  delivery_charge = CASE 
    WHEN total_amount > 50 THEN 50 
    ELSE 0 
  END
WHERE subtotal IS NULL OR vat IS NULL OR delivery_charge IS NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN orders.subtotal IS 'Subtotal amount before taxes and delivery';
COMMENT ON COLUMN orders.vat IS 'VAT/tax amount (typically 5%)';
COMMENT ON COLUMN orders.delivery_charge IS 'Delivery charge amount';
