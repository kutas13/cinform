'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ArrowLeftIcon, ClipboardDocumentIcon, CheckIcon,
  ExclamationTriangleIcon, CogIcon,
} from '@heroicons/react/24/outline'

interface FormData {
  id: string
  access_token: string
  travel_name: string | null
  customer: { full_name: string; tc_number: string }
  chinese_company: { company_name: string; city: string }
  turkish_company: { company_name: string }
  travel_start_date: string
  travel_end_date: string
  visa_type: string
  visa_validity_months?: number
  max_duration_days?: number
  entries_type?: string
  created_at: string
}

export default function FormDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    async function loadForm() {
      if (!user || !id) return
      try {
        const { data, error } = await supabase
          .from('forms')
          .select(`*, customer:customers(full_name, tc_number), chinese_company:chinese_companies(company_name, city), turkish_company:turkish_companies(company_name)`)
          .eq('id', id as string).eq('created_by', user.id).single()
        if (error) throw error
        setFormData(data as any)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Form yuklenemedi')
        router.push('/forms')
      } finally { setLoading(false) }
    }
    loadForm()
  }, [user, id, supabase, router])

  const handleCopyToken = async () => {
    if (!formData) return
    const success = await copyToClipboard(formData.access_token)
    if (success) { toast.success('Access Token kopyalandi!'); setCopied(true); setTimeout(() => setCopied(false), 3000) }
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
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-500">Form bilgileri yukleniyor...</p>
        </div>
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

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/forms" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Formlara Geri Don
          </Link>
          <h1 className="page-title">Form Detaylari</h1>
          <p className="text-slate-500 text-sm">Chrome extension icin hazir form</p>
        </div>
        <Link href={`/forms/${id}/extension`} className="btn-secondary flex items-center gap-2">
          <CogIcon className="h-4 w-4" /> Extension
        </Link>
      </div>

      {/* Success */}
      <div className="card p-6 mb-6 border-l-4 border-emerald-500/50">
        <h2 className="text-lg font-bold text-emerald-400 mb-1">Form Basariyla Olusturuldu!</h2>
        <p className="text-slate-400 text-sm">Asagidaki access token'i Chrome extension'da kullanabilirsiniz.</p>
      </div>

      {/* Form Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Form Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {formData.travel_name && (
            <div className="md:col-span-2">
              <span className="text-slate-500">Seyahat Bilgisi Adi:</span>
              <p className="text-blue-400 font-semibold">{formData.travel_name}</p>
            </div>
          )}
          <div><span className="text-slate-500">Musteri:</span><p className="text-white">{formData.customer.full_name}</p></div>
          <div><span className="text-slate-500">TC Kimlik:</span><p className="text-white font-mono">{formData.customer.tc_number}</p></div>
          <div><span className="text-slate-500">Cinli Sirket:</span><p className="text-white">{formData.chinese_company.company_name}</p></div>
          <div><span className="text-slate-500">Turk Sirket:</span><p className="text-white">{formData.turkish_company.company_name}</p></div>
          <div><span className="text-slate-500">Seyahat:</span><p className="text-white">{new Date(formData.travel_start_date).toLocaleDateString('tr-TR')} - {new Date(formData.travel_end_date).toLocaleDateString('tr-TR')}</p></div>
          <div><span className="text-slate-500">Vize Turu:</span><p className="text-white">{formData.visa_type}</p></div>
          {formData.visa_validity_months && <div><span className="text-slate-500">Gecerlilik:</span><p className="text-white">{formData.visa_validity_months} ay</p></div>}
          {formData.max_duration_days && <div><span className="text-slate-500">Kalis Suresi:</span><p className="text-white">{formData.max_duration_days} gun</p></div>}
          <div><span className="text-slate-500">Olusturulma:</span><p className="text-white">{new Date(formData.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
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

      {/* API Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">API Bilgileri</h2>
        <div className="bg-[#060912] rounded-xl p-4 border border-slate-700/50 flex items-center justify-between gap-3">
          <code className="text-slate-300 break-all font-mono text-xs flex-1">{typeof window !== 'undefined' ? window.location.origin : ''}/api/forms/{formData.access_token}</code>
          <button onClick={handleCopyApiUrl} className="shrink-0 btn-secondary text-sm py-2 flex items-center gap-1.5">
            <ClipboardDocumentIcon className="h-4 w-4" /> Kopyala
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/customers/new" className="btn-primary text-center py-3">Yeni Musteri</Link>
        <Link href="/forms/new" className="btn-success text-center py-3">Yeni Form</Link>
        <Link href={`/forms/${id}/extension`} className="btn-secondary text-center py-3">Extension Sayfasi</Link>
      </div>
    </div>
  )
}
