'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ExclamationTriangleIcon, PaperClipIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline'
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const draftCompanyId = useMemo(
    () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
    } catch {
      // ignore malformed storage payload
    } finally {
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
        id: draftCompanyId,
        ...data,
        phone: '-',
        manager_name: '-',
        created_by: user.id,
        stamped_paper_file_path: stampedPaper.path,
        stamped_paper_file_name: stampedPaper.name,
      }
      const { error } = await supabase.from('turkish_companies').insert(payload)
      if (error) throw error
      toast.success('Turk sirket basariyla olusturuldu!')
      router.push('/turkish-companies')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPageShell
      title="Yeni Turk Sirket Olustur"
      subtitle="Turk sirket ve is bilgilerini girin"
      backHref="/turkish-companies"
      backLabel="Turk Sirketlere Geri Don"
      icon={<BuildingLibraryIcon className="h-6 w-6 text-rose-400" />}
      iconBgClass="bg-rose-500/10"
    >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sirket */}
          <div className="form-section bg-rose-500/5 border-rose-500/20">
            <h3 className="text-base font-bold text-rose-400 mb-6">Sirket Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adi *</label>
                <input
                  {...register('company_name', {
                    required: 'Sirket adi gereklidir',
                    onBlur: (e) => checkNameDuplicate(e.target.value),
                  })}
                  type="text" className="input-field" placeholder="Orn: Istanbul Ithalat A.S."
                />
                {errors.company_name && <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>}
                {nameDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni Isimde Sirket Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          "<strong>{nameDuplicate.company_name}</strong>" adli sirket zaten kayitli.
                          Yine de eklemek istiyorsaniz devam edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adresi *</label>
                <textarea {...register('address', { required: 'Adres gereklidir' })} rows={3} className="input-field" placeholder="Tam sirket adresi" />
                {errors.address && <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Belgeler */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <div className="mb-5 flex items-center gap-2">
              <PaperClipIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-400">Belge (Opsiyonel)</h3>
            </div>
            <p className="mb-5 text-xs text-slate-500">
              PDF veya görsel (JPG, PNG, WEBP) — en fazla 10MB. Sonradan tekrar
              kullanabilmek için kaşeli kağıdı buraya ekle.
            </p>
            {user ? (
              <div className="grid grid-cols-1 gap-4 md:max-w-md">
                <CompanyDocumentSlot
                  label="Kaşeli Kağıt"
                  description="Şirket kaşeli antetli kağıt"
                  table="turkish_companies"
                  pathColumn="stamped_paper_file_path"
                  nameColumn="stamped_paper_file_name"
                  companyId={draftCompanyId}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={stampedPaper.path}
                  currentName={stampedPaper.name}
                  mode="new"
                  onChange={(path, name) => setStampedPaper({ path, name })}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Oturum doğrulanıyor...</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/turkish-companies" className="btn-secondary">Iptal</Link>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Kaydediliyor...' : 'Turk Sirketi Kaydet'}
            </button>
          </div>
        </form>
    </FormPageShell>
  )
}
