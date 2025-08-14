-- Sample Data Insertion Script
-- Run this after the main setup script to populate with sample data

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available) VALUES
('Salmon Sashimi', 'Fresh Atlantic salmon, thinly sliced', 18.99, 'Sashimi', '/placeholder.svg?height=300&width=400&text=Salmon+Sashimi', true),
('Tuna Sashimi', 'Premium bluefin tuna, expertly cut', 22.99, 'Sashimi', '/placeholder.svg?height=300&width=400&text=Tuna+Sashimi', true),
('California Roll', 'Crab, avocado, cucumber with sesame seeds', 12.99, 'Sushi Rolls', '/placeholder.svg?height=300&width=400&text=California+Roll', true),
('Dragon Roll', 'Eel, cucumber topped with avocado and eel sauce', 16.99, 'Sushi Rolls', '/placeholder.svg?height=300&width=400&text=Dragon+Roll', true),
('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 15.99, 'Teriyaki', '/placeholder.svg?height=300&width=400&text=Chicken+Teriyaki', true),
('Beef Teriyaki', 'Tender beef with teriyaki sauce and vegetables', 19.99, 'Teriyaki', '/placeholder.svg?height=300&width=400&text=Beef+Teriyaki', true),
('Chicken Yakitori', 'Grilled chicken skewers with tare sauce', 8.99, 'Yakitori', '/placeholder.svg?height=300&width=400&text=Chicken+Yakitori', true),
('Beef Yakitori', 'Premium beef skewers with special marinade', 12.99, 'Yakitori', '/placeholder.svg?height=300&width=400&text=Beef+Yakitori', true),
('Miso Soup', 'Traditional soybean paste soup with tofu and seaweed', 4.99, 'Soups', '/placeholder.svg?height=300&width=400&text=Miso+Soup', true),
('Green Tea Ice Cream', 'Creamy matcha-flavored ice cream', 6.99, 'Desserts', '/placeholder.svg?height=300&width=400&text=Green+Tea+Ice+Cream', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample social media links
INSERT INTO public.social_media_links (platform_name, link, button_type, display_order) VALUES
('Instagram', 'https://instagram.com/sushiyaki', 'social', 1),
('Facebook', 'https://facebook.com/sushiyaki', 'social', 2),
('Twitter', 'https://twitter.com/sushiyaki', 'social', 3),
('WhatsApp', 'https://wa.me/1234567890', 'contact', 4)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully!';
    RAISE NOTICE 'Added 10 menu items and 4 social media links';
END $$;
