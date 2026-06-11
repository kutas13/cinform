'use client'

import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  PlusIcon,
  ArrowRightIcon,
  SparklesIcon,
  BoltIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import VisaPdfImportCard from '@/components/dashboard/VisaPdfImportCard'
import { createClientClient } from '@/lib/supabase'

interface DashboardStats {
  customers: number
  chineseCompanies: number
  turkishCompanies: number
  forms: number
}

interface DashboardClientProps {
  stats: DashboardStats
  user: User
}

interface RecentForm {
  id: string
  access_token: string
  visa_type: string
  created_at: string
  customer_name: string
}

const statCards = [
  {
    key: 'customers', label: 'Musteriler', icon: UserGroupIcon,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'shadow-violet-500/20',
    iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400',
    valueColor: 'text-violet-300',
    href: '/customers',
  },
  {
    key: 'chineseCompanies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon,
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'shadow-amber-500/20',
    iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400',
    valueColor: 'text-amber-300',
    href: '/chinese-companies',
  },
  {
    key: 'turkishCompanies', label: 'Turk Sirketler', icon: BuildingLibraryIcon,
    gradient: 'from-rose-400 to-pink-600',
    glowColor: 'shadow-rose-500/20',
    iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400',
    valueColor: 'text-rose-300',
    href: '/turkish-companies',
  },
  {
    key: 'forms', label: 'Formlar', icon: DocumentTextIcon,
    gradient: 'from-cyan-400 to-teal-500',
    glowColor: 'shadow-cyan-500/20',
    iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400',
    valueColor: 'text-cyan-300',
    href: '/forms',
  },
]

const quickActions = [
  { href: '/customers/new', label: 'Yeni Musteri', icon: UserGroupIcon, gradient: 'from-violet-500 to-purple-600' },
  { href: '/chinese-companies/new', label: 'Cinli Sirket', icon: BuildingOfficeIcon, gradient: 'from-amber-400 to-orange-500' },
  { href: '/turkish-companies/new', label: 'Turk Sirket', icon: BuildingLibraryIcon, gradient: 'from-rose-400 to-pink-600' },
  { href: '/forms/new', label: 'Yeni Form', icon: DocumentTextIcon, gradient: 'from-cyan-400 to-teal-500' },
]

export default function DashboardClient({ stats, user }: DashboardClientProps) {
  const [recentForms, setRecentForms] = useState<RecentForm[]>([])
  const [mounted, setMounted] = useState(false)
  const supabase = createClientClient()

  useEffect(() => { setMounted(true); loadRecent() }, [])

  async function loadRecent() {
    const { data } = await supabase
      .from('forms')
      .select('id, access_token, visa_type, created_at, customer_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!data || data.length === 0) return
    const custIds = Array.from(new Set((data as any[]).map(f => f.customer_id).filter(Boolean)))
    const { data: custs } = custIds.length
      ? await supabase.from('customers').select('id, full_name').in('id', custIds)
      : { data: [] }
    const custMap = new Map(((custs || []) as any[]).map(c => [c.id, c.full_name]))
    setRecentForms((data as any[]).map(f => ({
      id: f.id, access_token: f.access_token, visa_type: f.visa_type,
      created_at: f.created_at, customer_name: custMap.get(f.customer_id) || 'Bilinmeyen',
    })))
  }

  const totalRecords = stats.customers + stats.chineseCompanies + stats.turkishCompanies + stats.forms

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <VisaPdfImportCard />

      {/* Hero */}
      <div className={`mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative">
          {/* Animated background blob */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
          <div className="absolute -top-10 right-0 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl animate-float pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-violet-400 animate-glow-pulse" />
              <span className="text-sm font-bold text-violet-400/90 uppercase tracking-[0.2em]">{getGreeting()}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
              <span className="text-gradient-cool">Fox Vize</span>
              <span className="text-white"> Panel</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Toplam <span className="text-white font-bold text-xl">{totalRecords}</span> kayit yonetiyorsunuz
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {statCards.map((card, i) => {
          const Icon = card.icon
          const count = stats[card.key as keyof DashboardStats]
          return (
            <Link key={card.key} href={card.href} className="group" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`stat-card ${card.glowColor} hover:shadow-2xl`}>
                {/* Gradient line on top */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                
                {/* Glow blob */}
                <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${card.gradient} opacity-[0.07] group-hover:opacity-[0.15] rounded-full blur-2xl transition-opacity duration-500`} />
                
                <div className="relative">
                  <div className={`inline-flex p-2.5 rounded-xl ${card.iconBg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <p className={`text-4xl font-extrabold ${card.valueColor} mb-1 tabular-nums`}>{count}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions + Recent */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-5">
            <BoltIcon className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.15em]">Hizli Islem</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href} className="group block">
                  <div className="flex items-center gap-3.5 px-4 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:translate-x-1">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex-1">{action.label}</span>
                    <PlusIcon className="h-4 w-4 text-slate-600 group-hover:text-violet-400 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Forms */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-5">
            <ClockIcon className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.15em]">Son Formlar</h2>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {recentForms.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 animate-float">
                  <DocumentTextIcon className="h-7 w-7 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">Henuz form olusturulmamis</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentForms.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all duration-300" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/20 shrink-0">
                      <span className="text-[10px] font-bold text-cyan-400">{f.customer_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.customer_name}</p>
                      <p className="text-[10px] text-slate-500">{f.visa_type}</p>
                    </div>
                    <code className="text-[10px] font-mono text-violet-400/70 hidden sm:block">{f.access_token}</code>
                    <span className="text-[10px] text-slate-600 shrink-0 tabular-nums">{timeAgo(f.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Gunaydin'
  if (hour < 18) return 'Iyi Gunler'
  return 'Iyi Aksamlar'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Simdi'
  if (mins < 60) return `${mins}dk`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa`
  const days = Math.floor(hours / 24)
  return `${days}g`
}
