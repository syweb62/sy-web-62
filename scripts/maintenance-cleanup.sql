-- Database Maintenance and Cleanup Script
-- Run this periodically to maintain database performance

-- Clean up old sessions (older than 30 days)
DELETE FROM auth.sessions 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean up expired password reset tokens
DELETE FROM auth.users 
WHERE email_confirmed_at IS NULL 
AND created_at < NOW() - INTERVAL '7 days';

-- Clean up old order items for cancelled orders
DELETE FROM order_items 
WHERE order_id IN (
  SELECT order_id FROM orders 
  WHERE status = 'cancelled' 
  AND created_at < NOW() - INTERVAL '90 days'
);

-- Clean up old cancelled orders
DELETE FROM orders 
WHERE status = 'cancelled' 
AND created_at < NOW() - INTERVAL '90 days';

-- Update table statistics
ANALYZE menu_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE profiles;
ANALYZE reservations;
ANALYZE social_media_links;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'Removed old sessions, expired tokens, and cancelled orders';
    RAISE NOTICE 'Updated table statistics for better query performance';
END $$;
