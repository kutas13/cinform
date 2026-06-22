import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('SUPABASE_URL ayarlanmamis')

  const key = serviceKey || anonKey
  if (!key) throw new Error('SUPABASE key ayarlanmamis')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('yunan_customers')
      .select('id, full_name, tc_number, appointment_date, choice_index, status')
      .in('status', ['pending', 'processing'])
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('[yunan-customers GET] Supabase error:', error)
      return NextResponse.json(
        { error: error.message, hint: error.hint || '', code: error.code },
        { status: 500 }
      )
    }

    const customers = (data || []).map((c: any) => ({
      id: c.id,
      name: c.full_name,
      tc: c.tc_number,
      date: c.appointment_date,
      choice: c.choice_index,
      status: c.status,
    }))

    return NextResponse.json({ success: true, customers, count: customers.length })
  } catch (e: any) {
    console.error('[yunan-customers GET] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id ve status gerekli' }, { status: 400 })
    }

    if (!['pending', 'done', 'error', 'processing'].includes(status)) {
      return NextResponse.json({ error: 'Gecersiz status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('yunan_customers')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('[yunan-customers PATCH] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[yunan-customers PATCH] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
