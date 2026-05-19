'use client'

import { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ExclamationTriangleIcon, PaperClipIcon } from '@heroicons/react/24/outline'
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

interface DocState {
  path: string | null
  name: string | null
}

export default function NewChineseCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState<{ company_name: string; city: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Önceden bir UUID üretiyoruz; dosyalar bu klasöre yüklensin, sonra şirketi bu ID ile kaydedeceğiz.
  const draftCompanyId = useMemo(
    () =>
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
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
        id: draftCompanyId,
        ...data,
        inviter_name: '-',
        inviter_position: '-',
        created_by: user.id,
        invitation_file_path: invitation.path,
        invitation_file_name: invitation.name,
        business_license_file_path: businessLicense.path,
        business_license_file_name: businessLicense.name,
        id_card_file_path: idCard.path,
        id_card_file_name: idCard.name,
      }
      const { error } = await supabase.from('chinese_companies').insert(payload)
      if (error) throw error
      toast.success('Cinli sirket basariyla olusturuldu!')
      router.push('/chinese-companies')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata olustu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/chinese-companies" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Cinli Sirketlere Geri Don
        </Link>
        <h1 className="page-title">Yeni Cinli Sirket Olustur</h1>
        <p className="text-slate-500 mt-1 text-sm">Cinli sirket ve davet bilgilerini girin</p>
      </div>

      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sirket Bilgileri */}
          <div className="form-section bg-amber-500/5 border-amber-500/20">
            <h3 className="text-base font-bold text-amber-400 mb-6">Cinli Sirket Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adi *</label>
                <input
                  {...register('company_name', {
                    required: 'Sirket adi gereklidir',
                    onBlur: (e) => checkNameDuplicate(e.target.value),
                  })}
                  type="text" className="input-field" placeholder="Orn: Beijing International Trading Co."
                />
                {errors.company_name && <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>}
                {nameDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni Isimde Sirket Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          "<strong>{nameDuplicate.company_name}</strong>" adli sirket zaten kayitli ({nameDuplicate.city}).
                          Yine de eklemek istiyorsaniz devam edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Sehir *</label>
                <select {...register('city', { required: 'Sehir gereklidir' })} className="input-field">
                  <option value="">Sehir Secin</option>
                  {['GuangDong','BeiJing','ShangHai','ZheJiang','JiangSu','ShanDong','FuJian','SiChuan','HuBei','HuNan','HeNan','HeBei','ChongQing','TianJin','ShaanXi','ShanXi','LiaoNing','JiLin','HeiLongJiang','AnHui','JiangXi','GuangXi','HaiNan','GuiZhou','YunNan','NingXia','GanSu','QingHai','XinJiang','NeiMengGu','XiZang','HongKong','MaCao','TaiWan'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <p className="text-rose-400 text-xs mt-1.5">{errors.city.message}</p>}
              </div>
              <div>
                <label className="form-label">Ilce *</label>
                <input {...register('district', { required: 'Ilce gereklidir' })} type="text" className="input-field" placeholder="Orn: Guangzhou" />
                {errors.district && <p className="text-rose-400 text-xs mt-1.5">{errors.district.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adresi *</label>
                <textarea {...register('address', { required: 'Adres gereklidir' })} rows={3} className="input-field" placeholder="Tam sirket adresi" />
                {errors.address && <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>}
                <p className="text-xs text-slate-600 mt-1">6.1E kalacak adres icin kullanilacak</p>
              </div>
            </div>
          </div>

          {/* Iletisim */}
          <div className="form-section bg-blue-500/5 border-blue-500/20">
            <h3 className="text-base font-bold text-blue-400 mb-6">Iletisim Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Sirket Telefonu *</label>
                <input {...register('phone', { required: 'Telefon gereklidir' })} type="tel" className="input-field" placeholder="+86 20 1234 5678" />
                {errors.phone && <p className="text-rose-400 text-xs mt-1.5">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="form-label">Sirket E-postasi *</label>
                <input {...register('email', { required: 'E-posta gereklidir', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Gecerli e-posta girin' } })} type="email" className="input-field" placeholder="contact@company.com.cn" />
                {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <input type="hidden" {...register('relationship_type')} defaultValue="Business partnership" />

          {/* Belgeler */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <div className="mb-5 flex items-center gap-2">
              <PaperClipIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-400">Belgeler (Opsiyonel)</h3>
            </div>
            <p className="mb-5 text-xs text-slate-500">
              PDF veya görsel (JPG, PNG, WEBP) — en fazla 10MB. Aynı şirketten tekrar davet
              geldiğinde belgeleri buradan indirebilirsin.
            </p>
            {user ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <CompanyDocumentSlot
                  label="Davetiye"
                  description="Çinli şirket davet mektubu"
                  table="chinese_companies"
                  pathColumn="invitation_file_path"
                  nameColumn="invitation_file_name"
                  companyId={draftCompanyId}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={invitation.path}
                  currentName={invitation.name}
                  mode="new"
                  onChange={(path, name) => setInvitation({ path, name })}
                />
                <CompanyDocumentSlot
                  label="Faaliyet Belgesi"
                  description="İş ruhsatı / faaliyet belgesi"
                  table="chinese_companies"
                  pathColumn="business_license_file_path"
                  nameColumn="business_license_file_name"
                  companyId={draftCompanyId}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={businessLicense.path}
                  currentName={businessLicense.name}
                  mode="new"
                  onChange={(path, name) => setBusinessLicense({ path, name })}
                />
                <CompanyDocumentSlot
                  label="ID Kart"
                  description="Davet edenin kimlik kartı"
                  table="chinese_companies"
                  pathColumn="id_card_file_path"
                  nameColumn="id_card_file_name"
                  companyId={draftCompanyId}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={idCard.path}
                  currentName={idCard.name}
                  mode="new"
                  onChange={(path, name) => setIdCard({ path, name })}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Oturum doğrulanıyor...</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/chinese-companies" className="btn-secondary">Iptal</Link>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Kaydediliyor...' : 'Cinli Sirketi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
