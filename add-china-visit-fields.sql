-- Form tablosuna Cin ziyaret bilgilerini ekle
ALTER TABLE forms ADD COLUMN IF NOT EXISTS been_to_china BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS china_visa_number TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS china_visa_year INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS china_visa_month INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fingerprint_given BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fingerprint_date TEXT;