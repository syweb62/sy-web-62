-- Add user_id column to orders table for proper user linking
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Update existing orders to link them to users based on phone/email matching
-- This is a one-time migration to link existing orders
UPDATE orders 
SET user_id = profiles.id 
FROM profiles 
WHERE orders.phone_number = profiles.phone 
   OR orders.customer_name ILIKE '%' || profiles.email || '%';
