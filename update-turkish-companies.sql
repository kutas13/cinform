-- ================================================
-- TURKISH_COMPANIES TABLOSUNU GÜNCELLEME  
-- ================================================

-- Eski tabloyu sil ve yeniden oluştur (veri yoksa güvenli)
DROP TABLE IF EXISTS turkish_companies CASCADE;

-- Yeni tablo yapısı
CREATE TABLE turkish_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  occupation_type TEXT NOT NULL CHECK (occupation_type IN ('owner', 'employee')),
  work_start_year INTEGER NOT NULL,
  work_start_month INTEGER NOT NULL CHECK (work_start_month BETWEEN 1 AND 12),
  work_end_year INTEGER,
  work_end_month INTEGER CHECK (work_end_month BETWEEN 1 AND 12),
  manager_name TEXT NOT NULL,
  position_duty TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE turkish_companies ENABLE ROW LEVEL SECURITY;

-- Policy'leri oluştur
CREATE POLICY "Users can view their own turkish companies" ON turkish_companies 
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own turkish companies" ON turkish_companies 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own turkish companies" ON turkish_companies 
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own turkish companies" ON turkish_companies 
  FOR DELETE USING (auth.uid() = created_by);

-- Index'leri ekle
CREATE INDEX turkish_companies_created_by_idx ON turkish_companies(created_by);
CREATE INDEX turkish_companies_created_at_idx ON turkish_companies(created_at);

-- Sonucu kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'turkish_companies'
ORDER BY ordinal_position;