'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface TurkishCompanyForm {
  company_name: string
  address: string
  phone: string
  manager_name: string
}

export default function NewTurkishCompanyPage() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TurkishCompanyForm>()

  const onSubmit = async (data: TurkishCompanyForm) => {
    if (!user) {
      toast.error('Giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('turkish_companies')
        .insert({
          ...data,
          created_by: user.id,
        })

      if (error) {
        throw error
      }

      toast.success('Türk şirket başarıyla oluşturuldu!')
      router.push('/turkish-companies')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/turkish-companies" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Turk Sirketlere Geri Don
          </Link>
          <h1 className="page-title">Yeni Turk Sirket Olustur</h1>
          <p className="text-slate-400 mt-1">Turk sirket ve is bilgilerini girin</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Şirket Bilgileri */}
            <div className="form-section bg-rose-500/5 border-rose-500/20">
              <h3 className="text-lg font-bold text-rose-400 mb-6">Sirket Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="form-label">Şirket Adı *</label>
                  <input
                    {...register('company_name', { required: 'Şirket adı gereklidir' })}
                    type="text"
                    className="input-field"
                    placeholder="Örn: İstanbul İthalat A.Ş."
                  />
                  {errors.company_name && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="form-label">Şirket Adresi *</label>
                  <textarea
                    {...register('address', { required: 'Adres gereklidir' })}
                    rows={3}
                    className="input-field"
                    placeholder="Tam şirket adresi"
                  />
                  {errors.address && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Telefon Numarası *</label>
                  <input
                    {...register('phone', { required: 'Telefon numarası gereklidir' })}
                    type="tel"
                    className="input-field"
                    placeholder="+90 212 123 45 67"
                  />
                  {errors.phone && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.phone.message}</p>
                  )}
                  <small className="text-slate-500">Bu numara hem sirket hem mudur icin kullanilacak</small>
                </div>
              </div>
            </div>

            {/* 2. Mudur Bilgileri */}
            <div className="form-section bg-violet-500/5 border-violet-500/20">
              <h3 className="text-lg font-bold text-violet-400 mb-6">Mudur/Yonetici Bilgileri</h3>
              <div>
                <label className="form-label">Müdür/Yönetici İsmi *</label>
                <input
                  {...register('manager_name', { required: 'Müdür ismi gereklidir' })}
                  type="text"
                  className="input-field"
                  placeholder="Örn: Ahmet Yılmaz"
                />
                {errors.manager_name && (
                  <p className="text-rose-400 text-xs mt-1.5">{errors.manager_name.message}</p>
                )}
                <small className="text-slate-500">Supervisor/yonetici olarak kaydedilecek</small>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-800">
              <Link href="/turkish-companies" className="btn-secondary">
                İptal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kaydediliyor...' : 'Türk Şirketi Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}