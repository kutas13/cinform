'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface CustomerForm {
  full_name: string
  birth_year: number
  birth_city: string
  birth_province: string
  tc_number: string
  marital_status: string
  passport_issue_place: string
  home_address: string
  phone_number: string
  email: string
  occupation_type: string
  work_start_year: number
  work_start_month: number
  work_end_year?: number
  work_end_month?: number
  spouse_first_name?: string
  spouse_last_name?: string
  spouse_birth_date?: string
  spouse_birth_country?: string
  spouse_birth_city?: string
  father_first_name: string
  father_last_name: string
  father_nationality: string
  father_birth_date: string
  mother_first_name: string
  mother_last_name: string
  mother_nationality: string
  mother_birth_date: string
  children_count: number
}

export default function EditCustomerPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [tcDuplicate, setTcDuplicate] = useState<{ full_name: string } | null>(null)
  const [originalTc, setOriginalTc] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CustomerForm>()
  const maritalStatus = watch('marital_status')
  const rawChildrenCount = watch('children_count')
  const childrenCount = Number(rawChildrenCount) || 0

  const checkTcDuplicate = useCallback(async (tc: string) => {
    if (!tc || tc.length !== 11 || !user || tc === originalTc) { setTcDuplicate(null); return }
    const { data } = await supabase
      .from('customers')
      .select('full_name, tc_number')
      .eq('tc_number', tc)
      .eq('created_by', user.id)
      .neq('id', id as string)
      .maybeSingle()
    setTcDuplicate(data || null)
  }, [user, supabase, id, originalTc])

  useEffect(() => {
    if (user && id) loadCustomer()
  }, [user, id])

  async function loadCustomer() {
    const { data, error } = await supabase
      .from('customers').select('*').eq('id', id as string).eq('created_by', user!.id).single()
    if (error || !data) { toast.error('Musteri bulunamadi'); router.push('/customers'); return }
    const formData: any = { ...data }
    setOriginalTc(data.tc_number || '')
    if (data.children_data && Array.isArray(data.children_data)) {
      data.children_data.forEach((child: any, i: number) => {
        formData[`children_${i}_first_name`] = child.first_name || ''
        formData[`children_${i}_last_name`] = child.last_name || ''
        formData[`children_${i}_nationality`] = child.nationality || 'Türkiye'
        formData[`children_${i}_birth_date`] = child.birth_date || ''
      })
    }
    reset(formData)
    setPageLoading(false)
  }

  const onSubmit = async (data: CustomerForm) => {
    if (!user) return
    setLoading(true)
    try {
      const cleanedData: Record<string, any> = {}
      const knownFields = [
        'full_name', 'birth_city', 'birth_province', 'tc_number', 'marital_status',
        'passport_issue_place', 'home_address', 'phone_number', 'email', 'occupation_type',
        'work_start_year', 'work_start_month', 'work_end_year', 'work_end_month',
        'spouse_first_name', 'spouse_last_name', 'spouse_birth_date', 'spouse_birth_country', 'spouse_birth_city',
        'father_first_name', 'father_last_name', 'father_nationality', 'father_birth_date',
        'mother_first_name', 'mother_last_name', 'mother_nationality', 'mother_birth_date',
        'children_count'
      ]
      for (const key of knownFields) {
        if ((data as any)[key] !== undefined) cleanedData[key] = (data as any)[key] || null
      }
      if (!cleanedData.spouse_birth_date) cleanedData.spouse_birth_date = null
      if (!cleanedData.father_birth_date) cleanedData.father_birth_date = null
      if (!cleanedData.mother_birth_date) cleanedData.mother_birth_date = null
      if (!cleanedData.work_end_year) cleanedData.work_end_year = null
      if (!cleanedData.work_end_month) cleanedData.work_end_month = null
      const cc = Number(data.children_count) || 0
      cleanedData.children_count = cc
      cleanedData.children_data = Array.from({ length: cc }, (_, i) => ({
        first_name: (data as any)[`children_${i}_first_name`] || '',
        last_name: (data as any)[`children_${i}_last_name`] || '',
        nationality: (data as any)[`children_${i}_nationality`] || 'Türkiye',
        birth_date: (data as any)[`children_${i}_birth_date`] || '',
      }))
      const { error } = await supabase.from('customers').update(cleanedData).eq('id', id as string)
      if (error) throw error
      toast.success('Musteri guncellendi!')
      router.push('/customers')
    } catch (error: any) {
      toast.error('Hata: ' + (error.message || 'Bilinmeyen'))
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/customers" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Musterilere Geri Don
        </Link>
        <h1 className="page-title">Musteri Duzenle</h1>
      </div>

      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Temel */}
          <div className="form-section bg-blue-500/5 border-blue-500/20">
            <h3 className="text-base font-bold text-blue-400 mb-6">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Ad Soyad *</label>
                <input {...register('full_name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="form-label">Dogum Yili *</label>
                <input {...register('birth_year', { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">TC Kimlik No *</label>
                <input
                  {...register('tc_number', {
                    required: true,
                    onChange: (e) => checkTcDuplicate(e.target.value),
                  })}
                  maxLength={11} className="input-field"
                />
                {tcDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni TC Numarasi Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">Bu TC "<strong>{tcDuplicate.full_name}</strong>" adli musteriye ait.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dogum Yeri */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-base font-bold text-emerald-400 mb-6">Dogum Yeri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Il *</label>
                <input {...register('birth_province', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="form-label">Ilce *</label>
                <input {...register('birth_city', { required: true })} className="input-field" />
              </div>
            </div>
          </div>

          {/* Diger */}
          <div className="form-section bg-violet-500/5 border-violet-500/20">
            <h3 className="text-base font-bold text-violet-400 mb-6">Diger Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="form-label">Medeni Hal *</label>
                <select {...register('marital_status', { required: true })} className="input-field">
                  <option value="Single">Bekar</option>
                  <option value="Married">Evli</option>
                  <option value="Divorced">Bosanmis</option>
                  <option value="Widowed">Dul</option>
                  <option value="Other">Diger</option>
                </select>
              </div>
              <div>
                <label className="form-label">Pasaport Cikis Yeri *</label>
                <input {...register('passport_issue_place', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="form-label">Pozisyon *</label>
                <select {...register('occupation_type', { required: true })} className="input-field">
                  <option value="owner">Sirket Sahibi</option>
                  <option value="employee">Calisan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calisma */}
          <div className="form-section bg-rose-500/5 border-rose-500/20">
            <h3 className="text-base font-bold text-rose-400 mb-6">Calisma Tarihleri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Giris Yili</label>
                <input {...register('work_start_year', { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="form-label">Giris Ayi</label>
                <select {...register('work_start_month', { valueAsNumber: true })} className="input-field">
                  <option value="">-</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Cikis Yili</label>
                <input {...register('work_end_year', { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="form-label">Cikis Ayi</label>
                <select {...register('work_end_month', { valueAsNumber: true })} className="input-field">
                  <option value="">-</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Iletisim */}
          <div className="form-section bg-cyan-500/5 border-cyan-500/20">
            <h3 className="text-base font-bold text-cyan-400 mb-6">Iletisim</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Ev Adresi</label>
                <textarea {...register('home_address')} rows={2} className="input-field" />
              </div>
              <div>
                <label className="form-label">Telefon</label>
                <input {...register('phone_number')} className="input-field" />
              </div>
              <div>
                <label className="form-label">E-posta</label>
                <input {...register('email')} type="email" className="input-field" />
              </div>
            </div>
          </div>

          {/* Es */}
          {maritalStatus === 'Married' && (
            <div className="form-section bg-pink-500/5 border-pink-500/20">
              <h3 className="text-base font-bold text-pink-400 mb-6">Es Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="form-label">Es Adi</label><input {...register('spouse_first_name')} className="input-field" /></div>
                <div><label className="form-label">Es Soyadi</label><input {...register('spouse_last_name')} className="input-field" /></div>
                <div><label className="form-label">Dogum Tarihi</label><input {...register('spouse_birth_date')} type="date" className="input-field" /></div>
                <div><label className="form-label">Dogum Ulkesi</label><input {...register('spouse_birth_country')} className="input-field" /></div>
                <div><label className="form-label">Dogum Sehri</label><input {...register('spouse_birth_city')} className="input-field" /></div>
              </div>
            </div>
          )}

          {/* Ebeveyn */}
          <div className="form-section bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-base font-bold text-indigo-400 mb-6">Ebeveyn Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-slate-200 font-semibold border-b border-slate-700/50 pb-2 text-sm">Baba</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Ad</label><input {...register('father_first_name')} className="input-field" /></div>
                  <div><label className="form-label">Soyad</label><input {...register('father_last_name')} className="input-field" /></div>
                </div>
                <div><label className="form-label">Milliyet</label><input {...register('father_nationality')} className="input-field" /></div>
                <div><label className="form-label">Dogum Tarihi</label><input {...register('father_birth_date')} type="date" className="input-field" /></div>
              </div>
              <div className="space-y-4">
                <h4 className="text-slate-200 font-semibold border-b border-slate-700/50 pb-2 text-sm">Anne</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Ad</label><input {...register('mother_first_name')} className="input-field" /></div>
                  <div><label className="form-label">Soyad</label><input {...register('mother_last_name')} className="input-field" /></div>
                </div>
                <div><label className="form-label">Milliyet</label><input {...register('mother_nationality')} className="input-field" /></div>
                <div><label className="form-label">Dogum Tarihi</label><input {...register('mother_birth_date')} type="date" className="input-field" /></div>
              </div>
            </div>
          </div>

          {/* Cocuk */}
          <div className="form-section bg-yellow-500/5 border-yellow-500/20">
            <h3 className="text-base font-bold text-yellow-400 mb-6">Cocuk Bilgileri</h3>
            <div className="mb-4">
              <label className="form-label">Cocuk Sayisi</label>
              <select {...register('children_count', { valueAsNumber: true })} className="input-field max-w-xs">
                <option value="0">Cocuk Yok</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {childrenCount > 0 && (
              <div className="space-y-4 mt-4">
                {Array.from({ length: childrenCount }, (_, i) => (
                  <div key={i} className="border border-yellow-500/20 rounded-xl p-4 bg-yellow-500/5">
                    <h4 className="font-semibold text-yellow-300 mb-4 text-sm">{i + 1}. Cocuk</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="form-label">Ad</label><input {...register(`children_${i}_first_name` as any)} className="input-field" /></div>
                      <div><label className="form-label">Soyad</label><input {...register(`children_${i}_last_name` as any)} className="input-field" /></div>
                      <div><label className="form-label">Milliyet</label><input {...register(`children_${i}_nationality` as any)} className="input-field" defaultValue="Türkiye" /></div>
                      <div><label className="form-label">Dogum Tarihi</label><input {...register(`children_${i}_birth_date` as any)} type="date" className="input-field" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/customers" className="btn-secondary">Iptal</Link>
            <button type="submit" disabled={loading || !!tcDuplicate} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
