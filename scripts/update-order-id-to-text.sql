-- Update order_id column to support short text IDs instead of UUIDs
-- This allows shorter order IDs like "1205e", "14r84", "762v9"

-- First, check if we need to update the column type
DO $$
BEGIN
  -- Check if order_id is currently UUID type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'order_id' 
      AND data_type = 'uuid'
  ) THEN
    -- Drop the default UUID generation
    ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
    
    -- Change column type to text (can hold both UUIDs and short IDs)
    ALTER TABLE public.orders ALTER COLUMN order_id TYPE TEXT;
    
    -- Update foreign key in order_items table too
    ALTER TABLE public.order_items ALTER COLUMN order_id TYPE TEXT;
    
    RAISE NOTICE 'Updated order_id columns to support short text IDs';
  ELSE
    RAISE NOTICE 'order_id column already supports text format';
  END IF;
END $$;

-- Create index for better performance on text-based order_id
CREATE INDEX IF NOT EXISTS idx_orders_order_id_text ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_text ON public.order_items(order_id);
