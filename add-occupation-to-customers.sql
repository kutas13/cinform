-- Customers tablosuna occupation_type ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation_type TEXT DEFAULT 'employee';

-- Turkish companies'dan occupation_type ve position_duty kaldir (opsiyonel)
-- ALTER TABLE turkish_companies DROP COLUMN IF EXISTS occupation_type;
-- ALTER TABLE turkish_companies DROP COLUMN IF EXISTS position_duty;