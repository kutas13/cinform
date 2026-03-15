'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

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
  { key: 'customers', label: 'Musteriler', icon: UserGroupIcon, color: 'indigo' },
  { key: 'chineseCompanies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon, color: 'amber' },
  { key: 'turkishCompanies', label: 'Turk Sirketler', icon: BuildingLibraryIcon, color: 'rose' },
  { key: 'forms', label: 'Formlar', icon: DocumentTextIcon, color: 'emerald' },
]

const actionCards = [
  { href: '/chinese-companies/new', label: 'Cinli Sirket Olustur', desc: 'Davet eden Cinli sirket bilgilerini ekleyin', icon: BuildingOfficeIcon, gradient: 'from-amber-500 to-orange-600' },
  { href: '/turkish-companies/new', label: 'Turk Sirket Olustur', desc: 'Sponsor Turk sirket bilgilerini ekleyin', icon: BuildingLibraryIcon, gradient: 'from-rose-500 to-red-600' },
  { href: '/customers/new', label: 'Musteri Olustur', desc: 'Yeni musteri profili olusturun', icon: UserGroupIcon, gradient: 'from-indigo-500 to-blue-600' },
  { href: '/forms/new', label: 'Form Olustur', desc: 'Vize basvuru formu olusturun', icon: DocumentTextIcon, gradient: 'from-emerald-500 to-green-600' },
]

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
  amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
}

const valueColorMap: Record<string, string> = {
  indigo: 'text-indigo-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  emerald: 'text-emerald-400',
}

export default function DashboardClient({ stats, user }: DashboardClientProps) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 bg-grid">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-xl">🇨🇳</span>
              <span className="text-xl font-bold text-gradient">CinPanel</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Cikis</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-lg">Cin vize basvuru yonetim paneli</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => {
            const Icon = card.icon
            const count = stats[card.key as keyof DashboardStats]
            return (
              <div key={card.key} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ring-1 ${colorMap[card.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-2xl font-bold ${valueColorMap[card.color]}`}>{count}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {actionCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <div className="dashboard-card group cursor-pointer h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{card.label}</h3>
                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">{card.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      <PlusIcon className="h-3.5 w-3.5" />
                      Olustur
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Hizli Erisim</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/customers', label: 'Musteri Listesi' },
              { href: '/chinese-companies', label: 'Cinli Sirket Listesi' },
              { href: '/turkish-companies', label: 'Turk Sirket Listesi' },
              { href: '/forms', label: 'Form Listesi' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-200 text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}