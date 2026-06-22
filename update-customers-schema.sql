-- ================================================
-- CUSTOMERS TABLOSUNU TAMAMEN YENİDEN OLUŞTUR
-- ================================================

-- Eski tabloyu sil
DROP TABLE IF EXISTS customers CASCADE;

-- Yeni customers tablosu (4. ve 5. sayfa için)
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Temel bilgiler
  full_name TEXT NOT NULL,
  birth_city TEXT NOT NULL,
  birth_province TEXT NOT NULL,
  tc_number TEXT UNIQUE NOT NULL,
  marital_status TEXT NOT NULL CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Other')),
  passport_issue_place TEXT NOT NULL,
  
  -- İletişim bilgileri (5. sayfa için)
  home_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Eş bilgileri (sadece evli ise)
  spouse_name TEXT,
  spouse_birth_date DATE,
  spouse_birth_country TEXT,
  spouse_birth_city TEXT,
  
  -- Ebeveyn bilgileri (5. sayfa için)
  father_name TEXT NOT NULL,
  father_nationality TEXT NOT NULL DEFAULT 'Türkiye',
  father_birth_date DATE NOT NULL,
  mother_name TEXT NOT NULL,
  mother_nationality TEXT NOT NULL DEFAULT 'Türkiye',
  mother_birth_date DATE NOT NULL,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Basit policy
CREATE POLICY "Allow authenticated users" ON customers FOR ALL USING (true);

-- Index'ler
CREATE INDEX customers_created_by_idx ON customers(created_by);
CREATE INDEX customers_tc_number_idx ON customers(tc_number);
CREATE INDEX customers_created_at_idx ON customers(created_at);

-- Sonucu kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;