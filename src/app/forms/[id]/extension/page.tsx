'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
} from '@heroicons/react/24/outline'

interface FormExtensionData {
  id: string
  access_token: string
  customer: {
    full_name: string
    passport_number: string
  }
  chinese_company: {
    company_name: string
  }
  turkish_company: {
    company_name: string
  }
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
            customer:customers(full_name, passport_number),
            chinese_company:chinese_companies(company_name),
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
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [user, id, supabase])

  const handleCopyToken = async () => {
    if (!formData) return

    const success = await copyToClipboard(formData.access_token)
    if (success) {
      toast.success('Token kopyalandı!')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              href={`/forms/${id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Form Detayına Dön
            </Link>
            <h1 className="page-title">Chrome Extension İçin Hazır</h1>
            <p className="text-gray-600">Bu formun Chrome extension entegrasyonu</p>
          </div>
        </div>

        {/* Form Info Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Müşteri:</span>
              <p className="text-gray-900">{formData.customer.full_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Pasaport:</span>
              <p className="text-gray-900">{formData.customer.passport_number}</p>
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
          </div>
        </div>

        {/* Access Token Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Access Token</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              ✅ Chrome Extension İçin Hazır
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-800 break-all font-mono">
                {formData.access_token}
              </code>
              <button
                onClick={handleCopyToken}
                className="ml-4 flex items-center space-x-2 btn-primary text-sm"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Bu token'ı Chrome extension'da kullanarak formu otomatik doldurabilirsiniz.
          </p>
        </div>

        {/* API URL Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoint</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-800 break-all font-mono">
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

        {/* Usage Instructions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chrome Extension Kullanımı</h2>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Chrome Extension'ı Yükle</h4>
                <p className="text-sm text-gray-600">Fox Vize Chrome extension'ını tarayıcınıza yükleyin.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Vize Sayfasına Git</h4>
                <p className="text-sm text-gray-600">
                  <a href="https://consular.mfa.gov.cn/VISA/visa/visaform" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Çin konsolosluğu vize başvuru sayfası
                  </a>na gidin.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Token'ı Gir</h4>
                <p className="text-sm text-gray-600">Extension popup'ında yukarıdaki access token'ı girin.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Otomatik Doldur</h4>
                <p className="text-sm text-gray-600">"Form Doldur" butonuna basarak formu otomatik doldurun!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}