'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ExclamationTriangleIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FormPageShell from '@/components/shared/FormPageShell'
import {
  VISA_PDF_CUSTOMER_BACKUP_KEY,
  VISA_PDF_CUSTOMER_KEY,
} from '@/lib/visa-pdf-import-storage'

interface CustomerForm {
  full_name: string
  birth_year: number
  birth_city: string
  birth_province: string
  tc_number: string
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
  passport_issue_place: string
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

function generateAddress(index: number): string {
  const DAIRES_PER_NO = 15
  const MAX_NO = 140
  const PER_STREET = DAIRES_PER_NO * MAX_NO
  const streets = ['MENEKSELER SOKAK', 'FIDAN SOKAK']
  const streetIndex = Math.floor(index / PER_STREET)
  const street = streets[streetIndex % streets.length]
  const inStreet = index % PER_STREET
  const no = Math.floor(inStreet / DAIRES_PER_NO) + 1
  const daire = (inStreet % DAIRES_PER_NO) + 1
  return `YARIMBURGAZ MAH ${street} NO ${no} DAIRE ${daire}`
}

const STEPS = ['Temel', 'Konum', 'Iletisim', 'Aile', 'Cocuk']

export default function NewCustomerPage() {
  const [loading, setLoading] = useState(false)
  const [tcDuplicate, setTcDuplicate] = useState<{ full_name: string; tc_number: string } | null>(null)
  const [generatedAddress, setGeneratedAddress] = useState<string>('')
  const [activeStep, setActiveStep] = useState(0)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerForm>({
    defaultValues: {
      work_start_year: 2024,
      work_start_month: 1,
      work_end_year: 2024,
      work_end_month: 2,
      occupation_type: 'owner',
    },
  })

  useEffect(() => {
    if (!user) return
    async function fetchAddressIndex() {
      const { count } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user!.id)
      setGeneratedAddress(generateAddress(count || 0))
    }
    fetchAddressIndex()
  }, [user, supabase])

  const maritalStatus = watch('marital_status')
  const rawChildrenCount = watch('children_count')
  const childrenCount = Number(rawChildrenCount) || 0

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sessionPayload = sessionStorage.getItem(VISA_PDF_CUSTOMER_KEY)
    const backupPayload = localStorage.getItem(VISA_PDF_CUSTOMER_BACKUP_KEY)
    const raw = sessionPayload || backupPayload
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as Record<string, any>
      const setIfPresent = (field: keyof CustomerForm, value: unknown) => {
        if (value === undefined || value === null || value === '') return
        setValue(field, value as any, { shouldDirty: true })
      }

      setIfPresent('full_name', parsed.full_name)
      setIfPresent('birth_year', parsed.birth_year)
      setIfPresent('birth_city', parsed.birth_city)
      setIfPresent('birth_province', parsed.birth_province)
      setIfPresent('tc_number', parsed.tc_number)
      setIfPresent('marital_status', parsed.marital_status)
      setIfPresent('passport_issue_place', parsed.passport_issue_place)
      setIfPresent('phone_number', parsed.phone_number)
      setIfPresent('email', parsed.email)
      setIfPresent('occupation_type', parsed.occupation_type)
      setIfPresent('work_start_year', parsed.work_start_year)
      setIfPresent('work_start_month', parsed.work_start_month)
      setIfPresent('work_end_year', parsed.work_end_year)
      setIfPresent('work_end_month', parsed.work_end_month)
      setIfPresent('father_first_name', parsed.father_first_name)
      setIfPresent('father_last_name', parsed.father_last_name)
      setIfPresent('father_nationality', parsed.father_nationality)
      setIfPresent('father_birth_date', parsed.father_birth_date)
      setIfPresent('mother_first_name', parsed.mother_first_name)
      setIfPresent('mother_last_name', parsed.mother_last_name)
      setIfPresent('mother_nationality', parsed.mother_nationality)
      setIfPresent('mother_birth_date', parsed.mother_birth_date)
      setIfPresent('spouse_first_name', parsed.spouse_first_name)
      setIfPresent('spouse_last_name', parsed.spouse_last_name)
      setIfPresent('spouse_birth_date', parsed.spouse_birth_date)
      setIfPresent('spouse_birth_country', parsed.spouse_birth_country)
      setIfPresent('spouse_birth_city', parsed.spouse_birth_city)
      setIfPresent('children_count', parsed.children_count ?? 0)

