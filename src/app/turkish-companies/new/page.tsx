'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface TurkishCompanyForm {
  company_name: string
  address: string
  phone: string
  manager_name: string
}

export default function NewTurkishCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState<{ company_name: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { register, handleSubmit, formState: { errors } } = useForm<TurkishCompanyForm>()

  const checkNameDuplicate = useCallback(async (name: string) => {
    if (!name || name.length < 3 || !user) { setNameDuplicate(null); return }
    const { data } = await supabase
      .from('turkish_companies')
      .select('company_name')
      .eq('created_by', user.id)
      .ilike('company_name', name)
      .maybeSingle()
    setNameDuplicate(data || null)
  }, [user, supabase])

  const onSubmit = async (data: TurkishCompanyForm) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('turkish_companies').insert({ ...data, created_by: user.id })
      if (error) throw error
      toast.success('Turk sirket basariyla olusturuldu!')
      router.push('/turkish-companies')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/turkish-companies" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Turk Sirketlere Geri Don
        </Link>
        <h1 className="page-title">Yeni Turk Sirket Olustur</h1>
        <p className="text-slate-500 mt-1 text-sm">Turk sirket ve is bilgilerini girin</p>
      </div>

      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sirket */}
          <div className="form-section bg-rose-500/5 border-rose-500/20">
            <h3 className="text-base font-bold text-rose-400 mb-6">Sirket Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adi *</label>
                <input
                  {...register('company_name', {
                    required: 'Sirket adi gereklidir',
                    onBlur: (e) => checkNameDuplicate(e.target.value),
                  })}
                  type="text" className="input-field" placeholder="Orn: Istanbul Ithalat A.S."
                />
                {errors.company_name && <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>}
                {nameDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni Isimde Sirket Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          "<strong>{nameDuplicate.company_name}</strong>" adli sirket zaten kayitli.
                          Yine de eklemek istiyorsaniz devam edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Sirket Adresi *</label>
                <textarea {...register('address', { required: 'Adres gereklidir' })} rows={3} className="input-field" placeholder="Tam sirket adresi" />
                {errors.address && <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>}
              </div>
              <div>
                <label className="form-label">Telefon Numarasi *</label>
                <input {...register('phone', { required: 'Telefon gereklidir' })} type="tel" className="input-field" placeholder="+90 212 123 45 67" />
                {errors.phone && <p className="text-rose-400 text-xs mt-1.5">{errors.phone.message}</p>}
                <p className="text-xs text-slate-600 mt-1">Bu numara hem sirket hem mudur icin kullanilacak</p>
              </div>
            </div>
          </div>

          {/* Mudur */}
          <div className="form-section bg-violet-500/5 border-violet-500/20">
            <h3 className="text-base font-bold text-violet-400 mb-6">Mudur/Yonetici Bilgileri</h3>
            <div>
              <label className="form-label">Mudur/Yonetici Ismi *</label>
              <input {...register('manager_name', { required: 'Mudur ismi gereklidir' })} type="text" className="input-field" placeholder="Orn: Ahmet Yilmaz" />
              {errors.manager_name && <p className="text-rose-400 text-xs mt-1.5">{errors.manager_name.message}</p>}
              <p className="text-xs text-slate-600 mt-1">Supervisor/yonetici olarak kaydedilecek</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/turkish-companies" className="btn-secondary">Iptal</Link>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Kaydediliyor...' : 'Turk Sirketi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
