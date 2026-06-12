import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('yunan_customers')
    .select('id, full_name, tc_number, appointment_date, choice_index, status')
    .in('status', ['pending', 'processing'])
    .order('appointment_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const customers = (data || []).map((c: any) => ({
    id: c.id,
    name: c.full_name,
    tc: c.tc_number,
    date: c.appointment_date,
    choice: c.choice_index,
    status: c.status,
  }))

  return NextResponse.json({ success: true, customers })
}

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
