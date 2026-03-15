-- ================================================
-- ÇOCUK BİLGİLERİ İÇİN AYRI TABLO OLUŞTUR
-- ================================================

-- Children tablosu oluştur
CREATE TABLE customer_children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  child_name TEXT NOT NULL,
  child_nationality TEXT NOT NULL DEFAULT 'Türkiye',
  child_birth_date DATE NOT NULL,
  child_order INTEGER NOT NULL, -- 1., 2., 3. çocuk için
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE customer_children ENABLE ROW LEVEL SECURITY;

-- Policy oluştur
CREATE POLICY "Allow authenticated users" ON customer_children FOR ALL USING (true);

-- Index oluştur
CREATE INDEX customer_children_customer_id_idx ON customer_children(customer_id);
CREATE INDEX customer_children_order_idx ON customer_children(child_order);

-- Customers tablosuna çocuk sayısı sütunu ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS children_count INTEGER NOT NULL DEFAULT 0;

-- Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('customers', 'customer_children')
ORDER BY table_name, ordinal_position;