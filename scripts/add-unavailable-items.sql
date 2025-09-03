-- Add some unavailable menu items for testing the hide unavailable functionality

-- Update some existing items to be unavailable
UPDATE menu_items 
SET available = false 
WHERE name IN ('Dragon Roll', 'Tempura Shrimp', 'Miso Soup');

-- Insert some new unavailable items
INSERT INTO menu_items (menu_id, name, description, price, category, available, created_at)
VALUES 
  (gen_random_uuid(), 'Seasonal Special Roll', 'Limited time seasonal ingredients - Currently unavailable', 18.99, 'Sushi Rolls', false, now()),
  (gen_random_uuid(), 'Premium Wagyu Beef', 'High-grade wagyu beef - Out of stock', 45.99, 'Main Course', false, now()),
  (gen_random_uuid(), 'Special Dessert', 'Chef''s special dessert - Temporarily unavailable', 12.99, 'Desserts', false, now());
