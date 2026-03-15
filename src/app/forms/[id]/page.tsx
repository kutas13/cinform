'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

interface FormData {
  id: string
  access_token: string
  travel_name: string | null
  customer: {
    full_name: string
    tc_number: string
  }
  chinese_company: {
    company_name: string
    city: string
  }
  turkish_company: {
    company_name: string
  }
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadForm() {
      if (!user || !id) return

      try {
        const { data, error } = await supabase
          .from('forms')
          .select(`
            *,
            customer:customers(full_name, tc_number),
            chinese_company:chinese_companies(company_name, city),
            turkish_company:turkish_companies(company_name)
          `)
          .eq('id', id as string)
          .eq('created_by', user.id)
          .single()

        if (error) throw error
        setFormData(data as any)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Form yüklenemedi')
        router.push('/forms')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [user, id, supabase, router])

  const handleCopyToken = async () => {
    if (!formData) return

    const success = await copyToClipboard(formData.access_token)
    if (success) {
      toast.success('🎉 Access Token kopyalandı!')
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      toast.error('Kopyalama başarısız')
    }
  }

  const handleCopyApiUrl = async () => {
    if (!formData) return

    const apiUrl = `${window.location.origin}/api/forms/${formData.access_token}`
    const success = await copyToClipboard(apiUrl)
    if (success) {
      toast.success('API URL kopyalandı!')
    } else {
      toast.error('Kopyalama başarısız')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Form bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Bu form mevcut değil veya erişim yetkiniz yok.</p>
          <Link href="/forms" className="btn-primary">
            Formlara Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/forms"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Formlara Geri Dön
            </Link>
            <h1 className="page-title">Form Detayları</h1>
            <p className="text-gray-600">Chrome extension için hazır form</p>
          </div>
          <Link
            href={`/forms/${id}/extension`}
            className="btn-secondary flex items-center"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Extension Sayfası
          </Link>
        </div>

        {/* Success Message */}
        <div className="card p-6 mb-6 bg-green-50 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-800 mb-2">🎉 Form Başarıyla Oluşturuldu!</h2>
          <p className="text-green-700">
            Vize formu hazır. Aşağıdaki access token'ı Chrome extension'da kullanabilirsiniz.
          </p>
        </div>

        {/* Form Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Form Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {formData.travel_name && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-500">Seyahat Bilgisi Adı:</span>
                <p className="text-indigo-600 font-semibold">{formData.travel_name}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-500">Müşteri:</span>
              <p className="text-gray-900">{formData.customer.full_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">TC Kimlik:</span>
              <p className="text-gray-900">{formData.customer.tc_number}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Çinli Şirket:</span>
              <p className="text-gray-900">{formData.chinese_company.company_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Türk Şirket:</span>
              <p className="text-gray-900">{formData.turkish_company.company_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Seyahat:</span>
              <p className="text-gray-900">
                {new Date(formData.travel_start_date).toLocaleDateString('tr-TR')} - {' '}
                {new Date(formData.travel_end_date).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Vize Türü:</span>
              <p className="text-gray-900">{formData.visa_type}</p>
            </div>
            {formData.visa_validity_months && (
              <div>
                <span className="font-medium text-gray-500">Geçerlilik:</span>
                <p className="text-gray-900">{formData.visa_validity_months} ay</p>
              </div>
            )}
            {formData.max_duration_days && (
              <div>
                <span className="font-medium text-gray-500">Kalış Süresi:</span>
                <p className="text-gray-900">{formData.max_duration_days} gün</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-500">Oluşturulma:</span>
              <p className="text-gray-900">
                {new Date(formData.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Access Token */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🔑 Access Token</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Chrome Extension İçin Hazır
            </span>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-green-400 break-all font-mono text-sm">
                {formData.access_token}
              </code>
              <button
                onClick={handleCopyToken}
                className="ml-4 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    <span>Token Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Bu token'ı Chrome extension'da kullanarak Çin vize formunu otomatik doldurabilirsiniz.
          </p>
        </div>

        {/* API Information */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔌 API Bilgileri</h2>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-gray-800 break-all font-mono text-sm">
                {window.location.origin}/api/forms/{formData.access_token}
              </code>
              <button
                onClick={handleCopyApiUrl}
                className="ml-4 flex items-center space-x-2 btn-secondary text-sm"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>API URL Kopyala</span>
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Chrome extension bu URL'den form verilerini çeker.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/customers/new" className="btn-primary text-center">
            👤 Yeni Müşteri
          </Link>
          <Link href="/forms/new" className="btn-success text-center">
            📝 Yeni Form
          </Link>
          <Link href={`/forms/${id}/extension`} className="btn-secondary text-center">
            🔧 Extension Sayfası
          </Link>
        </div>
      </div>
    </div>
  )
}