'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ClipboardDocumentIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface FormExtensionData {
  id: string
  access_token: string
  customer: { full_name: string; passport_number: string }
  chinese_company: { company_name: string }
  turkish_company: { company_name: string }
  travel_start_date: string
  travel_end_date: string
  visa_type: string
}

export default function FormExtensionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormExtensionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    async function loadForm() {
      if (!user || !id) return
      try {
        const { data, error } = await supabase
          .from('forms')
          .select(`*, customer:customers(full_name, passport_number), chinese_company:chinese_companies(company_name), turkish_company:turkish_companies(company_name)`)
          .eq('id', id as string).eq('created_by', user.id).single()
        if (error) throw error
        setFormData(data as any)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Form yuklenemedi')
      } finally { setLoading(false) }
    }
    loadForm()
  }, [user, id, supabase])

  const handleCopyToken = async () => {
    if (!formData) return
    const success = await copyToClipboard(formData.access_token)
    if (success) { toast.success('Token kopyalandi!'); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const handleCopyApiUrl = async () => {
    if (!formData) return
    const apiUrl = `${window.location.origin}/api/forms/${formData.access_token}`
    const success = await copyToClipboard(apiUrl)
    if (success) toast.success('API URL kopyalandi!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Form Bulunamadi</h2>
          <p className="text-slate-400 mb-4">Bu form mevcut degil veya erisim yetkiniz yok.</p>
          <Link href="/forms" className="btn-primary">Formlara Don</Link>
        </div>
      </div>
    )
  }

  const steps = [
    { num: 1, title: 'Chrome Extension\'i Yukle', desc: 'Fox Vize Chrome extension\'ini tarayiciniza yukleyin.', color: 'blue' },
    { num: 2, title: 'Vize Sayfasina Git', desc: 'Cin konsoloslugu vize basvuru sayfasina gidin.', color: 'blue' },
    { num: 3, title: 'Token\'i Gir', desc: 'Extension popup\'inda yukaridaki access token\'i girin.', color: 'blue' },
    { num: 4, title: 'Otomatik Doldur', desc: '"Form Doldur" butonuna basarak formu otomatik doldurun!', color: 'emerald' },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href={`/forms/${id}`} className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Form Detayina Don
        </Link>
        <h1 className="page-title">Chrome Extension Icin Hazir</h1>
        <p className="text-slate-500 text-sm">Bu formun Chrome extension entegrasyonu</p>
      </div>

      {/* Form Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Form Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Musteri:</span><p className="text-white">{formData.customer.full_name}</p></div>
          <div><span className="text-slate-500">Pasaport:</span><p className="text-white">{formData.customer.passport_number}</p></div>
          <div><span className="text-slate-500">Cinli Sirket:</span><p className="text-white">{formData.chinese_company.company_name}</p></div>
          <div><span className="text-slate-500">Turk Sirket:</span><p className="text-white">{formData.turkish_company.company_name}</p></div>
          <div><span className="text-slate-500">Seyahat:</span><p className="text-white">{new Date(formData.travel_start_date).toLocaleDateString('tr-TR')} - {new Date(formData.travel_end_date).toLocaleDateString('tr-TR')}</p></div>
          <div><span className="text-slate-500">Vize Turu:</span><p className="text-white">{formData.visa_type}</p></div>
        </div>
      </div>

      {/* Access Token */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Access Token</h2>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Hazir</span>
        </div>
        <div className="bg-[#060912] rounded-xl p-4 border border-slate-700/50 flex items-center justify-between gap-3">
          <code className="text-emerald-400 break-all font-mono text-sm flex-1">{formData.access_token}</code>
          <button onClick={handleCopyToken} className="shrink-0 btn-primary text-sm py-2 flex items-center gap-1.5">
            {copied ? <><CheckIcon className="h-4 w-4" /> Kopyalandi</> : <><ClipboardDocumentIcon className="h-4 w-4" /> Kopyala</>}
          </button>
        </div>
      </div>

      {/* API URL */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">API Endpoint</h2>
        <div className="bg-[#060912] rounded-xl p-4 border border-slate-700/50 flex items-center justify-between gap-3">
          <code className="text-slate-300 break-all font-mono text-xs flex-1">{typeof window !== 'undefined' ? window.location.origin : ''}/api/forms/{formData.access_token}</code>
          <button onClick={handleCopyApiUrl} className="shrink-0 btn-secondary text-sm py-2 flex items-center gap-1.5">
            <ClipboardDocumentIcon className="h-4 w-4" /> Kopyala
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Chrome Extension Kullanimi</h2>
        <div className="space-y-5">
          {steps.map((step) => (
            <div key={step.num} className="flex items-start gap-4">
              <div className={`shrink-0 w-8 h-8 rounded-xl bg-${step.color}-500/10 text-${step.color}-400 border border-${step.color}-500/20 flex items-center justify-center text-sm font-bold`}>
                {step.num}
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
