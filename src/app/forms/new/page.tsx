'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateAccessToken, copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

interface FormData {
  customer_id: string
  chinese_company_id: string
  turkish_company_id: string
  travel_name: string
  travel_start_date: string
  travel_end_date: string
  visa_type: string
  visa_validity_months: number
  max_duration_days: number
  entries_type: 'Single' | 'Double' | 'Multiple'
  been_to_china: string
  china_visa_number?: string
  china_visa_year?: number
  china_visa_month?: number
  fingerprint_given?: string
  fingerprint_date?: string
}

interface SavedTravel {
  travel_name: string
  travel_start_date: string
  travel_end_date: string
  visa_type: string
  visa_validity_months: number
  max_duration_days: number
  entries_type: string
}

interface Customer { id: string; full_name: string; tc_number: string }
interface ChineseCompany { id: string; company_name: string; city: string }
interface TurkishCompany { id: string; company_name: string; address: string }

export default function NewFormPage() {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [chineseCompanies, setChineseCompanies] = useState<ChineseCompany[]>([])
  const [turkishCompanies, setTurkishCompanies] = useState<TurkishCompany[]>([])
  const [savedTravels, setSavedTravels] = useState<SavedTravel[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { max_duration_days: 30 },
  })

  const beenToChina = watch('been_to_china')
  const fingerprintGiven = watch('fingerprint_given')

  const handleSavedTravelSelect = (travelName: string) => {
    if (!travelName) return
    const travel = savedTravels.find(t => t.travel_name === travelName)
    if (!travel) return
    setValue('travel_name', travel.travel_name)
    setValue('travel_start_date', travel.travel_start_date)
    setValue('travel_end_date', travel.travel_end_date)
    setValue('visa_type', travel.visa_type)
    setValue('visa_validity_months', travel.visa_validity_months)
    setValue('max_duration_days', travel.max_duration_days)
    setValue('entries_type', travel.entries_type as 'Single' | 'Double' | 'Multiple')
    toast.success(`"${travel.travel_name}" seyahat bilgileri yuklendi`)
  }

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        const [customersRes, chineseRes, turkishRes, travelsRes] = await Promise.all([
          supabase.from('customers').select('id, full_name, tc_number').eq('created_by', user.id).order('created_at', { ascending: false }),
          supabase.from('chinese_companies').select('id, company_name, city').eq('created_by', user.id).order('created_at', { ascending: false }),
          supabase.from('turkish_companies').select('id, company_name, address').eq('created_by', user.id).order('created_at', { ascending: false }),
          supabase.from('forms').select('travel_name, travel_start_date, travel_end_date, visa_type, visa_validity_months, max_duration_days, entries_type').eq('created_by', user.id).not('travel_name', 'is', null).order('created_at', { ascending: false }),
        ])
        setCustomers(customersRes.data || [])
        setChineseCompanies(chineseRes.data || [])
        setTurkishCompanies(turkishRes.data || [])
        const uniqueTravels = (travelsRes.data || []).filter(
          (t: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.travel_name === t.travel_name) === i
        ) as SavedTravel[]
        setSavedTravels(uniqueTravels)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Veriler yuklenirken hata olustu')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [user, supabase])

  const onSubmit = async (data: FormData) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }
    const startDate = new Date(data.travel_start_date)
    const endDate = new Date(data.travel_end_date)
    if (endDate <= startDate) { toast.error('Bitis tarihi baslangictan sonra olmali'); return }

    setLoading(true)
    try {
      const accessToken = generateAccessToken()
      const insertData: Record<string, any> = {
        customer_id: data.customer_id, chinese_company_id: data.chinese_company_id,
        turkish_company_id: data.turkish_company_id, travel_name: data.travel_name || null,
        travel_start_date: data.travel_start_date, travel_end_date: data.travel_end_date,
        visa_type: data.visa_type, visa_validity_months: data.visa_validity_months,
        max_duration_days: data.max_duration_days, entries_type: data.entries_type,
        been_to_china: data.been_to_china === 'yes', fingerprint_given: data.fingerprint_given === 'yes',
        access_token: accessToken, created_by: user.id,
      }
      if (data.china_visa_number) insertData.china_visa_number = data.china_visa_number
      if (data.china_visa_year) insertData.china_visa_year = data.china_visa_year
      if (data.china_visa_month) insertData.china_visa_month = data.china_visa_month
      if (data.fingerprint_date) insertData.fingerprint_date = data.fingerprint_date

      const { error } = await supabase.from('forms').insert(insertData).select().single()
      if (error) throw error
      toast.success('Form basariyla olusturuldu!')
      setCreatedToken(accessToken)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToken = async () => {
    if (!createdToken) return
    const success = await copyToClipboard(createdToken)
    if (success) { toast.success('Token kopyalandi!'); setCopied(true); setTimeout(() => setCopied(false), 3000) }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-500">Veriler yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (createdToken) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto">
        <div className="card p-10 text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckIcon className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Form Olusturuldu!</h1>
          <p className="text-slate-400">Asagidaki token'i Chrome extension'da kullanabilirsiniz.</p>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Access Token</h2>
          <div className="bg-[#0a0e1a] rounded-xl p-5 mb-4 border border-slate-700/50">
            <code className="text-emerald-400 break-all font-mono text-sm block mb-4">{createdToken}</code>
            <button onClick={handleCopyToken} className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2">
              {copied ? <><CheckIcon className="h-5 w-5" /> Kopyalandi!</> : <><ClipboardDocumentIcon className="h-5 w-5" /> Token'i Kopyala</>}
            </button>
          </div>
          <p className="text-xs text-slate-600 text-center">Chrome extension'da "Form ID" alanina yapistirin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/forms/new" className="btn-success text-center py-3">Yeni Form</Link>
          <Link href="/dashboard" className="btn-primary text-center py-3">Dashboard</Link>
          <Link href="/customers/new" className="btn-secondary text-center py-3">Yeni Musteri</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/forms" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Formlara Geri Don
        </Link>
        <h1 className="page-title">Yeni Form Olustur</h1>
        <p className="text-slate-500 mt-1 text-sm">Vize basvuru formu olusturun</p>
      </div>

      {(customers.length === 0 || chineseCompanies.length === 0 || turkishCompanies.length === 0) && (
        <div className="card p-6 mb-8 border-l-4 border-amber-500/50">
          <h3 className="text-base font-semibold text-amber-400 mb-2">Eksik Bilgiler</h3>
          <p className="text-slate-400 text-sm mb-3">Form olusturmak icin asagidaki bilgiler gerekli:</p>
          <ul className="space-y-1.5 text-slate-300 text-sm">
            {customers.length === 0 && <li>• En az 1 musteri (<Link href="/customers/new" className="underline text-blue-400">Musteri Olustur</Link>)</li>}
            {chineseCompanies.length === 0 && <li>• En az 1 Cinli sirket (<Link href="/chinese-companies/new" className="underline text-blue-400">Cinli Sirket Olustur</Link>)</li>}
            {turkishCompanies.length === 0 && <li>• En az 1 Turk sirket (<Link href="/turkish-companies/new" className="underline text-blue-400">Turk Sirket Olustur</Link>)</li>}
          </ul>
        </div>
      )}

      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Secimler */}
          <div className="form-section bg-slate-800/30 border-slate-700/50">
            <h3 className="text-base font-bold text-slate-200 mb-5">Sirket ve Musteri Secimi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="form-label">Musteri Sec *</label>
                <select {...register('customer_id', { required: 'Musteri secimi gerekli' })} className="input-field" disabled={customers.length === 0}>
                  <option value="">Musteri Secin</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.tc_number})</option>)}
                </select>
                {errors.customer_id && <p className="text-rose-400 text-xs mt-1.5">{errors.customer_id.message}</p>}
              </div>
              <div>
                <label className="form-label">Cinli Sirket Sec *</label>
                <select {...register('chinese_company_id', { required: 'Cinli sirket secimi gerekli' })} className="input-field" disabled={chineseCompanies.length === 0}>
                  <option value="">Cinli Sirket Secin</option>
                  {chineseCompanies.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.city})</option>)}
                </select>
                {errors.chinese_company_id && <p className="text-rose-400 text-xs mt-1.5">{errors.chinese_company_id.message}</p>}
              </div>
              <div>
                <label className="form-label">Turk Sirket Sec *</label>
                <select {...register('turkish_company_id', { required: 'Turk sirket secimi gerekli' })} className="input-field" disabled={turkishCompanies.length === 0}>
                  <option value="">Turk Sirket Secin</option>
                  {turkishCompanies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                {errors.turkish_company_id && <p className="text-rose-400 text-xs mt-1.5">{errors.turkish_company_id.message}</p>}
              </div>
            </div>
          </div>

          {/* Seyahat */}
          <div className="form-section bg-blue-500/5 border-blue-500/20">
            <h3 className="text-base font-bold text-blue-400 mb-6">Seyahat Bilgileri</h3>
            {savedTravels.length > 0 && (
              <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <label className="form-label text-blue-300">Kayitli Seyahatleri Getir</label>
                <select className="input-field" onChange={(e) => handleSavedTravelSelect(e.target.value)} defaultValue="">
                  <option value="">Kayitli seyahat secin...</option>
                  {savedTravels.map((t, i) => <option key={i} value={t.travel_name}>{t.travel_name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Seyahat Bilgisi Adi</label>
                <input {...register('travel_name')} type="text" className="input-field" placeholder="Orn: Guangzhou Ticari Ziyaret 2026" />
                <p className="text-xs text-slate-600 mt-1">Isim vererek sonraki formlarda tekrar kullanabilirsiniz</p>
              </div>
              <div>
                <label className="form-label">Baslangic Tarihi *</label>
                <input {...register('travel_start_date', { required: 'Gerekli' })} type="date" className="input-field" min={new Date().toISOString().split('T')[0]} />
                {errors.travel_start_date && <p className="text-rose-400 text-xs mt-1.5">{errors.travel_start_date.message}</p>}
              </div>
              <div>
                <label className="form-label">Bitis Tarihi *</label>
                <input {...register('travel_end_date', { required: 'Gerekli' })} type="date" className="input-field" min={new Date().toISOString().split('T')[0]} />
                {errors.travel_end_date && <p className="text-rose-400 text-xs mt-1.5">{errors.travel_end_date.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Vize Turu *</label>
                <select {...register('visa_type', { required: 'Vize turu gerekli' })} className="input-field">
                  <option value="">Vize Turu Secin</option>
                  <option value="Commercial and trade activities">Ticari ve Ticaret Faaliyetleri (M)</option>
                  <option value="Tourism">Turist Vizesi</option>
                  <option value="Business">Is Vizesi</option>
                  <option value="Transit">Transit Vize</option>
                  <option value="Other">Diger</option>
                </select>
                {errors.visa_type && <p className="text-rose-400 text-xs mt-1.5">{errors.visa_type.message}</p>}
              </div>
            </div>
          </div>

          {/* Vize Detay */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-base font-bold text-emerald-400 mb-6">Vize Detay Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="form-label">Kac Aylik Vize? *</label>
                <select {...register('visa_validity_months', { required: 'Gerekli', valueAsNumber: true })} className="input-field">
                  <option value="">Seciniz</option>
                  <option value="3">3 Ay</option>
                  <option value="6">6 Ay</option>
                  <option value="12">12 Ay</option>
                </select>
              </div>
              <div>
                <label className="form-label">Kac Gun Kalis? *</label>
                <input {...register('max_duration_days', { required: 'Gerekli', valueAsNumber: true, min: { value: 1, message: 'En az 1' }, max: { value: 365, message: 'En fazla 365' } })} type="number" className="input-field" placeholder="30" min={1} max={365} />
              </div>
              <div>
                <label className="form-label">Giris Turu *</label>
                <select {...register('entries_type', { required: 'Gerekli' })} className="input-field">
                  <option value="">Seciniz</option>
                  <option value="Single">Single (Tek Giris)</option>
                  <option value="Double">Double (Cift Giris)</option>
                  <option value="Multiple">Multiple (Coklu Giris)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cin Ziyaret */}
          <div className="form-section bg-amber-500/5 border-amber-500/20">
            <h3 className="text-base font-bold text-amber-400 mb-6">Cin Ziyaret Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Daha once Cin'e gittiniz mi? *</label>
                <select {...register('been_to_china', { required: 'Secim gerekli' })} className="input-field">
                  <option value="">Seciniz</option>
                  <option value="yes">Evet</option>
                  <option value="no">Hayir</option>
                </select>
              </div>
              {beenToChina === 'yes' && (
                <>
                  <div>
                    <label className="form-label">Vize No *</label>
                    <input {...register('china_visa_number')} className="input-field" placeholder="Vize numarasi" />
                  </div>
                  <div>
                    <label className="form-label">Vize Yili *</label>
                    <input {...register('china_visa_year', { valueAsNumber: true })} type="number" className="input-field" placeholder="2024" />
                  </div>
                  <div>
                    <label className="form-label">Vize Ayi *</label>
                    <select {...register('china_visa_month', { valueAsNumber: true })} className="input-field">
                      <option value="">Ay Secin</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Parmak izi verildi mi? *</label>
                    <select {...register('fingerprint_given')} className="input-field">
                      <option value="">Seciniz</option>
                      <option value="yes">Evet</option>
                      <option value="no">Hayir</option>
                    </select>
                  </div>
                  {fingerprintGiven === 'yes' && (
                    <div>
                      <label className="form-label">Parmak Izi Tarihi *</label>
                      <input {...register('fingerprint_date')} type="date" className="input-field" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/forms" className="btn-secondary">Iptal</Link>
            <button
              type="submit"
              disabled={loading || customers.length === 0 || chineseCompanies.length === 0 || turkishCompanies.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Olusturuluyor...' : 'Formu Olustur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
