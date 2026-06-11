'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/customers', label: 'Musteriler', icon: UserGroupIcon },
  { href: '/chinese-companies', label: 'Cinli Sirketler', icon: BuildingOfficeIcon },
  { href: '/turkish-companies', label: 'Turk Sirketler', icon: BuildingLibraryIcon },
  { href: '/forms', label: 'Formlar', icon: DocumentTextIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <span className="text-lg font-black text-white">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Fox Vize</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Panel v4.0</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-4 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] mb-3">Navigasyon</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-violet-400' : 'text-slate-500'}`} />
              <span className="flex-1">{item.label}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-3">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 font-bold">Hesap</p>
          <p className="text-xs text-slate-300 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          <span>Cikis Yap</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 
                         bg-[#0b0f1a]/95 backdrop-blur-2xl border-r border-white/[0.06] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 
                       bg-[#0b0f1a]/95 backdrop-blur-2xl border-b border-white/[0.06] 
                       flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <span className="text-sm font-black text-white">F</span>
          </div>
          <span className="text-base font-bold text-white">Fox Vize</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-[#0b0f1a] border-r border-white/[0.06] z-50 flex flex-col animate-slide-in-right">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
