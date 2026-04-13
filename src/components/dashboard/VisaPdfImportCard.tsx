'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import type { ChinaVisaPdfParseResult } from '@/lib/parse-china-visa-pdf'
import {
  VISA_PDF_CUSTOMER_BACKUP_KEY,
  VISA_PDF_CUSTOMER_KEY,
  VISA_PDF_TURKISH_COMPANY_BACKUP_KEY,
  VISA_PDF_TURKISH_COMPANY_KEY,
} from '@/lib/visa-pdf-import-storage'

export default function VisaPdfImportCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ChinaVisaPdfParseResult | null>(null)
  const [showTargetModal, setShowTargetModal] = useState(false)

  const onPick = () => inputRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Lütfen PDF dosyası seçin')
      return
    }

    setLoading(true)
    setLastResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse-visa-pdf', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'PDF işlenemedi')
        return
      }

      const parsed = data as ChinaVisaPdfParseResult
      setLastResult(parsed)

      try {
        const customerPayload = JSON.stringify(parsed.customer || {})
        const companyPayload = JSON.stringify(parsed.turkishCompany || {})
        sessionStorage.setItem(VISA_PDF_CUSTOMER_KEY, customerPayload)
        sessionStorage.setItem(VISA_PDF_TURKISH_COMPANY_KEY, companyPayload)
        localStorage.setItem(VISA_PDF_CUSTOMER_BACKUP_KEY, customerPayload)
        localStorage.setItem(VISA_PDF_TURKISH_COMPANY_BACKUP_KEY, companyPayload)
      } catch {
        toast.error('Tarayıcı depolaması dolu; sayfaları tek tek açıp kopyalayın')
        return
      }

      toast.success('Veriler hazır.')
      setShowTargetModal(true)
      if (parsed.warnings?.length) {
        toast(
          `${parsed.warnings.length} uyarı: ${parsed.warnings.slice(0, 2).join(' · ')}`,
          { duration: 6500, icon: '⚠️' }
        )
      }
    } catch {
      toast.error('Ağ hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 mb-10 border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-slate-900/80">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-violet-500/20 shrink-0">
            <DocumentArrowUpIcon className="h-8 w-8 text-violet-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Çin vize PDF&apos;inden içe aktar</h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Doldurulmuş Çin vize başvuru formu PDF&apos;ini (metin katmanlı) yükleyin. Şahıs ve son iş deneyimindeki Türk
              şirketi bilgileri otomatik çıkarılır; formlarda düzenlemeniz gerekir.
            </p>
            <p className="text-xs text-amber-400/90 mt-2 flex items-start gap-1.5">
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              Taranmış (sadece görüntü) PDF&apos;ler çalışmaz. Sonuçlar tahminidir.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={onFile}
          />
          <button
            type="button"
            onClick={onPick}
            disabled={loading}
            className="btn-primary whitespace-nowrap disabled:opacity-50"
          >
            {loading ? 'Okunuyor...' : 'PDF seç'}
          </button>
          <div className="flex flex-wrap gap-2">
            <Link href="/customers/new" className="text-xs text-violet-300 hover:text-violet-200 underline">
              Yeni müşteri
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/turkish-companies/new" className="text-xs text-violet-300 hover:text-violet-200 underline">
              Yeni Türk şirketi
            </Link>
          </div>
        </div>
      </div>

      {lastResult && (
        <div className="mt-5 pt-5 border-t border-slate-700/50 text-xs text-slate-500">
          <span className="text-slate-400">Son çıktı: </span>
          {lastResult.customer?.full_name && <span className="text-slate-300">{lastResult.customer.full_name}</span>}
          {lastResult.turkishCompany?.company_name && (
            <span className="text-slate-400"> — {lastResult.turkishCompany.company_name}</span>
          )}
          <span className="text-slate-500">
            {' '}
            · Cocuk: {typeof lastResult.customer?.children_count === 'number' ? lastResult.customer.children_count : 0}
          </span>
        </div>
      )}

      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-white font-semibold text-base mb-2">Kayit turu sec</h3>
            <p className="text-sm text-slate-400 mb-4">
              PDF yuklendi. Simdi hangi kayit sayfasina gitmek istiyorsun?
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowTargetModal(false)
                  router.push('/customers/new')
                }}
              >
                Musteri Kaydi
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowTargetModal(false)
                  router.push('/turkish-companies/new')
                }}
              >
                Turk Sirket Kaydi
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-300 mt-1"
                onClick={() => setShowTargetModal(false)}
              >
                Simdilik kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
