'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import VisaPdfImportCard from '@/components/dashboard/VisaPdfImportCard'

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

const statCards = [
  { 
    key: 'customers', label: 'Musteriler', icon: UserGroupIcon, 
    gradient: 'from-blue-500/20 to-cyan-500/20', 
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400',
    valueColor: 'text-blue-400',
    href: '/customers',
  },
  { 
    key: 'chineseCompanies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon, 
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400',
    valueColor: 'text-amber-400',
    href: '/chinese-companies',
  },
  { 
    key: 'turkishCompanies', label: 'Turk Sirketler', icon: BuildingLibraryIcon, 
    gradient: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-500/20', iconColor: 'text-rose-400',
    valueColor: 'text-rose-400',
    href: '/turkish-companies',
  },
  { 
    key: 'forms', label: 'Formlar', icon: DocumentTextIcon, 
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-400',
    href: '/forms',
  },
]

const actionCards = [
  { href: '/chinese-companies/new', label: 'Cinli Sirket', desc: 'Davet eden Cinli sirket ekle', icon: BuildingOfficeIcon, gradient: 'from-amber-500 to-orange-600' },
  { href: '/turkish-companies/new', label: 'Turk Sirket', desc: 'Sponsor Turk sirket ekle', icon: BuildingLibraryIcon, gradient: 'from-rose-500 to-red-600' },
  { href: '/customers/new', label: 'Musteri', desc: 'Yeni musteri profili olustur', icon: UserGroupIcon, gradient: 'from-blue-500 to-indigo-600' },
  { href: '/forms/new', label: 'Form', desc: 'Vize basvuru formu olustur', icon: DocumentTextIcon, gradient: 'from-emerald-500 to-teal-600' },
]

export default function DashboardClient({ stats, user }: DashboardClientProps) {
  const totalRecords = stats.customers + stats.chineseCompanies + stats.turkishCompanies + stats.forms

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <VisaPdfImportCard />

      {/* Welcome Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Aktif</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Hos Geldiniz
        </h1>
        <p className="text-slate-400 text-lg">
          Cin vize basvuru yonetim paneline hosgeldiniz. Bugun ne yapmak istersiniz?
        </p>
      </div>

      {/* Overview bar */}
      <div className="card p-5 mb-8 flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalRecords}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Toplam Kayit</p>
          </div>
        </div>
        <div className="h-10 w-px bg-slate-700/50" />
        {statCards.map((card) => {
          const count = stats[card.key as keyof DashboardStats]
          return (
            <Link key={card.key} href={card.href} className="flex items-center gap-2 group shrink-0">
              <span className={`text-lg font-bold ${card.valueColor}`}>{count}</span>
              <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{card.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => {
          const Icon = card.icon
          const count = stats[card.key as keyof DashboardStats]
          return (
            <Link key={card.key} href={card.href}>
              <div className={`stat-card ${card.gradient} ${card.border} from-slate-900 group cursor-pointer`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className={`text-3xl font-extrabold ${card.valueColor} mb-1`}>{count}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Create */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <PlusIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-bold text-white">Hizli Olustur</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <div className="dashboard-card group cursor-pointer h-full">
                  <div className="flex flex-col items-center text-center py-2">
                    <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{card.label}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Hizli Erisim</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/customers', label: 'Musteri Listesi', icon: UserGroupIcon },
            { href: '/chinese-companies', label: 'Cinli Sirket Listesi', icon: BuildingOfficeIcon },
            { href: '/turkish-companies', label: 'Turk Sirket Listesi', icon: BuildingLibraryIcon },
            { href: '/forms', label: 'Form Listesi', icon: DocumentTextIcon },
          ].map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 
                           text-sm text-slate-300 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/5 
                           transition-all duration-200"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
