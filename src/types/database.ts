export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
        }
      }
      chinese_companies: {
        Row: {
          id: string
          company_name: string
          address: string
          city: string
          phone: string
          inviter_name: string
          inviter_position: string
          contact_info: string
          email: string
          relationship_type: string
          invitation_file_path: string | null
          invitation_file_name: string | null
          business_license_file_path: string | null
          business_license_file_name: string | null
          id_card_file_path: string | null
          id_card_file_name: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          address: string
          city: string
          phone: string
          inviter_name: string
          inviter_position: string
          contact_info: string
          email: string
          relationship_type?: string
          invitation_file_path?: string | null
          invitation_file_name?: string | null
          business_license_file_path?: string | null
          business_license_file_name?: string | null
          id_card_file_path?: string | null
          id_card_file_name?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          address?: string
          city?: string
          phone?: string
          inviter_name?: string
          inviter_position?: string
          contact_info?: string
          email?: string
          relationship_type?: string
          invitation_file_path?: string | null
          invitation_file_name?: string | null
          business_license_file_path?: string | null
          business_license_file_name?: string | null
          id_card_file_path?: string | null
          id_card_file_name?: string | null
          created_by?: string
          created_at?: string
        }
      }
      turkish_companies: {
        Row: {
          id: string
          company_name: string
          address: string
          phone: string
          occupation_type: 'owner' | 'employee'
          work_start_year: number
          work_start_month: number
          work_end_year: number | null
          work_end_month: number | null
          manager_name: string
          position_duty: string
          stamped_paper_file_path: string | null
          stamped_paper_file_name: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          address: string
          phone: string
          occupation_type: 'owner' | 'employee'
          work_start_year: number
          work_start_month: number
          work_end_year?: number | null
          work_end_month?: number | null
          manager_name: string
          position_duty: string
          stamped_paper_file_path?: string | null
          stamped_paper_file_name?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          address?: string
          phone?: string
          occupation_type?: 'owner' | 'employee'
          work_start_year?: number
          work_start_month?: number
          work_end_year?: number | null
          work_end_month?: number | null
          manager_name?: string
          position_duty?: string
          stamped_paper_file_path?: string | null
          stamped_paper_file_name?: string | null
          created_by?: string
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          full_name: string
          birth_city: string
          birth_province: string
          tc_number: string
          marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
          passport_issue_place: string
          home_address: string
          phone_number: string
          email: string
          spouse_name: string | null
          spouse_birth_date: string | null
          spouse_birth_country: string | null
          spouse_birth_city: string | null
          father_name: string
          father_nationality: string
          father_birth_date: string
          mother_name: string
          mother_nationality: string
          mother_birth_date: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          birth_city: string
          birth_province: string
          tc_number: string
          marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
          passport_issue_place: string
          home_address: string
          phone_number: string
          email: string
          spouse_name?: string | null
          spouse_birth_date?: string | null
          spouse_birth_country?: string | null
          spouse_birth_city?: string | null
          father_name: string
          father_nationality?: string
          father_birth_date: string
          mother_name: string
          mother_nationality?: string
          mother_birth_date: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          birth_city?: string
          birth_province?: string
          tc_number?: string
          marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
          passport_issue_place?: string
          home_address?: string
          phone_number?: string
          email?: string
          spouse_name?: string | null
          spouse_birth_date?: string | null
          spouse_birth_country?: string | null
          spouse_birth_city?: string | null
          father_name?: string
          father_nationality?: string
          father_birth_date?: string
          mother_name?: string
          mother_nationality?: string
          mother_birth_date?: string
          created_by?: string
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          entity_type: 'customer' | 'chinese_company' | 'turkish_company'
          entity_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'customer' | 'chinese_company' | 'turkish_company'
          entity_id: string
          content: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'customer' | 'chinese_company' | 'turkish_company'
          entity_id?: string
          content?: string
          created_by?: string
          created_at?: string
        }
      }
      yunan_customers: {
        Row: {
          id: string
          full_name: string
          tc_number: string
          appointment_date: string
          choice_index: number
          status: 'pending' | 'done' | 'error'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          tc_number: string
          appointment_date: string
          choice_index?: number
          status?: 'pending' | 'done' | 'error'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          tc_number?: string
          appointment_date?: string
          choice_index?: number
          status?: 'pending' | 'done' | 'error'
          created_by?: string
          created_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          customer_id: string
          chinese_company_id: string
          turkish_company_id: string
          travel_name: string | null
          travel_start_date: string
          travel_end_date: string
          visa_type: string
          visa_validity_months: number
          max_duration_days: number
          entries_type: 'Single' | 'Double' | 'Multiple'
          access_token: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          chinese_company_id: string
          turkish_company_id: string
          travel_name?: string | null
          travel_start_date: string
          travel_end_date: string
          visa_type: string
          visa_validity_months: number
          max_duration_days: number
          entries_type: 'Single' | 'Double' | 'Multiple'
          access_token: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          chinese_company_id?: string
          turkish_company_id?: string
          travel_name?: string | null
          travel_start_date?: string
          travel_end_date?: string
          visa_type?: string
          visa_validity_months?: number
          max_duration_days?: number
          entries_type?: 'Single' | 'Double' | 'Multiple'
          access_token?: string
          created_by?: string
          created_at?: string
        }
      }
    }
  }
}