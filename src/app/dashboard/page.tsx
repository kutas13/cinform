import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Database } from '@/types/database'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get counts for dashboard stats
  const [
    { count: customersCount },
    { count: chineseCompaniesCount },
    { count: turkishCompaniesCount },
    { count: formsCount },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('chinese_companies').select('*', { count: 'exact', head: true }),
    supabase.from('turkish_companies').select('*', { count: 'exact', head: true }),
    supabase.from('forms').select('*', { count: 'exact', head: true }),
  ])

  const stats = {
    customers: customersCount || 0,
    chineseCompanies: chineseCompaniesCount || 0,
    turkishCompanies: turkishCompaniesCount || 0,
    forms: formsCount || 0,
  }

  return <DashboardClient stats={stats} user={session.user} />
}