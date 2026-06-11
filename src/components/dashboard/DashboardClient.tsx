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
  RocketLaunchIcon,
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
    gradient: 'from-blue-600 to-cyan-500',
    bgGlow: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400',
    valueColor: 'text-blue-400',
    href: '/customers',
  },
  {
    key: 'chineseCompanies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon,
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400',
    valueColor: 'text-amber-400',
    href: '/chinese-companies',
  },
  {
    key: 'turkishCompanies', label: 'Turk Sirketler', icon: BuildingLibraryIcon,
    gradient: 'from-rose-500 to-pink-500',
    bgGlow: 'bg-rose-500/5',
    iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400',
    valueColor: 'text-rose-400',
    href: '/turkish-companies',
  },
  {
    key: 'forms', label: 'Formlar', icon: DocumentTextIcon,
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-400',
    href: '/forms',
  },
]

const quickActions = [
  { href: '/customers/new', label: 'Yeni Musteri', icon: UserGroupIcon, color: 'blue' },
  { href: '/chinese-companies/new', label: 'Cinli Sirket', icon: BuildingOfficeIcon, color: 'amber' },
  { href: '/turkish-companies/new', label: 'Turk Sirket', icon: BuildingLibraryIcon, color: 'rose' },
  { href: '/forms/new', label: 'Yeni Form', icon: DocumentTextIcon, color: 'emerald' },
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
      id: f.id,
      access_token: f.access_token,
      visa_type: f.visa_type,
      created_at: f.created_at,
      customer_name: custMap.get(f.customer_id) || 'Bilinmeyen',
    })))
  }

  const totalRecords = stats.customers + stats.chineseCompanies + stats.turkishCompanies + stats.forms
  const greeting = getGreeting()

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <VisaPdfImportCard />

      {/* Hero Header */}
      <div className={`mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest">{greeting}</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2">
          Fox Vize Panel
        </h1>
        <p className="text-slate-500 text-base max-w-xl">
          Cin vize basvuru yonetim sisteminize hosgeldiniz. Toplam <span className="text-white font-semibold">{totalRecords}</span> kayit yonetiyorsunuz.
        </p>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {statCards.map((card) => {
          const Icon = card.icon
          const count = stats[card.key as keyof DashboardStats]
          return (
            <Link key={card.key} href={card.href} className="group">
              <div className={`relative overflow-hidden rounded-2xl border border-slate-700/50 ${card.bgGlow} p-5 hover:border-slate-600/80 hover:scale-[1.03] transition-all duration-300`}>
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
                <div className="relative">
                  <div className={`inline-flex p-2.5 rounded-xl ${card.iconBg} mb-4`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <p className={`text-3xl font-extrabold ${card.valueColor} mb-1 tabular-nums`}>{count}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions + Recent Forms */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <RocketLaunchIcon className="h-4.5 w-4.5 text-slate-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hizli Olustur</h2>
          </div>
          <div className="space-y-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href} className="group block">
                  <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-200">
                    <div className={`p-2 rounded-lg bg-${action.color}-500/10`}>
                      <Icon className={`h-4 w-4 text-${action.color}-400`} />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex-1">{action.label}</span>
                    <PlusIcon className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Forms */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <ClockIcon className="h-4.5 w-4.5 text-slate-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Son Formlar</h2>
          </div>
          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/20 overflow-hidden">
            {recentForms.length === 0 ? (
              <div className="p-10 text-center">
                <DocumentTextIcon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Henuz form olusturulmamis</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {recentForms.map((f) => (
                  <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <span className="text-[10px] font-bold text-emerald-400">{f.customer_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.customer_name}</p>
                      <p className="text-[10px] text-slate-500">{f.visa_type}</p>
                    </div>
                    <code className="text-[10px] font-mono text-emerald-400/70 hidden sm:block">{f.access_token}</code>
                    <span className="text-[10px] text-slate-600 shrink-0">
                      {timeAgo(f.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/customers', label: 'Musteri Listesi', icon: UserGroupIcon, count: stats.customers },
            { href: '/chinese-companies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon, count: stats.chineseCompanies },
            { href: '/turkish-companies', label: 'Turk Sirketler', icon: BuildingLibraryIcon, count: stats.turkishCompanies },
            { href: '/forms', label: 'Tum Formlar', icon: DocumentTextIcon, count: stats.forms },
          ].map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/30 border border-slate-700/30 
                           text-sm text-slate-400 hover:text-white hover:border-slate-600/50 hover:bg-slate-800/50
                           transition-all duration-200 group"
              >
                <Icon className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                <span className="flex-1">{link.label}</span>
                <span className="text-[10px] font-mono text-slate-600">{link.count}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Gunaydin'
  if (hour < 18) return 'Iyi gunler'
  return 'Iyi aksamlar'
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
