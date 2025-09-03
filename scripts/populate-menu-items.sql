-- Creating script to populate menu items in the database
-- Clear existing menu items first
DELETE FROM menu_items;

-- Insert sample menu items with proper categories
INSERT INTO menu_items (menu_id, name, description, price, category, available, created_at) VALUES
-- Appetizers
(gen_random_uuid(), 'Edamame', 'Steamed young soybeans with sea salt', 6.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Gyoza', 'Pan-fried pork dumplings (6 pieces)', 8.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Agedashi Tofu', 'Lightly fried tofu in savory dashi broth', 7.99, 'Appetizer', true, now()),
(gen_random_uuid(), 'Chicken Karaage', 'Japanese-style fried chicken with spicy mayo', 9.99, 'Appetizer', true, now()),

-- Sashimi
(gen_random_uuid(), 'Salmon Sashimi', 'Fresh Atlantic salmon (5 pieces)', 12.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Tuna Sashimi', 'Premium yellowfin tuna (5 pieces)', 14.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Yellowtail Sashimi', 'Fresh yellowtail hamachi (5 pieces)', 13.99, 'Sashimi', true, now()),
(gen_random_uuid(), 'Sashimi Combo', 'Chef''s selection of 3 types (15 pieces)', 24.99, 'Sashimi', true, now()),

-- Sushi Rolls
(gen_random_uuid(), 'California Roll', 'Crab, avocado, cucumber with sesame seeds', 8.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Spicy Tuna Roll', 'Spicy tuna with cucumber and sriracha mayo', 9.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 14.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Rainbow Roll', 'California roll topped with assorted sashimi', 16.99, 'Sushi Rolls', true, now()),
(gen_random_uuid(), 'Philadelphia Roll', 'Salmon, cream cheese, cucumber', 10.99, 'Sushi Rolls', true, now()),

-- Main Course
(gen_random_uuid(), 'Chicken Teriyaki', 'Grilled chicken with teriyaki sauce and steamed rice', 16.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Beef Bulgogi', 'Korean-style marinated beef with vegetables', 19.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Salmon Teriyaki', 'Grilled salmon with teriyaki glaze and vegetables', 18.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Chirashi Bowl', 'Assorted sashimi over sushi rice', 22.99, 'Main Course', true, now()),
(gen_random_uuid(), 'Ramen Bowl', 'Rich tonkotsu broth with chashu pork and soft egg', 15.99, 'Main Course', true, now()),

-- Desserts
(gen_random_uuid(), 'Mochi Ice Cream', 'Sweet rice cake with ice cream (3 pieces)', 6.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Tempura Ice Cream', 'Fried ice cream with honey and whipped cream', 7.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Dorayaki', 'Pancake sandwich with sweet red bean filling', 5.99, 'Desserts', true, now()),
(gen_random_uuid(), 'Green Tea Cheesecake', 'Creamy matcha cheesecake with graham crust', 6.99, 'Desserts', true, now());
