-- Cocuk bilgilerini JSON olarak sakla
ALTER TABLE customers ADD COLUMN IF NOT EXISTS children_data JSONB DEFAULT '[]';