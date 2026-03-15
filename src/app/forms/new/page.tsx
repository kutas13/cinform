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

interface Customer {
  id: string
  full_name: string
  tc_number: string
}

interface ChineseCompany {
  id: string
  company_name: string
  city: string
}

interface TurkishCompany {
  id: string
  company_name: string
  address: string
}

export default function NewFormPage() {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [chineseCompanies, setChineseCompanies] = useState<ChineseCompany[]>([])
  const [turkishCompanies, setTurkishCompanies] = useState<TurkishCompany[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
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
  } = useForm<FormData>()

  const beenToChina = watch('been_to_china')
  const fingerprintGiven = watch('fingerprint_given')

  // Load dropdown data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        const [customersRes, chineseRes, turkishRes] = await Promise.all([
          supabase
            .from('customers')
            .select('id, full_name, tc_number')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('chinese_companies')
            .select('id, company_name, city')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('turkish_companies')
            .select('id, company_name, address')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false }),
        ])

        setCustomers(customersRes.data || [])
        setChineseCompanies(chineseRes.data || [])
        setTurkishCompanies(turkishRes.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Veriler yüklenirken hata oluştu')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user, supabase])

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Giriş yapmanız gerekiyor')
      return
    }

    // Validate dates
    const startDate = new Date(data.travel_start_date)
    const endDate = new Date(data.travel_end_date)
    
    if (endDate <= startDate) {
      toast.error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır')
      return
    }

    setLoading(true)
    try {
      const accessToken = generateAccessToken()
      
      const insertData: Record<string, any> = {
        customer_id: data.customer_id,
        chinese_company_id: data.chinese_company_id,
        turkish_company_id: data.turkish_company_id,
        travel_start_date: data.travel_start_date,
        travel_end_date: data.travel_end_date,
        visa_type: data.visa_type,
        visa_validity_months: data.visa_validity_months,
        max_duration_days: data.max_duration_days,
        entries_type: data.entries_type,
        been_to_china: data.been_to_china === 'yes',
        fingerprint_given: data.fingerprint_given === 'yes',
        access_token: accessToken,
        created_by: user.id,
      }
      if (data.china_visa_number) insertData.china_visa_number = data.china_visa_number;
      if (data.china_visa_year) insertData.china_visa_year = data.china_visa_year;
      if (data.china_visa_month) insertData.china_visa_month = data.china_visa_month;
      if (data.fingerprint_date) insertData.fingerprint_date = data.fingerprint_date;

      const { data: formData, error } = await supabase
        .from('forms')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw error
      }

      toast.success('Form başarıyla oluşturuldu!')
      setCreatedToken(accessToken)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToken = async () => {
    if (!createdToken) return
    const success = await copyToClipboard(createdToken)
    if (success) {
      toast.success('🎉 Token kopyalandı!')
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  // Token oluşturulduysa göster
  if (createdToken) {
    return (
      <div className="min-h-screen bg-slate-950 bg-grid py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success */}
          <div className="card p-10 text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-emerald-500/20">
              <CheckIcon className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Form Olusturuldu!</h1>
            <p className="text-slate-400 text-lg">
              Asagidaki token'i Chrome extension'da kullanabilirsiniz.
            </p>
          </div>

          {/* Token Box */}
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Access Token</h2>
            
            <div className="bg-slate-950 rounded-xl p-5 mb-4 border border-slate-700">
              <code className="text-emerald-400 break-all font-mono text-sm block mb-4">
                {createdToken}
              </code>
              <button
                onClick={handleCopyToken}
                className="w-full flex items-center justify-center space-x-2 btn-primary py-3.5 text-base"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    <span>Kopyalandi!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-5 w-5" />
                    <span>Token'i Kopyala</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Bu token'i kaybetmeyin! Chrome extension'da "Form ID" alanina yapistirin.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/forms/new" className="btn-success text-center py-3">
              Yeni Form
            </Link>
            <Link href="/dashboard" className="btn-primary text-center py-3">
              Dashboard
            </Link>
            <Link href="/customers/new" className="btn-secondary text-center py-3">
              Yeni Musteri
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/forms" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Formlara Geri Don
          </Link>
          <h1 className="page-title">Yeni Form Olustur</h1>
          <p className="text-slate-400 mt-1">Vize basvuru formu olusturun</p>
        </div>

        {/* Check if required data exists */}
        {(customers.length === 0 || chineseCompanies.length === 0 || turkishCompanies.length === 0) && (
          <div className="card p-6 mb-8 border-l-4 border-amber-500">
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Eksik Bilgiler</h3>
            <p className="text-slate-400 mb-4">
              Form oluşturmak için aşağıdaki bilgilerin tamamlanmış olması gerekiyor:
            </p>
            <ul className="space-y-2 text-slate-300">
              {customers.length === 0 && (
                <li>• En az 1 müşteri ({' '}
                  <Link href="/customers/new" className="underline font-semibold">
                    Müşteri Oluştur
                  </Link>
                  )</li>
              )}
              {chineseCompanies.length === 0 && (
                <li>• En az 1 Çinli şirket ({' '}
                  <Link href="/chinese-companies/new" className="underline font-semibold">
                    Çinli Şirket Oluştur
                  </Link>
                  )</li>
              )}
              {turkishCompanies.length === 0 && (
                <li>• En az 1 Türk şirket ({' '}
                  <Link href="/turkish-companies/new" className="underline font-semibold">
                    Türk Şirket Oluştur
                  </Link>
                  )</li>
              )}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company & Customer Selection */}
            <div className="form-section bg-slate-800/50 border-slate-700">
              <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">
                Sirket ve Musteri Secimi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer */}
                <div>
                  <label className="form-label">Müşteri Seç *</label>
                  <select
                    {...register('customer_id', { required: 'Müşteri seçimi gereklidir' })}
                    className="input-field"
                    disabled={customers.length === 0}
                  >
                    <option value="">Müşteri Seçin</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} ({customer.tc_number})
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.customer_id.message}</p>
                  )}
                </div>

                {/* Chinese Company */}
                <div>
                  <label className="form-label">Çinli Şirket Seç *</label>
                  <select
                    {...register('chinese_company_id', { required: 'Çinli şirket seçimi gereklidir' })}
                    className="input-field"
                    disabled={chineseCompanies.length === 0}
                  >
                    <option value="">Çinli Şirket Seçin</option>
                    {chineseCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name} ({company.city})
                      </option>
                    ))}
                  </select>
                  {errors.chinese_company_id && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.chinese_company_id.message}</p>
                  )}
                </div>

                {/* Turkish Company */}
                <div>
                  <label className="form-label">Türk Şirket Seç *</label>
                  <select
                    {...register('turkish_company_id', { required: 'Türk şirket seçimi gereklidir' })}
                    className="input-field"
                    disabled={turkishCompanies.length === 0}
                  >
                    <option value="">Türk Şirket Seçin</option>
                    {turkishCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.turkish_company_id && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.turkish_company_id.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Travel Information */}
            <div className="form-section bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-lg font-bold text-indigo-400 mb-6">
                ✈️ Seyahat Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="form-label">Seyahat Başlangıç Tarihi *</label>
                  <input
                    {...register('travel_start_date', { required: 'Başlangıç tarihi gereklidir' })}
                    type="date"
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.travel_start_date && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.travel_start_date.message}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="form-label">Seyahat Bitiş Tarihi *</label>
                  <input
                    {...register('travel_end_date', { required: 'Bitiş tarihi gereklidir' })}
                    type="date"
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.travel_end_date && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.travel_end_date.message}</p>
                  )}
                </div>

                {/* Visa Type */}
                <div className="md:col-span-2">
                  <label className="form-label">Vize Türü *</label>
                  <select
                    {...register('visa_type', { required: 'Vize türü gereklidir' })}
                    className="input-field"
                  >
                    <option value="">Vize Türü Seçin</option>
                    <option value="Commercial and trade activities">Ticari ve Ticaret Faaliyetleri (M)</option>
                    <option value="Tourism">Turist Vizesi</option>
                    <option value="Business">İş Vizesi</option>
                    <option value="Transit">Transit Vize</option>
                    <option value="Other">Diğer</option>
                  </select>
                  {errors.visa_type && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.visa_type.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Visa Details Information */}
            <div className="form-section bg-emerald-500/5 border-emerald-500/20">
              <h3 className="text-lg font-bold text-emerald-400 mb-6">
                📋 Vize Detay Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visa Validity Months */}
                <div>
                  <label className="form-label">Kaç Aylık Vize? *</label>
                  <select
                    {...register('visa_validity_months', { 
                      required: 'Vize geçerlilik süresi gereklidir',
                      valueAsNumber: true 
                    })}
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="1">1 Ay</option>
                    <option value="3">3 Ay</option>
                    <option value="6">6 Ay</option>
                    <option value="12">12 Ay</option>
                    <option value="24">24 Ay</option>
                  </select>
                  {errors.visa_validity_months && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.visa_validity_months.message}</p>
                  )}
                </div>

                {/* Max Duration Days */}
                <div>
                  <label className="form-label">Kaç Gün Kalış? *</label>
                  <select
                    {...register('max_duration_days', { 
                      required: 'Kalış süresi gereklidir',
                      valueAsNumber: true 
                    })}
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="30">30 Gün</option>
                    <option value="60">60 Gün</option>
                    <option value="90">90 Gün</option>
                    <option value="180">180 Gün</option>
                    <option value="365">365 Gün</option>
                  </select>
                  {errors.max_duration_days && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.max_duration_days.message}</p>
                  )}
                </div>

                {/* Entries Type */}
                <div>
                  <label className="form-label">Giriş Türü *</label>
                  <select
                    {...register('entries_type', { required: 'Giriş türü gereklidir' })}
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Single">Single (Tek Giriş)</option>
                    <option value="Double">Double (Çift Giriş)</option>
                    <option value="Multiple">Multiple (Çoklu Giriş)</option>
                  </select>
                  {errors.entries_type && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.entries_type.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* China Visit Info */}
            <div className="form-section bg-amber-500/5 border-amber-500/20">
              <h3 className="text-lg font-bold text-amber-400 mb-6">
                Cin Ziyaret Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-800">
              <Link href="/forms" className="btn-secondary">
                İptal
              </Link>
              <button
                type="submit"
                disabled={loading || customers.length === 0 || chineseCompanies.length === 0 || turkishCompanies.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Oluşturuluyor...' : 'Formu Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}