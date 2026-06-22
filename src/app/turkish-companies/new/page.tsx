'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ExclamationTriangleIcon, PaperClipIcon, BuildingLibraryIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FormPageShell from '@/components/shared/FormPageShell'
import {
  VISA_PDF_TURKISH_COMPANY_BACKUP_KEY,
  VISA_PDF_TURKISH_COMPANY_KEY,
} from '@/lib/visa-pdf-import-storage'
import CompanyDocumentSlot from '@/components/forms/CompanyDocumentSlot'

interface TurkishCompanyForm {
  company_name: string
  address: string
}

interface DocState { path: string | null; name: string | null }

export default function NewTurkishCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState<{ company_name: string } | null>(null)
  const [stampedPaper, setStampedPaper] = useState<DocState>({ path: null, name: null })
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientClient()

  const draftCompanyId = useMemo(
    () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    []
  )

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TurkishCompanyForm>()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sessionPayload = sessionStorage.getItem(VISA_PDF_TURKISH_COMPANY_KEY)
    const backupPayload = localStorage.getItem(VISA_PDF_TURKISH_COMPANY_BACKUP_KEY)
    const raw = sessionPayload || backupPayload
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<TurkishCompanyForm>
      if (parsed.company_name) setValue('company_name', parsed.company_name, { shouldDirty: true })
      if (parsed.address) setValue('address', parsed.address, { shouldDirty: true })
    } catch {} finally {
      sessionStorage.removeItem(VISA_PDF_TURKISH_COMPANY_KEY)
      localStorage.removeItem(VISA_PDF_TURKISH_COMPANY_BACKUP_KEY)
    }
  }, [setValue])

  const checkNameDuplicate = useCallback(async (name: string) => {
    if (!name || name.length < 3 || !user) { setNameDuplicate(null); return }
    const { data } = await supabase
      .from('turkish_companies')
      .select('company_name')
      .eq('created_by', user.id)
      .ilike('company_name', name)
      .maybeSingle()
    setNameDuplicate(data || null)
  }, [user, supabase])

  const onSubmit = async (data: TurkishCompanyForm) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }
    setLoading(true)
    try {
      const payload = {
        id: draftCompanyId, ...data,
        phone: '-', manager_name: '-', created_by: user.id,
        stamped_paper_file_path: stampedPaper.path, stamped_paper_file_name: stampedPaper.name,
      }
      const { error } = await supabase.from('turkish_companies').insert(payload as any)
      if (error) throw error
      toast.success('Turk sirket olusturuldu!')
      router.push('/turkish-companies')
    } catch (error: any) {
      toast.error('Hata: ' + (error.message || 'Bilinmeyen'))
    } finally { setLoading(false) }
  }

  return (
    <FormPageShell
      title="Yeni Turk Sirket"
      subtitle="Turk sirket bilgilerini girin"
      backHref="/turkish-companies"
      backLabel="Turk Sirketler"
      icon={<BuildingLibraryIcon className="h-6 w-6 text-rose-400" />}
      iconBgClass="bg-rose-500/10"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Sirket */}
        <div className="form-section bg-rose-500/[0.03] border-rose-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-rose-400">1</span>
            </div>
            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">Sirket Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="form-label">Sirket Adi *</label>
              <input
                {...register('company_name', { required: 'Gerekli', onBlur: (e) => checkNameDuplicate(e.target.value) })}
                type="text" className="input-field" placeholder="Istanbul Ithalat A.S."
              />
              {errors.company_name && <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>}
              {nameDuplicate && (
                <div className="duplicate-warning">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-400">&quot;{nameDuplicate.company_name}&quot; zaten kayitli.</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Sirket Adresi *</label>
              <textarea {...register('address', { required: 'Gerekli' })} rows={3} className="input-field resize-none" placeholder="Tam sirket adresi" />
              {errors.address && <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Belgeler */}
        <div className="form-section bg-emerald-500/[0.03] border-emerald-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <PaperClipIcon className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Kaseli Kagit</h3>
            <span className="text-[10px] text-slate-600 ml-auto">Opsiyonel</span>
          </div>
          {user ? (
            <div className="max-w-md">
              <CompanyDocumentSlot label="Kaseli Kagit" description="Sirket kaseli antetli kagit" table="turkish_companies" pathColumn="stamped_paper_file_path" nameColumn="stamped_paper_file_name" companyId={draftCompanyId} userId={user.id} supabase={supabase as any} currentPath={stampedPaper.path} currentName={stampedPaper.name} mode="new" onChange={(path, name) => setStampedPaper({ path, name })} />
            </div>
          ) : (
            <p className="text-xs text-slate-500">Oturum dogrulanıyor...</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
          <Link href="/turkish-companies" className="btn-secondary">Iptal</Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Kaydediliyor...' : 'Sirketi Kaydet'}
            {!loading && <ChevronRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </FormPageShell>
  )
}
