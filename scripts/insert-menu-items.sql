-- Insert sample menu items to fix empty menu issue
INSERT INTO public.menu_items (name, description, price, category, available, created_at) VALUES
('Salmon Sashimi', 'Fresh Atlantic salmon, thinly sliced and served with wasabi and soy sauce', 18.99, 'Sashimi', true, NOW()),
('Tuna Sashimi', 'Premium bluefin tuna, expertly cut for the perfect texture', 22.99, 'Sashimi', true, NOW()),
('California Roll', 'Crab, avocado, and cucumber wrapped in seasoned rice and nori', 12.99, 'Sushi Rolls', true, NOW()),
('Spicy Tuna Roll', 'Fresh tuna mixed with spicy mayo and cucumber', 14.99, 'Sushi Rolls', true, NOW()),
('Dragon Roll', 'Eel and cucumber topped with avocado and eel sauce', 16.99, 'Sushi Rolls', true, NOW()),
('Chicken Teriyaki', 'Grilled chicken glazed with homemade teriyaki sauce', 15.99, 'Main Course', true, NOW()),
('Beef Yakitori', 'Skewered beef grilled to perfection with tare sauce', 17.99, 'Main Course', true, NOW()),
('Miso Soup', 'Traditional soybean paste soup with tofu and seaweed', 4.99, 'Appetizer', true, NOW()),
('Gyoza', 'Pan-fried pork dumplings served with dipping sauce', 8.99, 'Appetizer', true, NOW()),
('Green Tea Ice Cream', 'Creamy matcha-flavored ice cream', 6.99, 'Desserts', true, NOW())
ON CONFLICT (menu_id) DO NOTHING;
