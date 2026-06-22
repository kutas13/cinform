-- Turkish companies tablosundan gereksiz sutunlari kaldir
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS occupation_type;
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS position_duty;
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS work_start_year;
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS work_start_month;
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS work_end_year;
ALTER TABLE turkish_companies DROP COLUMN IF EXISTS work_end_month;

-- Customers tablosuna calisma bilgilerini ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation_type TEXT DEFAULT 'employee';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS work_start_year INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS work_start_month INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS work_end_year INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS work_end_month INTEGER;

-- Kontrol
SELECT column_name FROM information_schema.columns WHERE table_name = 'turkish_companies' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' ORDER BY ordinal_position;