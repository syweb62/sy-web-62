-- Database cleanup script to remove old/unused records
-- Note: VACUUM commands must be run outside of transaction blocks

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

-- Update statistics (can run in transaction)
ANALYZE menu_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE profiles;
ANALYZE reservations;
