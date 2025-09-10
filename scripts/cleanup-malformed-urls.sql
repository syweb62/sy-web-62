-- Clean up malformed image URLs from menu_items table
UPDATE menu_items 
SET image_url = NULL 
WHERE image_url IS NOT NULL 
AND (
  image_url LIKE '%.lic%' 
  OR image_url NOT LIKE '%supabase.co%'
  OR image_url = ''
);

-- Show affected rows
SELECT COUNT(*) as cleaned_rows FROM menu_items WHERE image_url IS NULL;
