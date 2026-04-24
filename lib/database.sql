-- ==========================================
-- HARIVANSHI POSHAK SEVA - COMPLETE DATABASE
-- Supabase > SQL Editor mein PURA paste karo > Run
-- ==========================================

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  product TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT,
  pincode TEXT,
  special_note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_id TEXT,
  razorpay_order_id TEXT,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  order_count INTEGER DEFAULT 0,
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  product TEXT,
  order_id UUID REFERENCES orders(id),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRODUCTS TABLE (with images array)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  emoji TEXT DEFAULT '🥻',
  bg_gradient TEXT DEFAULT 'c1',
  badge TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 100,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add images column if table already exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- DEFAULT PRODUCTS
INSERT INTO products (name, description, category, price, original_price, sizes, emoji, bg_gradient, badge, is_active, images)
VALUES
('Radha Ji Lehenga Set', 'Beautiful handmade lehenga for Radha Ji', 'radha', 850, 1100, ARRAY['6 inch','8 inch','10 inch','12 inch','18 inch'], '🥻', 'c1', 'Bestseller', true, '{}'),
('Krishna Ji Pitambar Set', 'Divine pitambar and dhoti for Krishna Ji', 'krishna', 750, 950, ARRAY['6 inch','8 inch','10 inch','12 inch','18 inch'], '👑', 'c2', 'New', true, '{}'),
('Radha Krishna Jodi Set', 'Complete matching set for both', 'jodi', 1400, 1800, ARRAY['6 inch','8 inch','10 inch','12 inch','18 inch'], '💑', 'c3', 'Most Loved', true, '{}'),
('Janmashtami Special Set', 'Special festival collection', 'festival', 1200, 1600, ARRAY['6 inch','8 inch','10 inch','12 inch','18 inch'], '🌸', 'c4', null, true, '{}'),
('Shringar Complete Set', 'Complete shringar set', 'shringar', 650, 850, ARRAY['All Sizes'], '💎', 'c5', 'New', true, '{}'),
('Custom Order', 'Your design, we create it', 'custom', 800, null, ARRAY['Custom Size'], '✂️', 'c6', null, true, '{}')
ON CONFLICT DO NOTHING;

-- SAMPLE REVIEWS
INSERT INTO reviews (customer_name, customer_city, rating, review_text, product, is_approved)
VALUES
('Sunita Sharma', 'Indore, MP', 5, 'Beautiful outfit! Quality was excellent and packaging very safe.', 'Radha Ji Lehenga Set', true),
('Priya Gupta', 'Bhopal, MP', 5, 'Ordered for Janmashtami — arrived on time and dress was stunning!', 'Janmashtami Special Set', true),
('Meena Joshi', 'Jaipur, Rajasthan', 5, 'Custom order made exactly as I wanted. Very happy!', 'Custom Order', true)
ON CONFLICT DO NOTHING;

-- ROW LEVEL SECURITY
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Public read approved reviews" ON reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON reviews;
DROP POLICY IF EXISTS "Public read active products" ON products;
DROP POLICY IF EXISTS "Insert orders" ON orders;
DROP POLICY IF EXISTS "Select own orders" ON orders;
DROP POLICY IF EXISTS "Insert customers" ON customers;
DROP POLICY IF EXISTS "Select customers" ON customers;
DROP POLICY IF EXISTS "Update customers" ON customers;

-- CREATE POLICIES
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Select own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Select customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Update customers" ON customers FOR UPDATE USING (true);

-- AUTO UPDATE FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
-- Run this separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
