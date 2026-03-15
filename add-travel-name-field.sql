-- Forms tablosuna seyahat bilgisi adı alanını ekle
ALTER TABLE forms ADD COLUMN IF NOT EXISTS travel_name TEXT;

-- travel_name için index (kayıtlı seyahatleri hızlı getirmek için)
CREATE INDEX IF NOT EXISTS forms_travel_name_idx ON forms(travel_name);
