-- Eski tek isim sutunlarini kaldir, yeni ad/soyad sutunlari ekle

-- Baba
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_last_name TEXT;

-- Anne  
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_last_name TEXT;

-- Es
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_last_name TEXT;

-- Eski sutunlari kaldir (artik kullanilmiyor)
ALTER TABLE customers DROP COLUMN IF EXISTS father_name;
ALTER TABLE customers DROP COLUMN IF EXISTS mother_name;
ALTER TABLE customers DROP COLUMN IF EXISTS spouse_name;