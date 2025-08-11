-- Database Optimization and Dhaka Timezone Configuration
-- This script sets up proper timezone handling and optimizes database performance

-- Removed ALTER DATABASE and ALTER SYSTEM commands that cannot run in transaction blocks
-- Set session timezone to Asia/Dhaka (UTC+6) instead
SET timezone = 'Asia/Dhaka';

-- Create or update timezone configuration function
CREATE OR REPLACE FUNCTION set_dhaka_timezone()
RETURNS void AS $$
BEGIN
  -- Set session timezone to Dhaka
  SET timezone = 'Asia/Dhaka';
  
  -- Log the timezone change
  RAISE NOTICE 'Database timezone set to Asia/Dhaka (UTC+6)';
END;
$$ LANGUAGE plpgsql;

-- Execute timezone setup
SELECT set_dhaka_timezone();

-- Create indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date, time);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create function to get current Dhaka time
CREATE OR REPLACE FUNCTION get_dhaka_time()
RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'Asia/Dhaka';
END;
$$ LANGUAGE plpgsql;

-- Create function to format timestamps in Dhaka timezone
CREATE OR REPLACE FUNCTION format_dhaka_time(input_time timestamptz)
RETURNS text AS $$
BEGIN
  RETURN to_char(input_time AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- Removed ALTER SYSTEM and pg_reload_conf() commands that cause transaction errors
-- These need to be run separately outside of transaction blocks

-- Verify current session timezone setting
SELECT 
  current_setting('timezone') as current_timezone,
  'Session timezone set to' as message;

-- Show current time in different formats
SELECT 
  'Current UTC time' as label,
  NOW() as utc_time,
  'Current Dhaka time' as dhaka_label,
  NOW() AT TIME ZONE 'Asia/Dhaka' as dhaka_time,
  'Formatted Dhaka time' as formatted_label,
  format_dhaka_time(NOW()) as formatted_dhaka_time;
