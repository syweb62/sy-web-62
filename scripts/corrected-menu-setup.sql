-- Creating SQL script that matches actual database schema without image_url column
-- Clear existing menu items to avoid duplicates
DELETE FROM menu_items;

-- Insert menu items matching the actual table structure (no image_url column)
INSERT INTO menu_items (menu_id, name, description, price, category, available, created_at) VALUES
-- Appetizers
(gen_random_uuid(), 'Edamame', 'Steamed young soybeans with sea salt', 6.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Gyoza', 'Pan-fried pork dumplings with dipping sauce', 8.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Agedashi Tofu', 'Lightly fried tofu in savory dashi broth', 7.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Chicken Karaage', 'Japanese-style fried chicken with mayo', 9.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Takoyaki', 'Octopus balls with takoyaki sauce and bonito flakes', 10.99, 'Appetizer', true, now()),

-- Sashimi
(gen_random_uuid(), 'Salmon Sashimi', 'Fresh Atlantic salmon, 6 pieces', 14.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Tuna Sashimi', 'Premium bluefin tuna, 6 pieces', 16.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Yellowtail Sashimi', 'Fresh yellowtail, 6 pieces', 15.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Mixed Sashimi Platter', 'Chef''s selection of 12 pieces', 28.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Uni Sashimi', 'Premium sea urchin, 4 pieces', 22.99, 'Sashimi', true, now()),

-- Sushi Rolls
(gen_random_uuid(), 'California Roll', 'Crab, avocado, cucumber with sesame seeds', 8.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Spicy Tuna Roll', 'Spicy tuna with cucumber and sriracha mayo', 10.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Philadelphia Roll', 'Salmon, cream cheese, cucumber', 9.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 15.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Rainbow Roll', 'California roll topped with assorted sashimi', 16.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Spider Roll', 'Soft shell crab, avocado, cucumber, masago', 13.99, 'Sushi Rolls', true, now()),

-- Main Course
(gen_random_uuid(), 'Chicken Teriyaki', 'Grilled chicken with teriyaki sauce and steamed rice', 16.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Beef Teriyaki', 'Grilled beef with teriyaki sauce and steamed rice', 19.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Salmon Teriyaki', 'Grilled salmon with teriyaki sauce and steamed rice', 18.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Chicken Katsu', 'Breaded fried chicken cutlet with katsu sauce', 17.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Beef Udon', 'Thick wheat noodles in savory broth with sliced beef', 15.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Chirashi Bowl', 'Assorted sashimi over sushi rice', 22.99, 'Main Course', true, now()),

-- Desserts
(gen_random_uuid(), 'Mochi Ice Cream', 'Sweet rice cake filled with ice cream (3 pieces)', 7.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Tempura Ice Cream', 'Fried ice cream with honey and whipped cream', 8.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Dorayaki', 'Pancake sandwich filled with sweet red bean paste', 6.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Matcha Cheesecake', 'Japanese green tea flavored cheesecake', 8.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Taiyaki', 'Fish-shaped pastry filled with sweet red bean', 5.99, 'Desserts', true, now());
