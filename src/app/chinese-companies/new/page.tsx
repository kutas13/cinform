'use client'

import { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ExclamationTriangleIcon, PaperClipIcon, BuildingOfficeIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FormPageShell from '@/components/shared/FormPageShell'
import CompanyDocumentSlot from '@/components/forms/CompanyDocumentSlot'

interface ChineseCompanyForm {
  company_name: string
  address: string
  city: string
  district: string
  phone: string
  email: string
  relationship_type: string
}

interface DocState { path: string | null; name: string | null }

export default function NewChineseCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState<{ company_name: string; city: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientClient()

  const draftCompanyId = useMemo(
    () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    []
  )

  const [invitation, setInvitation] = useState<DocState>({ path: null, name: null })
  const [businessLicense, setBusinessLicense] = useState<DocState>({ path: null, name: null })
  const [idCard, setIdCard] = useState<DocState>({ path: null, name: null })

  const { register, handleSubmit, formState: { errors } } = useForm<ChineseCompanyForm>({
    defaultValues: { relationship_type: 'Business partnership' }
  })

  const checkNameDuplicate = useCallback(async (name: string) => {
    if (!name || name.length < 3 || !user) { setNameDuplicate(null); return }
    const { data } = await supabase
      .from('chinese_companies')
      .select('company_name, city')
      .eq('created_by', user.id)
      .ilike('company_name', name)
      .maybeSingle()
    setNameDuplicate(data || null)
  }, [user, supabase])

  const onSubmit = async (data: ChineseCompanyForm) => {
    if (!user) { toast.error('Giris yapmaniz gerekiyor'); return }
    setLoading(true)
    try {
      const payload = {
        id: draftCompanyId, ...data,
        inviter_name: '-', inviter_position: '-', created_by: user.id,
        invitation_file_path: invitation.path, invitation_file_name: invitation.name,
        business_license_file_path: businessLicense.path, business_license_file_name: businessLicense.name,
        id_card_file_path: idCard.path, id_card_file_name: idCard.name,
      }
      const { error } = await supabase.from('chinese_companies').insert(payload as any)
      if (error) throw error
      toast.success('Cinli sirket olusturuldu!')
      router.push('/chinese-companies')
    } catch (error: any) {
      toast.error('Hata: ' + (error.message || 'Bilinmeyen'))
    } finally { setLoading(false) }
  }

  return (
    <FormPageShell
      title="Yeni Cinli Sirket"
      subtitle="Cinli sirket ve davet bilgilerini girin"
      backHref="/chinese-companies"
      backLabel="Cinli Sirketler"
      icon={<BuildingOfficeIcon className="h-6 w-6 text-amber-400" />}
      iconBgClass="bg-amber-500/10"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Sirket Bilgileri */}
        <div className="form-section bg-amber-500/[0.03] border-amber-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400">1</span>
            </div>
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Sirket Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="form-label">Sirket Adi *</label>
              <input
                {...register('company_name', { required: 'Gerekli', onBlur: (e) => checkNameDuplicate(e.target.value) })}
                type="text" className="input-field" placeholder="Beijing International Trading Co."
              />
              {errors.company_name && <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>}
              {nameDuplicate && (
                <div className="duplicate-warning">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-400">&quot;{nameDuplicate.company_name}&quot; zaten kayitli ({nameDuplicate.city})</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Sehir *</label>
              <select {...register('city', { required: 'Gerekli' })} className="input-field">
                <option value="">Sehir Secin</option>
                {['GuangDong','BeiJing','ShangHai','ZheJiang','JiangSu','ShanDong','FuJian','SiChuan','HuBei','HuNan','HeNan','HeBei','ChongQing','TianJin','ShaanXi','ShanXi','LiaoNing','JiLin','HeiLongJiang','AnHui','JiangXi','GuangXi','HaiNan','GuiZhou','YunNan','NingXia','GanSu','QingHai','XinJiang','NeiMengGu','XiZang','HongKong','MaCao','TaiWan'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Ilce *</label>
              <input {...register('district', { required: 'Gerekli' })} type="text" className="input-field" placeholder="Guangzhou" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Adres *</label>
              <textarea {...register('address', { required: 'Gerekli' })} rows={3} className="input-field resize-none" placeholder="Tam sirket adresi" />
            </div>
          </div>
        </div>

        {/* Iletisim */}
        <div className="form-section bg-blue-500/[0.03] border-blue-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">2</span>
            </div>
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Iletisim</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Telefon *</label>
              <input {...register('phone', { required: 'Gerekli' })} type="tel" className="input-field" placeholder="+86 20 1234 5678" />
            </div>
            <div>
              <label className="form-label">E-posta *</label>
              <input {...register('email', { required: 'Gerekli', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Gecersiz' } })} type="email" className="input-field" placeholder="contact@company.cn" />
            </div>
          </div>
        </div>

        <input type="hidden" {...register('relationship_type')} defaultValue="Business partnership" />

        {/* Belgeler */}
        <div className="form-section bg-emerald-500/[0.03] border-emerald-500/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <PaperClipIcon className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Belgeler</h3>
            <span className="text-[10px] text-slate-600 ml-auto">Opsiyonel</span>
          </div>
          {user ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <CompanyDocumentSlot label="Davetiye" description="Davet mektubu" table="chinese_companies" pathColumn="invitation_file_path" nameColumn="invitation_file_name" companyId={draftCompanyId} userId={user.id} supabase={supabase as any} currentPath={invitation.path} currentName={invitation.name} mode="new" onChange={(path, name) => setInvitation({ path, name })} />
              <CompanyDocumentSlot label="Faaliyet Belgesi" description="Is ruhsati" table="chinese_companies" pathColumn="business_license_file_path" nameColumn="business_license_file_name" companyId={draftCompanyId} userId={user.id} supabase={supabase as any} currentPath={businessLicense.path} currentName={businessLicense.name} mode="new" onChange={(path, name) => setBusinessLicense({ path, name })} />
              <CompanyDocumentSlot label="ID Kart" description="Kimlik karti" table="chinese_companies" pathColumn="id_card_file_path" nameColumn="id_card_file_name" companyId={draftCompanyId} userId={user.id} supabase={supabase as any} currentPath={idCard.path} currentName={idCard.name} mode="new" onChange={(path, name) => setIdCard({ path, name })} />
            </div>
          ) : (
            <p className="text-xs text-slate-500">Oturum dogrulanıyor...</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
          <Link href="/chinese-companies" className="btn-secondary">Iptal</Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Kaydediliyor...' : 'Sirketi Kaydet'}
            {!loading && <ChevronRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </FormPageShell>
  )
}
