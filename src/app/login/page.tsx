'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (user) {
    router.push('/dashboard')
    return null
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Giris basarili!')
      }
    } catch (error) {
      toast.error('Bir hata olustu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <div className="text-6xl mb-6">🇨🇳</div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            Cin Vize<br />
            <span className="text-gradient">Otomasyon</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Cin konsoloslugu vize basvuru formlarini otomatik doldurun. 
            Musteri, sirket ve form yonetimini tek panelden yapin.
          </p>
          <div className="mt-8 flex items-center gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Hizli Form Doldurma
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Chrome Extension
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="text-4xl mb-3">🇨🇳</div>
            <h1 className="text-2xl font-bold text-white">CinPanel</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Giris Yap</h2>
            <p className="text-slate-400">Panele erisim icin giris yapin</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">E-posta</label>
              <input
                {...register('email', {
                  required: 'E-posta gereklidir',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Gecerli bir e-posta adresi girin'
                  }
                })}
                type="email"
                className="input-field"
                placeholder="ornek@email.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Sifre</label>
              <input
                {...register('password', {
                  required: 'Sifre gereklidir',
                  minLength: { value: 6, message: 'Sifre en az 6 karakter olmali' }
                })}
                type="password"
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && (
                <p className="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Giris yapiliyor...
                </>
              ) : (
                'Giris Yap'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Demo Hesap</p>
            <p className="text-sm text-slate-400">
              <span className="text-slate-300">admin@cinpanel.com</span> / <span className="text-slate-300">131313Yusuf13</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} CinPanel
          </p>
        </div>
      </div>
    </div>
  )
}