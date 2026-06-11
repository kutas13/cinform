'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/login'
  const isPublicPage = isLoginPage || pathname.startsWith('/api/')

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.push('/login')
    }
  }, [user, loading, isPublicPage, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center animate-pulse">
            <span className="text-xl font-black text-white">F</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (isLoginPage || !user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <Sidebar />
      <main className="lg:pl-[260px] pt-16 lg:pt-0 min-h-screen">
        <div className="bg-grid bg-glow-blue min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
