-- ================================================
-- CHINESE_COMPANIES EKSIK SÜTUNLARINI EKLE
-- ================================================

-- RLS'i geçici kapat
ALTER TABLE chinese_companies DISABLE ROW LEVEL SECURITY;

-- Eksik sütunları ekle
ALTER TABLE chinese_companies ADD COLUMN IF NOT EXISTS contact_info TEXT DEFAULT '';
ALTER TABLE chinese_companies ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE chinese_companies ADD COLUMN IF NOT EXISTS relationship_type TEXT DEFAULT 'Business partnership';

-- Boş değerleri güncelle
UPDATE chinese_companies SET contact_info = phone WHERE contact_info = '';
UPDATE chinese_companies SET email = 'temp@company.com.cn' WHERE email = '';
UPDATE chinese_companies SET relationship_type = 'Business partnership' WHERE relationship_type = '';

-- NOT NULL yap
ALTER TABLE chinese_companies ALTER COLUMN contact_info SET NOT NULL;
ALTER TABLE chinese_companies ALTER COLUMN email SET NOT NULL;
ALTER TABLE chinese_companies ALTER COLUMN relationship_type SET NOT NULL;

-- RLS'i tekrar aç
ALTER TABLE chinese_companies ENABLE ROW LEVEL SECURITY;

-- Policy ekle
CREATE POLICY "Allow all authenticated" ON chinese_companies FOR ALL USING (true);

-- Sonucu kontrol et
\d chinese_companies;