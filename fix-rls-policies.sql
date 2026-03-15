-- ================================================
-- RLS POLICY SORUNUNU DÜZELT
-- ================================================

-- Turkish companies policy'lerini düzelt
DROP POLICY IF EXISTS "Users can view their own turkish companies" ON turkish_companies;
DROP POLICY IF EXISTS "Users can insert their own turkish companies" ON turkish_companies;
DROP POLICY IF EXISTS "Users can update their own turkish companies" ON turkish_companies;
DROP POLICY IF EXISTS "Users can delete their own turkish companies" ON turkish_companies;

-- Yeni policy'ler (daha basit)
CREATE POLICY "Enable all operations for authenticated users" ON turkish_companies
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Customers için de aynı sorunu düzeltelim
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

CREATE POLICY "Enable all operations for authenticated users" ON customers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Chinese companies için de
DROP POLICY IF EXISTS "Users can view their own chinese companies" ON chinese_companies;
DROP POLICY IF EXISTS "Users can insert their own chinese companies" ON chinese_companies;
DROP POLICY IF EXISTS "Users can update their own chinese companies" ON chinese_companies;
DROP POLICY IF EXISTS "Users can delete their own chinese companies" ON chinese_companies;

CREATE POLICY "Enable all operations for authenticated users" ON chinese_companies
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Forms için de
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON forms;  
DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;
DROP POLICY IF EXISTS "Public read access via access_token" ON forms;

CREATE POLICY "Enable all operations for authenticated users" ON forms
  FOR ALL USING (auth.uid() IS NOT NULL);

-- API için public access (token bazlı)
CREATE POLICY "Public read access via access_token" ON forms
  FOR SELECT USING (access_token IS NOT NULL);

-- Kontrol et
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;