'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
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
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
  passport_issue_place: string
  home_address: string
  phone_number: string
  email: string
  occupation_type: 'owner' | 'employee'
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

export default function NewCustomerPage() {
  const [loading, setLoading] = useState(false)
  const [tcDuplicate, setTcDuplicate] = useState<{ full_name: string; tc_number: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerForm>()

  const maritalStatus = watch('marital_status')
  const rawChildrenCount = watch('children_count')
  const childrenCount = Number(rawChildrenCount) || 0

  const checkTcDuplicate = useCallback(async (tc: string) => {
    if (!tc || tc.length !== 11 || !user) { setTcDuplicate(null); return }
    const { data } = await supabase
      .from('customers')
      .select('full_name, tc_number')
      .eq('tc_number', tc)
      .eq('created_by', user.id)
      .maybeSingle()
    setTcDuplicate(data || null)
  }, [user, supabase])

  const onSubmit = async (data: CustomerForm) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }

    setLoading(true)
    try {
      const cleanedData: Record<string, any> = {
        full_name: data.full_name,
        birth_year: data.birth_year,
        birth_city: data.birth_city,
        birth_province: data.birth_province,
        tc_number: data.tc_number,
        marital_status: data.marital_status,
        passport_issue_place: data.passport_issue_place,
        home_address: data.home_address,
        phone_number: data.phone_number,
        email: data.email,
        father_first_name: data.father_first_name,
        father_last_name: data.father_last_name,
        father_nationality: data.father_nationality || 'Türkiye',
        mother_first_name: data.mother_first_name,
        mother_last_name: data.mother_last_name,
        mother_nationality: data.mother_nationality || 'Türkiye',
        children_count: data.children_count || 0,
        children_data: Array.from({ length: data.children_count || 0 }, (_, i) => ({
          first_name: (data as any)[`children_${i}_first_name`] || '',
          last_name: (data as any)[`children_${i}_last_name`] || '',
          nationality: (data as any)[`children_${i}_nationality`] || 'Türkiye',
          birth_date: (data as any)[`children_${i}_birth_date`] || '',
        })),
        occupation_type: data.occupation_type,
        work_start_year: data.work_start_year || null,
        work_start_month: data.work_start_month || null,
        work_end_year: data.work_end_year || null,
        work_end_month: data.work_end_month || null,
        created_by: user.id,
      }

      if (data.father_birth_date && data.father_birth_date !== '') {
        cleanedData.father_birth_date = data.father_birth_date
      }
      if (data.mother_birth_date && data.mother_birth_date !== '') {
        cleanedData.mother_birth_date = data.mother_birth_date
      }

      if (data.marital_status === 'Married') {
        if (data.spouse_first_name) cleanedData.spouse_first_name = data.spouse_first_name
        if (data.spouse_last_name) cleanedData.spouse_last_name = data.spouse_last_name
        if (data.spouse_birth_date && data.spouse_birth_date !== '') {
          cleanedData.spouse_birth_date = data.spouse_birth_date
        }
        if (data.spouse_birth_country) cleanedData.spouse_birth_country = data.spouse_birth_country
        if (data.spouse_birth_city) cleanedData.spouse_birth_city = data.spouse_birth_city
      }

      const { error } = await supabase.from('customers').insert(cleanedData)

      if (error) throw error

      toast.success('Musteri basariyla olusturuldu!')
      router.push('/customers')
    } catch (error: any) {
      console.error('Error:', error)
      if (error.code === '23505') {
        toast.error('Bu TC kimlik numarasi zaten kullaniliyor')
      } else if (error.message?.includes('date')) {
        toast.error('Tarih formatinda hata var. Lutfen tum tarihleri kontrol edin.')
      } else {
        toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/customers" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Musterilere Geri Don
        </Link>
        <h1 className="page-title">Yeni Musteri Olustur</h1>
        <p className="text-slate-500 mt-1 text-sm">Musteri bilgilerini asagidaki formu doldurarak girin</p>
      </div>

      {/* Form */}
      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 1. Temel Bilgiler */}
          <div className="form-section bg-blue-500/5 border-blue-500/20">
            <h3 className="text-base font-bold text-blue-400 mb-6">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Ad Soyad *</label>
                <input
                  {...register('full_name', { required: 'Ad soyad gereklidir' })}
                  type="text" className="input-field" placeholder="Orn: Ahmet Yilmaz"
                />
                {errors.full_name && <p className="text-rose-400 text-xs mt-1.5">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Dogum Yili *</label>
                <input
                  {...register('birth_year', { required: 'Dogum yili gereklidir', valueAsNumber: true })}
                  type="number" className="input-field" placeholder="1990" min={1940} max={2010}
                />
                {errors.birth_year && <p className="text-rose-400 text-xs mt-1.5">{errors.birth_year.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">TC Kimlik No *</label>
                <input
                  {...register('tc_number', {
                    required: 'TC kimlik numarasi gereklidir',
                    pattern: { value: /^[0-9]{11}$/, message: 'TC kimlik numarasi 11 haneli olmalidir' },
                    onChange: (e) => checkTcDuplicate(e.target.value),
                  })}
                  type="text" maxLength={11} className="input-field" placeholder="12345678901"
                />
                {errors.tc_number && <p className="text-rose-400 text-xs mt-1.5">{errors.tc_number.message}</p>}
                {tcDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni TC Numarasi Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          Bu TC numarasi "<strong>{tcDuplicate.full_name}</strong>" adli musteriye ait.
                          Ayni TC ile yeni kayit olusturamazsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Dogum Yeri */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-base font-bold text-emerald-400 mb-6">Dogum Yeri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Il *</label>
                <input {...register('birth_province', { required: 'Il gereklidir' })} type="text" className="input-field" placeholder="Orn: Istanbul" />
                {errors.birth_province && <p className="text-rose-400 text-xs mt-1.5">{errors.birth_province.message}</p>}
              </div>
              <div>
                <label className="form-label">Ilce *</label>
                <input {...register('birth_city', { required: 'Ilce gereklidir' })} type="text" className="input-field" placeholder="Orn: Kadikoy" />
                {errors.birth_city && <p className="text-rose-400 text-xs mt-1.5">{errors.birth_city.message}</p>}
              </div>
            </div>
          </div>

          {/* 3. Medeni Durum */}
          <div className="form-section bg-violet-500/5 border-violet-500/20">
            <h3 className="text-base font-bold text-violet-400 mb-6">Medeni Durum</h3>
            <div>
              <label className="form-label">Medeni Hal *</label>
              <select {...register('marital_status', { required: 'Medeni hal gereklidir' })} className="input-field">
                <option value="">Seciniz</option>
                <option value="Single">Bekar</option>
                <option value="Married">Evli</option>
                <option value="Divorced">Bosanmis</option>
                <option value="Widowed">Dul</option>
                <option value="Other">Diger</option>
              </select>
              {errors.marital_status && <p className="text-rose-400 text-xs mt-1.5">{errors.marital_status.message}</p>}
            </div>
          </div>

          {/* 4. Pasaport */}
          <div className="form-section bg-amber-500/5 border-amber-500/20">
            <h3 className="text-base font-bold text-amber-400 mb-6">Pasaport Cikis Yeri</h3>
            <div>
              <label className="form-label">Pasaportun Verildigi Yer *</label>
              <input {...register('passport_issue_place', { required: 'Pasaport cikis yeri gereklidir' })} type="text" className="input-field" placeholder="Orn: Istanbul" />
              {errors.passport_issue_place && <p className="text-rose-400 text-xs mt-1.5">{errors.passport_issue_place.message}</p>}
            </div>
          </div>

          {/* 5. Calisma Durumu */}
          <div className="form-section bg-rose-500/5 border-rose-500/20">
            <h3 className="text-base font-bold text-rose-400 mb-6">Calisma Durumu</h3>
            <div>
              <label className="form-label">Pozisyon *</label>
              <select {...register('occupation_type', { required: 'Pozisyon secimi gereklidir' })} className="input-field">
                <option value="">Seciniz</option>
                <option value="owner">Sirket Sahibi (Owner)</option>
                <option value="employee">Calisan (Manager)</option>
              </select>
              {errors.occupation_type && <p className="text-rose-400 text-xs mt-1.5">{errors.occupation_type.message}</p>}
              <p className="text-xs text-slate-600 mt-2">Owner secilirse: Businessperson / Calisan secilirse: Company employee</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <label className="form-label">Giris Yili *</label>
                <input {...register('work_start_year', { required: 'Gerekli', valueAsNumber: true })} type="number" className="input-field" placeholder="2020" min={1970} max={2030} />
              </div>
              <div>
                <label className="form-label">Giris Ayi *</label>
                <select {...register('work_start_month', { required: 'Gerekli', valueAsNumber: true })} className="input-field">
                  <option value="">Ay</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Cikis Yili</label>
                <input {...register('work_end_year', { valueAsNumber: true })} type="number" className="input-field" placeholder="Bos birakin" min={1970} max={2030} />
              </div>
              <div>
                <label className="form-label">Cikis Ayi</label>
                <select {...register('work_end_month', { valueAsNumber: true })} className="input-field">
                  <option value="">Bos</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 6. Iletisim */}
          <div className="form-section bg-cyan-500/5 border-cyan-500/20">
            <h3 className="text-base font-bold text-cyan-400 mb-6">Iletisim ve Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Ev Adresi *</label>
                <textarea {...register('home_address', { required: 'Ev adresi gereklidir' })} rows={3} className="input-field" placeholder="Tam ev adresiniz" />
                {errors.home_address && <p className="text-rose-400 text-xs mt-1.5">{errors.home_address.message}</p>}
              </div>
              <div>
                <label className="form-label">Telefon Numarasi *</label>
                <input {...register('phone_number', { required: 'Telefon gereklidir' })} type="tel" className="input-field" placeholder="+90 532 123 45 67" />
                {errors.phone_number && <p className="text-rose-400 text-xs mt-1.5">{errors.phone_number.message}</p>}
              </div>
              <div>
                <label className="form-label">E-posta *</label>
                <input {...register('email', { required: 'E-posta gereklidir', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Gecerli bir e-posta girin' } })} type="email" className="input-field" placeholder="ornek@email.com" />
                {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* 7. Es Bilgileri */}
          {maritalStatus === 'Married' && (
            <div className="form-section bg-pink-500/5 border-pink-500/20">
              <h3 className="text-base font-bold text-pink-400 mb-6">Es Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Es Adi *</label>
                  <input {...register('spouse_first_name', { required: maritalStatus === 'Married' ? 'Es adi gereklidir' : false })} type="text" className="input-field" placeholder="Orn: Ayse" />
                  {errors.spouse_first_name && <p className="text-rose-400 text-xs mt-1.5">{errors.spouse_first_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Es Soyadi *</label>
                  <input {...register('spouse_last_name', { required: maritalStatus === 'Married' ? 'Es soyadi gereklidir' : false })} type="text" className="input-field" placeholder="Orn: Yilmaz" />
                  {errors.spouse_last_name && <p className="text-rose-400 text-xs mt-1.5">{errors.spouse_last_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Es Dogum Tarihi *</label>
                  <input {...register('spouse_birth_date', { required: maritalStatus === 'Married' ? 'Es dogum tarihi gereklidir' : false })} type="date" className="input-field" />
                  {errors.spouse_birth_date && <p className="text-rose-400 text-xs mt-1.5">{errors.spouse_birth_date.message}</p>}
                </div>
                <div>
                  <label className="form-label">Es Dogum Ulkesi *</label>
                  <input {...register('spouse_birth_country', { required: maritalStatus === 'Married' ? 'Gerekli' : false })} type="text" className="input-field" placeholder="Turkiye" defaultValue="Türkiye" />
                </div>
                <div>
                  <label className="form-label">Es Dogum Sehri *</label>
                  <input {...register('spouse_birth_city', { required: maritalStatus === 'Married' ? 'Gerekli' : false })} type="text" className="input-field" placeholder="Orn: Ankara" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
                <p className="text-xs text-pink-300">Otomatik: Uyruk (Turkiye), Meslek (Unemployed), Adres (Ev adresi ile ayni)</p>
              </div>
            </div>
          )}

          {/* 8. Ebeveyn */}
          <div className="form-section bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-base font-bold text-indigo-400 mb-6">Ebeveyn Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-200 border-b border-slate-700/50 pb-2 text-sm">Baba Bilgileri</h4>
                <div>
                  <label className="form-label">Baba Adi *</label>
                  <input {...register('father_first_name', { required: 'Baba adi gereklidir' })} type="text" className="input-field" placeholder="Orn: Mehmet" />
                </div>
                <div>
                  <label className="form-label">Baba Soyadi *</label>
                  <input {...register('father_last_name', { required: 'Baba soyadi gereklidir' })} type="text" className="input-field" placeholder="Orn: Yilmaz" />
                </div>
                <div>
                  <label className="form-label">Baba Milliyeti *</label>
                  <input {...register('father_nationality', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Turkiye" defaultValue="Türkiye" />
                </div>
                <div>
                  <label className="form-label">Baba Dogum Tarihi *</label>
                  <input {...register('father_birth_date', { required: 'Baba dogum tarihi gereklidir' })} type="date" className="input-field" />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-200 border-b border-slate-700/50 pb-2 text-sm">Anne Bilgileri</h4>
                <div>
                  <label className="form-label">Anne Adi *</label>
                  <input {...register('mother_first_name', { required: 'Anne adi gereklidir' })} type="text" className="input-field" placeholder="Orn: Fatma" />
                </div>
                <div>
                  <label className="form-label">Anne Soyadi *</label>
                  <input {...register('mother_last_name', { required: 'Anne soyadi gereklidir' })} type="text" className="input-field" placeholder="Orn: Yilmaz" />
                </div>
                <div>
                  <label className="form-label">Anne Milliyeti *</label>
                  <input {...register('mother_nationality', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Turkiye" defaultValue="Türkiye" />
                </div>
                <div>
                  <label className="form-label">Anne Dogum Tarihi *</label>
                  <input {...register('mother_birth_date', { required: 'Anne dogum tarihi gereklidir' })} type="date" className="input-field" />
                </div>
              </div>
            </div>
          </div>

          {/* 9. Cocuk */}
          <div className="form-section bg-yellow-500/5 border-yellow-500/20">
            <h3 className="text-base font-bold text-yellow-400 mb-6">Cocuk Bilgileri</h3>
            <div className="mb-4">
              <label className="form-label">Cocuk Sayisi *</label>
              <select {...register('children_count', { required: 'Cocuk sayisi gereklidir', valueAsNumber: true })} className="input-field max-w-xs">
                <option value="">Seciniz</option>
                <option value="0">Cocuk Yok</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Cocuk</option>)}
              </select>
            </div>
            {childrenCount > 0 && (
              <div className="space-y-4">
                {Array.from({ length: childrenCount }, (_, i) => (
                  <div key={i} className="border border-yellow-500/20 rounded-xl p-4 bg-yellow-500/5">
                    <h4 className="font-semibold text-yellow-300 mb-4 text-sm">{i + 1}. Cocuk</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Ad *</label>
                        <input {...register(`children_${i}_first_name` as any, { required: 'Gerekli' })} type="text" className="input-field" placeholder="Adi" />
                      </div>
                      <div>
                        <label className="form-label">Soyad *</label>
                        <input {...register(`children_${i}_last_name` as any, { required: 'Gerekli' })} type="text" className="input-field" placeholder="Soyadi" />
                      </div>
                      <div>
                        <label className="form-label">Milliyet *</label>
                        <input {...register(`children_${i}_nationality` as any, { required: 'Gerekli' })} type="text" className="input-field" defaultValue="Türkiye" />
                      </div>
                      <div>
                        <label className="form-label">Dogum Tarihi *</label>
                        <input {...register(`children_${i}_birth_date` as any, { required: 'Gerekli' })} type="date" className="input-field" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/customers" className="btn-secondary">Iptal</Link>
            <button
              type="submit"
              disabled={loading || !!tcDuplicate}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Musteriyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
