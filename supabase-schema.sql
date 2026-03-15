-- ================================================
-- FOX VİZE PANEL - SUPABASE DATABASE SCHEMA
-- ================================================

-- Enable the "uuid-ossp" extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ================================================
-- CHINESE COMPANIES TABLE
-- ================================================

CREATE TABLE chinese_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  inviter_name TEXT NOT NULL,
  inviter_position TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'Business partnership',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chinese_companies ENABLE ROW LEVEL SECURITY;

-- Chinese companies policies
CREATE POLICY "Users can view their own chinese companies" ON chinese_companies
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own chinese companies" ON chinese_companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chinese companies" ON chinese_companies
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own chinese companies" ON chinese_companies
  FOR DELETE USING (auth.uid() = created_by);

-- ================================================
-- TURKISH COMPANIES TABLE
-- ================================================

CREATE TABLE turkish_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  occupation_type TEXT NOT NULL CHECK (occupation_type IN ('owner', 'employee')),
  work_start_year INTEGER NOT NULL,
  work_start_month INTEGER NOT NULL CHECK (work_start_month BETWEEN 1 AND 12),
  work_end_year INTEGER,
  work_end_month INTEGER CHECK (work_end_month BETWEEN 1 AND 12),
  manager_name TEXT NOT NULL,
  position_duty TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE turkish_companies ENABLE ROW LEVEL SECURITY;

-- Turkish companies policies
CREATE POLICY "Users can view their own turkish companies" ON turkish_companies
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own turkish companies" ON turkish_companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own turkish companies" ON turkish_companies
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own turkish companies" ON turkish_companies
  FOR DELETE USING (auth.uid() = created_by);

-- ================================================
-- CUSTOMERS TABLE
-- ================================================

CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_city TEXT NOT NULL,
  birth_province TEXT NOT NULL,
  tc_number TEXT UNIQUE NOT NULL,
  marital_status TEXT NOT NULL CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Other')),
  passport_issue_place TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view their own customers" ON customers
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own customers" ON customers
  FOR DELETE USING (auth.uid() = created_by);

-- ================================================
-- FORMS TABLE
-- ================================================

CREATE TABLE forms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  chinese_company_id UUID REFERENCES chinese_companies(id) ON DELETE CASCADE NOT NULL,
  turkish_company_id UUID REFERENCES turkish_companies(id) ON DELETE CASCADE NOT NULL,
  travel_start_date DATE NOT NULL,
  travel_end_date DATE NOT NULL,
  visa_type TEXT NOT NULL,
  visa_validity_months INTEGER NOT NULL,
  max_duration_days INTEGER NOT NULL,
  entries_type TEXT NOT NULL CHECK (entries_type IN ('Single', 'Double', 'Multiple')),
  access_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Forms policies  
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = created_by);

-- Public access policy for API (by access_token)
CREATE POLICY "Public read access via access_token" ON forms
  FOR SELECT USING (access_token IS NOT NULL);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Profiles
CREATE INDEX profiles_email_idx ON profiles(email);

-- Chinese companies
CREATE INDEX chinese_companies_created_by_idx ON chinese_companies(created_by);
CREATE INDEX chinese_companies_created_at_idx ON chinese_companies(created_at);

-- Turkish companies  
CREATE INDEX turkish_companies_created_by_idx ON turkish_companies(created_by);
CREATE INDEX turkish_companies_created_at_idx ON turkish_companies(created_at);

-- Customers
CREATE INDEX customers_created_by_idx ON customers(created_by);
CREATE INDEX customers_passport_number_idx ON customers(passport_number);
CREATE INDEX customers_tc_number_idx ON customers(tc_number);
CREATE INDEX customers_created_at_idx ON customers(created_at);

-- Forms
CREATE INDEX forms_created_by_idx ON forms(created_by);
CREATE INDEX forms_access_token_idx ON forms(access_token);
CREATE INDEX forms_customer_id_idx ON forms(customer_id);
CREATE INDEX forms_chinese_company_id_idx ON forms(chinese_company_id);
CREATE INDEX forms_turkish_company_id_idx ON forms(turkish_company_id);
CREATE INDEX forms_created_at_idx ON forms(created_at);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to generate secure access tokens
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'fv_' || encode(gen_random_bytes(32), 'hex') || '_' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SAMPLE DATA (OPTIONAL)
-- ================================================

-- Sample data will be added after user registration
-- These are just examples for reference:

/*
-- Example Chinese company (add after creating your first user):
INSERT INTO chinese_companies (company_name, address, city, phone, inviter_name, inviter_position, created_by) 
VALUES (
  'Beijing International Trading Co., Ltd.',
  '100 Wangfujing Street, Dongcheng District',
  'Beijing', 
  '+86 10 1234 5678',
  'Li Wei',
  'General Manager',
  'YOUR_USER_ID_HERE'
);

-- Example Turkish company:
INSERT INTO turkish_companies (company_name, address, phone, position, sponsor, created_by)
VALUES (
  'İstanbul İthalat Export A.Ş.',
  'Ataşehir, İstanbul',
  '+90 212 123 45 67', 
  'CEO',
  'Ahmet Yılmaz',
  'YOUR_USER_ID_HERE'
);
*/

-- Schema setup is complete!