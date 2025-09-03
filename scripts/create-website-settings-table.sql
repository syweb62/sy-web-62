-- Create website_settings table for storing customizable website content
CREATE TABLE IF NOT EXISTS website_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  restaurant_settings JSONB NOT NULL DEFAULT '{}',
  delivery_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read and update settings
CREATE POLICY "Allow authenticated users to manage website settings" ON website_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default settings if none exist
INSERT INTO website_settings (id, restaurant_settings, delivery_settings)
VALUES (
  1,
  '{
    "name": "Sushi Yaki",
    "description": "Authentic Japanese Restaurant serving fresh sushi and traditional dishes",
    "phone": "+880 1712-345678",
    "email": "info@sushiyaki.com",
    "address": "123 Main Street, Dhaka, Bangladesh",
    "website": "https://sushiyaki.com",
    "openingHours": "12:00 PM - 11:00 PM (Everyday)",
    "deliveryArea": "3KM to Mohammadpur",
    "socialLinks": {
      "facebook": "https://facebook.com/sushiyaki",
      "instagram": "https://instagram.com/sushiyaki",
      "twitter": "https://twitter.com/sushiyaki"
    },
    "liveChatLink": "https://tawk.to/sushiyaki",
    "homePageHeadline": "Authentic Japanese Cuisine",
    "homePageSubtext": "Experience the finest sushi and traditional Japanese dishes"
  }',
  '{
    "vatRate": 15,
    "vatEnabled": true,
    "discountEnabled": true,
    "discountPercentage": 15,
    "discountHeadline": "Special 15% Off on All Orders!",
    "newOrderSound": true,
    "newReservationSound": true,
    "soundVolume": 80
  }'
)
ON CONFLICT (id) DO NOTHING;
