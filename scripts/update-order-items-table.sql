-- Update the order_items table to handle cart items properly
-- Add additional columns to store item details since cart items don't have real UUIDs

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS item_image TEXT;

-- Update the menu_item_id column to allow NULL values temporarily
-- since we're storing cart items that don't have real menu item UUIDs
ALTER TABLE order_items 
ALTER COLUMN menu_item_id DROP NOT NULL;

-- Add a comment to explain the structure
COMMENT ON TABLE order_items IS 'Order items table - menu_item_id can be NULL for cart items, use item_name, item_description, and item_image for cart item details';
