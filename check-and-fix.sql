-- ================================================
-- MEVCUT DURUMU KONTROL ET VE SADECE EKSİKLERİ EKLE
-- ================================================

-- Önce mevcut sütunları kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chinese_companies'
ORDER BY ordinal_position;

-- Boş değerleri kontrol et
SELECT id, company_name, contact_info, email, relationship_type 
FROM chinese_companies 
LIMIT 5;

-- Boş değerleri güncelle (varsa)
UPDATE chinese_companies SET 
  contact_info = COALESCE(NULLIF(contact_info, ''), phone)
WHERE contact_info = '' OR contact_info IS NULL;

UPDATE chinese_companies SET 
  email = COALESCE(NULLIF(email, ''), 'temp@company.com.cn')
WHERE email = '' OR email IS NULL;

UPDATE chinese_companies SET 
  relationship_type = COALESCE(NULLIF(relationship_type, ''), 'Business partnership')
WHERE relationship_type = '' OR relationship_type IS NULL;

-- Tekrar kontrol et
SELECT id, company_name, contact_info, email, relationship_type 
FROM chinese_companies 
LIMIT 5;