      if (Array.isArray(parsed.children_data)) {
        parsed.children_data.forEach((child: any, index: number) => {
          if (!child) return
          setValue(`children_${index}_first_name` as any, child.first_name || '', { shouldDirty: true })
          setValue(`children_${index}_last_name` as any, child.last_name || '', { shouldDirty: true })
          setValue(`children_${index}_nationality` as any, child.nationality || 'Türkiye', { shouldDirty: true })
          setValue(`children_${index}_birth_date` as any, child.birth_date || '', { shouldDirty: true })
        })
      }
    } catch {
    } finally {
      sessionStorage.removeItem(VISA_PDF_CUSTOMER_KEY)
      localStorage.removeItem(VISA_PDF_CUSTOMER_BACKUP_KEY)
    }
  }, [setValue])

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

  const normalizeAiText = (value: unknown): string => {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim()
  }

  const onSubmit = async (data: CustomerForm) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }
    setLoading(true)
    try {
      const n = (v: unknown) => normalizeAiText(v)
      const cleanedData: Record<string, any> = {
        full_name: n(data.full_name),
        birth_year: data.birth_year,
        birth_city: n(data.birth_city),
        birth_province: n(data.birth_province),
        tc_number: data.tc_number,
        marital_status: data.marital_status,
        passport_issue_place: n(data.passport_issue_place),
        home_address: generatedAddress,
        phone_number: data.phone_number,
        email: data.email,
        father_first_name: n(data.father_first_name),
        father_last_name: n(data.father_last_name),
        father_nationality: data.father_nationality || 'Türkiye',
        mother_first_name: n(data.mother_first_name),
        mother_last_name: n(data.mother_last_name),
        mother_nationality: data.mother_nationality || 'Türkiye',
        children_count: data.children_count || 0,
        children_data: Array.from({ length: data.children_count || 0 }, (_, i) => ({
          first_name: n((data as any)[`children_${i}_first_name`] || ''),
          last_name: n((data as any)[`children_${i}_last_name`] || ''),
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

      if (data.father_birth_date && data.father_birth_date !== '') cleanedData.father_birth_date = data.father_birth_date
      if (data.mother_birth_date && data.mother_birth_date !== '') cleanedData.mother_birth_date = data.mother_birth_date

      if (data.marital_status === 'Married') {
        if (data.spouse_first_name) cleanedData.spouse_first_name = n(data.spouse_first_name)
        if (data.spouse_last_name) cleanedData.spouse_last_name = n(data.spouse_last_name)
        if (data.spouse_birth_date && data.spouse_birth_date !== '') cleanedData.spouse_birth_date = data.spouse_birth_date
        if (data.spouse_birth_country) cleanedData.spouse_birth_country = data.spouse_birth_country
        if (data.spouse_birth_city) cleanedData.spouse_birth_city = n(data.spouse_birth_city)
      }

      const { error } = await supabase.from('customers').insert(cleanedData as any)
      if (error) throw error
      toast.success('Musteri basariyla olusturuldu!')
      router.push('/customers')
    } catch (error: any) {
      console.error('Error:', error)
      if (error.code === '23505') toast.error('Bu TC kimlik numarasi zaten kullaniliyor')
      else if (error.message?.includes('date')) toast.error('Tarih formatinda hata var.')
      else toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPageShell
      title="Yeni Musteri"
      subtitle="Musteri bilgilerini girin"
      backHref="/customers"
      backLabel="Musteriler"
      icon={<UserGroupIcon className="h-6 w-6 text-violet-400" />}
      iconBgClass="bg-violet-500/10"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              i === activeStep
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i === activeStep ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-500'
            }`}>{i + 1}</span>
            {step}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 1. Temel Bilgiler */}
        <div className="form-section bg-violet-500/[0.03] border-violet-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-400">1</span>
            </div>
            <h3 className="text-sm font-bold text-violet-300 uppercase tracking-wider">Kimlik Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Ad Soyad *</label>
              <input {...register('full_name', { required: 'Ad soyad gereklidir' })} type="text" className="input-field" placeholder="Orn: Ahmet Yilmaz" />
              {errors.full_name && <p className="text-rose-400 text-xs mt-1.5">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Dogum Yili *</label>
              <input {...register('birth_year', { required: 'Dogum yili gereklidir', valueAsNumber: true })} type="number" className="input-field" placeholder="1990" min={1940} max={2010} />
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
                type="text" maxLength={11} className="input-field font-mono tracking-wider" placeholder="12345678901"
              />
              {errors.tc_number && <p className="text-rose-400 text-xs mt-1.5">{errors.tc_number.message}</p>}
              {tcDuplicate && (
                <div className="duplicate-warning">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Ayni TC Mevcut!</p>
                      <p className="text-xs text-amber-400/80 mt-1">&quot;{tcDuplicate.full_name}&quot; adli musteriye ait.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Medeni Hal *</label>
              <select {...register('marital_status', { required: 'Gerekli' })} className="input-field">
                <option value="">Seciniz</option>
                <option value="Single">Bekar</option>
                <option value="Married">Evli</option>
                <option value="Divorced">Bosanmis</option>
                <option value="Widowed">Dul</option>
                <option value="Other">Diger</option>
              </select>
            </div>
            <div>
              <label className="form-label">Pasaport Cikis Yeri *</label>
              <input {...register('passport_issue_place', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Istanbul" />
            </div>
          </div>
        </div>

        {/* 2. Dogum Yeri */}
        <div className="form-section bg-emerald-500/[0.03] border-emerald-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">2</span>
            </div>
            <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Dogum Yeri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Il *</label>
              <input {...register('birth_province', { required: 'Il gereklidir' })} type="text" className="input-field" placeholder="Istanbul" />
            </div>
            <div>
              <label className="form-label">Ilce *</label>
              <input {...register('birth_city', { required: 'Ilce gereklidir' })} type="text" className="input-field" placeholder="Kadikoy" />
            </div>
          </div>
        </div>

        {/* 3. Iletisim */}
        <div className="form-section bg-blue-500/[0.03] border-blue-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">3</span>
            </div>
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Iletisim</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Telefon *</label>
              <input {...register('phone_number', { required: 'Gerekli' })} type="tel" className="input-field" placeholder="+90 532 123 45 67" />
            </div>
            <div>
              <label className="form-label">E-posta *</label>
              <input {...register('email', { required: 'Gerekli', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Gecersiz' } })} type="email" className="input-field" placeholder="ornek@email.com" />
            </div>
          </div>
        </div>

        <input type="hidden" {...register('occupation_type')} />
        <input type="hidden" {...register('work_start_year', { valueAsNumber: true })} />
        <input type="hidden" {...register('work_start_month', { valueAsNumber: true })} />
        <input type="hidden" {...register('work_end_year', { valueAsNumber: true })} />
        <input type="hidden" {...register('work_end_month', { valueAsNumber: true })} />

        {/* 4. Es + Ebeveyn */}
        {maritalStatus === 'Married' && (
          <div className="form-section bg-pink-500/[0.03] border-pink-500/20">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-pink-400">♥</span>
              </div>
              <h3 className="text-sm font-bold text-pink-300 uppercase tracking-wider">Es Bilgileri</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Es Adi *</label>
                <input {...register('spouse_first_name', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Ayse" />
              </div>
              <div>
                <label className="form-label">Es Soyadi *</label>
                <input {...register('spouse_last_name', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Yilmaz" />
              </div>
              <div>
                <label className="form-label">Es Dogum Tarihi *</label>
                <input {...register('spouse_birth_date', { required: 'Gerekli' })} type="date" className="input-field" />
              </div>
              <div>
                <label className="form-label">Es Dogum Ulkesi</label>
                <input {...register('spouse_birth_country')} type="text" className="input-field" defaultValue="Türkiye" />
              </div>
              <div>
                <label className="form-label">Es Dogum Sehri</label>
                <input {...register('spouse_birth_city')} type="text" className="input-field" placeholder="Ankara" />
              </div>
            </div>
          </div>
        )}

        <div className="form-section bg-indigo-500/[0.03] border-indigo-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-400">4</span>
            </div>
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Ebeveyn Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Baba</p>
              <div><label className="form-label">Ad *</label><input {...register('father_first_name', { required: 'Gerekli' })} className="input-field" placeholder="Mehmet" /></div>
              <div><label className="form-label">Soyad *</label><input {...register('father_last_name', { required: 'Gerekli' })} className="input-field" placeholder="Yilmaz" /></div>
              <div><label className="form-label">Milliyet</label><input {...register('father_nationality')} className="input-field" defaultValue="Türkiye" /></div>
              <div><label className="form-label">Dogum Tarihi *</label><input {...register('father_birth_date', { required: 'Gerekli' })} type="date" className="input-field" /></div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Anne</p>
              <div><label className="form-label">Ad *</label><input {...register('mother_first_name', { required: 'Gerekli' })} className="input-field" placeholder="Fatma" /></div>
              <div><label className="form-label">Soyad *</label><input {...register('mother_last_name', { required: 'Gerekli' })} className="input-field" placeholder="Yilmaz" /></div>
              <div><label className="form-label">Milliyet</label><input {...register('mother_nationality')} className="input-field" defaultValue="Türkiye" /></div>
              <div><label className="form-label">Dogum Tarihi *</label><input {...register('mother_birth_date', { required: 'Gerekli' })} type="date" className="input-field" /></div>
            </div>
          </div>
        </div>

        {/* 5. Cocuk */}
        <div className="form-section bg-amber-500/[0.03] border-amber-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400">5</span>
            </div>
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Cocuk Bilgileri</h3>
          </div>
          <div className="mb-4">
            <label className="form-label">Cocuk Sayisi</label>
            <select {...register('children_count', { valueAsNumber: true })} className="input-field max-w-[200px]">
              <option value="0">Cocuk Yok</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Cocuk</option>)}
            </select>
          </div>
          {childrenCount > 0 && (
            <div className="space-y-4 mt-4">
              {Array.from({ length: childrenCount }, (_, i) => (
                <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-amber-500/10">
                  <p className="text-xs font-bold text-amber-300 mb-3">{i + 1}. Cocuk</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="form-label">Ad *</label><input {...register(`children_${i}_first_name` as any, { required: 'Gerekli' })} className="input-field" /></div>
                    <div><label className="form-label">Soyad *</label><input {...register(`children_${i}_last_name` as any, { required: 'Gerekli' })} className="input-field" /></div>
                    <div><label className="form-label">Milliyet</label><input {...register(`children_${i}_nationality` as any)} className="input-field" defaultValue="Türkiye" /></div>
                    <div><label className="form-label">Dogum Tarihi *</label><input {...register(`children_${i}_birth_date` as any, { required: 'Gerekli' })} type="date" className="input-field" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
          <Link href="/customers" className="btn-secondary">Iptal</Link>
          <button
            type="submit"
            disabled={loading || !!tcDuplicate}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Kaydediliyor...' : 'Musteriyi Kaydet'}
            {!loading && <ChevronRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </FormPageShell>
  )
}
