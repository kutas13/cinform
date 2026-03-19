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
    <div className="min-h-screen bg-[#0a0e1a] flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-50" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative">
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30">
            <span className="text-2xl font-black text-white">C</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            Cin Vize<br />
            <span className="text-gradient">Otomasyon</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Cin konsoloslugu vize basvuru formlarini otomatik doldurun. 
            Musteri, sirket ve form yonetimini tek panelden yapin.
          </p>
          <div className="flex items-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              Hizli Form Doldurma
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
              Chrome Extension
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Otomasyon', value: '%100' },
              { label: 'Hiz', value: '10x' },
              { label: 'Kolay', value: '3 Adim' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-gradient mb-1">{stat.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
              <span className="text-xl font-black text-white">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white">CinPanel</h1>
          </div>

          <div className="card p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Giris Yap</h2>
              <p className="text-slate-400 text-sm">Panele erisim icin hesabiniza giris yapin</p>
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
                className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

            <div className="mt-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-widest">Demo Hesap</p>
              <p className="text-sm text-slate-400">
                <span className="text-slate-300 font-medium">admin@cinpanel.com</span>
                {' '}/{' '}
                <span className="text-slate-300 font-medium">131313Yusuf13</span>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} CinPanel
          </p>
        </div>
      </div>
    </div>
  )
}
