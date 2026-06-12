-- Yunan Randevu Musterileri tablosu
CREATE TABLE IF NOT EXISTS yunan_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  tc_number VARCHAR(11) NOT NULL,
  appointment_date DATE NOT NULL,
  choice_index INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'error')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) acilsin
ALTER TABLE yunan_customers ENABLE ROW LEVEL SECURITY;

-- Kullanicilar kendi kayitlarini gorebilir
CREATE POLICY "yunan_customers_select" ON yunan_customers
  FOR SELECT USING (auth.uid() = created_by);

-- Kullanicilar kendi kayitlarini olusturabilir
CREATE POLICY "yunan_customers_insert" ON yunan_customers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanicilar kendi kayitlarini guncelleyebilir
CREATE POLICY "yunan_customers_update" ON yunan_customers
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanicilar kendi kayitlarini silebilir
CREATE POLICY "yunan_customers_delete" ON yunan_customers
  FOR DELETE USING (auth.uid() = created_by);

-- Index: tarih ve duruma gore hizli sorgulama
CREATE INDEX IF NOT EXISTS idx_yunan_customers_date ON yunan_customers(appointment_date);
CREATE INDEX IF NOT EXISTS idx_yunan_customers_status ON yunan_customers(status);
CREATE INDEX IF NOT EXISTS idx_yunan_customers_created_by ON yunan_customers(created_by);
