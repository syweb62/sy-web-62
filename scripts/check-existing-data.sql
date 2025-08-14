-- Check what data already exists in your database
SELECT 'menu_items' as table_name, count(*) as record_count FROM public.menu_items
UNION ALL
SELECT 'orders' as table_name, count(*) as record_count FROM public.orders
UNION ALL
SELECT 'order_items' as table_name, count(*) as record_count FROM public.order_items
UNION ALL
SELECT 'reservations' as table_name, count(*) as record_count FROM public.reservations
UNION ALL
SELECT 'social_links' as table_name, count(*) as record_count FROM public.social_links
UNION ALL
SELECT 'profiles' as table_name, count(*) as record_count FROM public.profiles;

-- Check current timezone setting
SELECT current_setting('timezone') as current_timezone;
