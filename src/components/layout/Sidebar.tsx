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
      <div className="px-6 py-6 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-lg font-black text-white">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">CinPanel</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Vize Yonetimi</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Menu</p>
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
              <Icon className={`h-5 w-5 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span>{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="px-4 py-3 rounded-xl bg-slate-800/40 mb-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Hesap</p>
          <p className="text-xs text-slate-300 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Cikis Yap</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 
                         bg-[#0d1224]/95 backdrop-blur-2xl border-r border-slate-700/50 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 
                       bg-[#0d1224]/95 backdrop-blur-2xl border-b border-slate-700/50 
                       flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-sm font-black text-white">C</span>
          </div>
          <span className="text-base font-bold text-white">CinPanel</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-400 hover:text-white">
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-[#0d1224] border-r border-slate-700/50 z-50 flex flex-col animate-slide-up">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
