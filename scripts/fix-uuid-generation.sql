-- Fix UUID Auto-Generation Script
-- Ensures all tables have proper UUID generation configured

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify and fix UUID defaults for all tables
-- This script is safe to run multiple times

-- Fix menu_items table
DO $$
BEGIN
    -- Check if default is missing and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE public.menu_items 
        ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Fixed UUID default for menu_items.id';
    END IF;
END $$;

-- Fix orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE public.orders 
        ALTER COLUMN order_id SET DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Fixed UUID default for orders.order_id';
    END IF;
END $$;

-- Fix order_items table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE public.order_items 
        ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Fixed UUID default for order_items.id';
    END IF;
END $$;

-- Fix reservations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE public.reservations 
        ALTER COLUMN reservation_id SET DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Fixed UUID default for reservations.reservation_id';
    END IF;
END $$;

-- Fix social_media_links table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_media_links' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE public.social_media_links 
        ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Fixed UUID default for social_media_links.id';
    END IF;
END $$;

-- Test UUID generation by creating a test record and checking if UUID is generated
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    -- Test with menu_items table
    INSERT INTO public.menu_items (name, description, price, category) 
    VALUES ('Test Item', 'Test Description', 1.00, 'Test') 
    RETURNING id INTO test_uuid;
    
    IF test_uuid IS NOT NULL THEN
        RAISE NOTICE 'UUID generation test PASSED: Generated UUID %', test_uuid;
        -- Clean up test record
        DELETE FROM public.menu_items WHERE id = test_uuid;
    ELSE
        RAISE NOTICE 'UUID generation test FAILED: No UUID generated';
    END IF;
END $$;

-- Display current UUID defaults for verification
SELECT 
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name IN ('id', 'order_id', 'reservation_id')
AND table_name IN ('menu_items', 'orders', 'order_items', 'reservations', 'social_media_links')
ORDER BY table_name, column_name;

DO $$ 
BEGIN 
    RAISE NOTICE 'UUID auto-generation fix completed successfully!'; 
END $$;
