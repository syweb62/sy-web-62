-- Adding DROP FUNCTION statement to resolve existing function conflict
-- Drop existing function if it exists to avoid return type conflicts
DROP FUNCTION IF EXISTS get_order_by_identifier(text);

-- Creating RPC function for order tracking by UUID or short ID
CREATE OR REPLACE FUNCTION get_order_by_identifier(identifier text)
RETURNS TABLE (
  order_id uuid,
  short_order_id text,
  customer_name text,
  phone_number text,
  address text,
  total_amount numeric,
  discount numeric,
  status text,
  payment_method text,
  created_at timestamp with time zone,
  order_items jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to find by full UUID first
  IF identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT 
      o.order_id,
      UPPER(RIGHT(o.order_id::text, 8)) as short_order_id,
      o.customer_name,
      o.phone_number,
      o.address,
      o.total_amount,
      o.discount,
      o.status,
      o.payment_method,
      o.created_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) FILTER (WHERE oi.order_id IS NOT NULL),
        '[]'::jsonb
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_id = identifier::uuid
    GROUP BY o.order_id, o.customer_name, o.phone_number, o.address, o.total_amount, o.discount, o.status, o.payment_method, o.created_at;
  ELSE
    -- Try to find by short order ID (last 8 characters of UUID)
    RETURN QUERY
    SELECT 
      o.order_id,
      UPPER(RIGHT(o.order_id::text, 8)) as short_order_id,
      o.customer_name,
      o.phone_number,
      o.address,
      o.total_amount,
      o.discount,
      o.status,
      o.payment_method,
      o.created_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) FILTER (WHERE oi.order_id IS NOT NULL),
        '[]'::jsonb
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE UPPER(RIGHT(o.order_id::text, 8)) = UPPER(identifier)
    GROUP BY o.order_id, o.customer_name, o.phone_number, o.address, o.total_amount, o.discount, o.status, o.payment_method, o.created_at;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_order_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_by_identifier(text) TO anon;
