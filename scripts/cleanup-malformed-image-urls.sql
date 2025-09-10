-- Clean up malformed image URLs from menu_items table
-- This script removes URLs with malformed domains like .lic and other invalid formats

UPDATE menu_items 
SET image_url = NULL 
WHERE image_url IS NOT NULL 
AND (
  image_url LIKE '%.lic%' OR
  image_url LIKE '%undefined%' OR
  image_url LIKE '%null%' OR
  LENGTH(image_url) < 50 OR
  image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/public/%'
);

-- Show results
SELECT 
  COUNT(*) as total_items,
  COUNT(image_url) as items_with_images,
  COUNT(*) - COUNT(image_url) as items_without_images
FROM menu_items;
