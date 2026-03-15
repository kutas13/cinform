import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache',
  }

  try {
    const { token } = params
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Public Supabase client (no auth needed for API)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Form'u token ile bul
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('access_token', token)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Müşteriyi al
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', form.customer_id)
      .single()

    // Çinli şirketi al
    const { data: chinese_company } = await supabase
      .from('chinese_companies')
      .select('*')
      .eq('id', form.chinese_company_id)
      .single()

    // Türk şirketi al
    const { data: turkish_company } = await supabase
      .from('turkish_companies')
      .select('*')
      .eq('id', form.turkish_company_id)
      .single()

    if (!customer || !chinese_company || !turkish_company) {
      return NextResponse.json(
        { error: 'Related data not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Chrome Extension için response
    const response = {
      form_id: form.id,

      customer: {
        full_name: customer.full_name || '',
        birth_year: customer.birth_year || null,
        birth_city: customer.birth_city || '',
        birth_province: customer.birth_province || '',
        tc_number: customer.tc_number || '',
        marital_status: customer.marital_status || '',
        passport_issue_place: customer.passport_issue_place || '',
        occupation_type: customer.occupation_type || 'employee',
        work_start_year: customer.work_start_year || null,
        work_start_month: customer.work_start_month || null,
        work_end_year: customer.work_end_year || null,
        work_end_month: customer.work_end_month || null,
        home_address: customer.home_address || '',
        phone_number: customer.phone_number || '',
        email: customer.email || '',
        spouse_first_name: customer.spouse_first_name || null,
        spouse_last_name: customer.spouse_last_name || null,
        spouse_birth_date: customer.spouse_birth_date || null,
        spouse_birth_country: customer.spouse_birth_country || null,
        spouse_birth_city: customer.spouse_birth_city || null,
        father_first_name: customer.father_first_name || '',
        father_last_name: customer.father_last_name || '',
        father_nationality: customer.father_nationality || 'Türkiye',
        father_birth_date: customer.father_birth_date || null,
        mother_first_name: customer.mother_first_name || '',
        mother_last_name: customer.mother_last_name || '',
        mother_nationality: customer.mother_nationality || 'Türkiye',
        mother_birth_date: customer.mother_birth_date || null,
        children_count: customer.children_count || 0,
        children_data: customer.children_data || [],
      },

      chinese_company: {
        company_name: chinese_company.company_name || '',
        address: chinese_company.address || '',
        city: chinese_company.city || '',
        district: chinese_company.district || '',
        phone: chinese_company.phone || '',
        inviter_name: chinese_company.inviter_name || '',
        inviter_position: chinese_company.inviter_position || '',
        contact_info: chinese_company.contact_info || '',
        email: chinese_company.email || '',
        relationship_type: chinese_company.relationship_type || 'Business partnership',
      },

      turkish_company: {
        company_name: turkish_company.company_name || '',
        address: turkish_company.address || '',
        phone: turkish_company.phone || '',
        occupation_type: turkish_company.occupation_type || '',
        work_start_year: turkish_company.work_start_year || 2020,
        work_start_month: turkish_company.work_start_month || 1,
        work_end_year: turkish_company.work_end_year || null,
        work_end_month: turkish_company.work_end_month || null,
        manager_name: turkish_company.manager_name || '',
        position_duty: turkish_company.position_duty || '',
      },

      form: {
        travel_name: form.travel_name || null,
        travel_start_date: form.travel_start_date || '',
        travel_end_date: form.travel_end_date || '',
        visa_type: form.visa_type || '',
        visa_validity_months: form.visa_validity_months || 3,
        max_duration_days: form.max_duration_days || 30,
        entries_type: form.entries_type || 'Single',
        access_token: form.access_token || '',
        been_to_china: form.been_to_china || false,
        china_visa_number: form.china_visa_number || '',
        china_visa_year: form.china_visa_year || null,
        china_visa_month: form.china_visa_month || null,
        fingerprint_given: form.fingerprint_given || false,
        fingerprint_date: form.fingerprint_date || null,
      },
      
      travel_info: {
        arrival_flight: "TK072",
        destination_city: "Guangzhou", 
        departure_flight: "TK073",
        departure_city: "Guangzhou"
      },
      
      emergency_contact: {
        family_name: "KUTAS",
        given_name: "YUSUF", 
        relationship: "FRIEND",
        phone: "05456036547",
        email: "gmyusuf13@gmail.com"
      },

      meta: {
        generated_at: new Date().toISOString(),
        api_version: '1.0.0',
      },
    }

    return NextResponse.json(response, {
      status: 200,
      headers: corsHeaders,
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || '') },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}