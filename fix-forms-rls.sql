-- ================================================
-- FORMS TABLOSU RLS DÜZELTME
-- ================================================

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON forms;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON forms;
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;
DROP POLICY IF EXISTS "Public read access via access_token" ON forms;
DROP POLICY IF EXISTS "Allow all authenticated" ON forms;
DROP POLICY IF EXISTS "Allow all" ON forms;

-- Basit policy: Herkes okuyabilir (API için), auth olan herkes yazabilir
CREATE POLICY "Allow all operations" ON forms FOR ALL USING (true);

-- Aynısını diğer tablolar için de yap
DROP POLICY IF EXISTS "Allow all authenticated" ON customers;
DROP POLICY IF EXISTS "Allow all" ON customers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all authenticated" ON chinese_companies;
DROP POLICY IF EXISTS "Allow all" ON chinese_companies;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON chinese_companies;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON chinese_companies;
CREATE POLICY "Allow all operations" ON chinese_companies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all authenticated" ON turkish_companies;
DROP POLICY IF EXISTS "Allow all" ON turkish_companies;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON turkish_companies;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON turkish_companies;
CREATE POLICY "Allow all operations" ON turkish_companies FOR ALL USING (true);

-- Kontrol et
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';