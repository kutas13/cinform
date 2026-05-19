'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon, ExclamationTriangleIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import CompanyDocumentSlot from '@/components/forms/CompanyDocumentSlot'

interface DocState { path: string | null; name: string | null }

const cities = ['GuangDong','BeiJing','ShangHai','ZheJiang','JiangSu','ShanDong','FuJian','SiChuan','HuBei','HuNan','HeNan','HeBei','ChongQing','TianJin','ShaanXi','ShanXi','LiaoNing','JiLin','HeiLongJiang','AnHui','JiangXi','GuangXi','HaiNan','GuiZhou','YunNan','NingXia','GanSu','QingHai','XinJiang','NeiMengGu','XiZang','HongKong','MaCao','TaiWan']

interface FormData {
  company_name: string
  address: string
  city: string
  district: string
  phone: string
  email: string
  inviter_name: string
  inviter_position: string
  relationship_type: string
}

export default function EditChineseCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [nameDuplicate, setNameDuplicate] = useState<{ company_name: string; city: string } | null>(null)
  const [originalName, setOriginalName] = useState('')
  const [invitation, setInvitation] = useState<DocState>({ path: null, name: null })
  const [businessLicense, setBusinessLicense] = useState<DocState>({ path: null, name: null })
  const [idCard, setIdCard] = useState<DocState>({ path: null, name: null })
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const checkNameDuplicate = useCallback(async (name: string) => {
    if (!name || name.length < 3 || !user || name.toLowerCase() === originalName.toLowerCase()) { setNameDuplicate(null); return }
    const { data } = await supabase
      .from('chinese_companies')
      .select('company_name, city')
      .eq('created_by', user.id)
      .ilike('company_name', name)
      .neq('id', id as string)
      .maybeSingle()
    setNameDuplicate(data || null)
  }, [user, supabase, id, originalName])

  useEffect(() => { if (user && id) loadData() }, [user, id])

  async function loadData() {
    const { data, error } = await supabase.from('chinese_companies').select('*').eq('id', id as string).eq('created_by', user!.id).single()
    if (error || !data) { toast.error('Sirket bulunamadi'); router.push('/chinese-companies'); return }
    setOriginalName(data.company_name || '')
    setInvitation({ path: data.invitation_file_path || null, name: data.invitation_file_name || null })
    setBusinessLicense({ path: data.business_license_file_path || null, name: data.business_license_file_name || null })
    setIdCard({ path: data.id_card_file_path || null, name: data.id_card_file_name || null })
    reset(data)
    setPageLoading(false)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('chinese_companies').update(data).eq('id', id as string)
      if (error) throw error
      toast.success('Sirket guncellendi!')
      router.push('/chinese-companies')
    } catch (e: any) { toast.error('Hata: ' + (e.message || '')) }
    finally { setLoading(false) }
  }

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/chinese-companies" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Geri Don
        </Link>
        <h1 className="page-title">Cinli Sirket Duzenle</h1>
      </div>
      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="form-section bg-amber-500/5 border-amber-500/20">
            <h3 className="text-base font-bold text-amber-400 mb-6">Sirket Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label">Sirket Adi *</label>
                <input
                  {...register('company_name', {
                    required: true,
                    onBlur: (e) => checkNameDuplicate(e.target.value),
                  })}
                  className="input-field"
                />
                {nameDuplicate && (
                  <div className="duplicate-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">Ayni Isimde Sirket Mevcut!</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          "<strong>{nameDuplicate.company_name}</strong>" ({nameDuplicate.city}) zaten kayitli.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Sehir *</label>
                <select {...register('city', { required: true })} className="input-field">
                  <option value="">Secin</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Ilce *</label>
                <input {...register('district', { required: true })} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Adres *</label>
                <textarea {...register('address', { required: true })} rows={3} className="input-field" />
              </div>
            </div>
          </div>

          <div className="form-section bg-blue-500/5 border-blue-500/20">
            <h3 className="text-base font-bold text-blue-400 mb-6">Iletisim</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Telefon *</label>
                <input {...register('phone', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="form-label">E-posta *</label>
                <input {...register('email', { required: true })} type="email" className="input-field" />
              </div>
            </div>
          </div>

          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-base font-bold text-emerald-400 mb-6">Davet Eden</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Davet Eden Adi *</label>
                <input {...register('inviter_name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="form-label">Pozisyonu *</label>
                <input {...register('inviter_position', { required: true })} className="input-field" />
              </div>
            </div>
          </div>

          {/* Belgeler */}
          <div className="form-section bg-emerald-500/5 border-emerald-500/20">
            <div className="mb-5 flex items-center gap-2">
              <PaperClipIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-400">Belgeler</h3>
            </div>
            <p className="mb-5 text-xs text-slate-500">
              PDF veya görsel (JPG, PNG, WEBP) — en fazla 10MB. Aynı şirketten tekrar
              davet geldiğinde belgeleri buradan indirebilirsin.
            </p>
            {user && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <CompanyDocumentSlot
                  label="Davetiye"
                  description="Çinli şirket davet mektubu"
                  table="chinese_companies"
                  pathColumn="invitation_file_path"
                  nameColumn="invitation_file_name"
                  companyId={id as string}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={invitation.path}
                  currentName={invitation.name}
                  mode="edit"
                  onChange={(path, name) => setInvitation({ path, name })}
                />
                <CompanyDocumentSlot
                  label="Faaliyet Belgesi"
                  description="İş ruhsatı / faaliyet belgesi"
                  table="chinese_companies"
                  pathColumn="business_license_file_path"
                  nameColumn="business_license_file_name"
                  companyId={id as string}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={businessLicense.path}
                  currentName={businessLicense.name}
                  mode="edit"
                  onChange={(path, name) => setBusinessLicense({ path, name })}
                />
                <CompanyDocumentSlot
                  label="ID Kart"
                  description="Davet edenin kimlik kartı"
                  table="chinese_companies"
                  pathColumn="id_card_file_path"
                  nameColumn="id_card_file_name"
                  companyId={id as string}
                  userId={user.id}
                  supabase={supabase}
                  currentPath={idCard.path}
                  currentName={idCard.name}
                  mode="edit"
                  onChange={(path, name) => setIdCard({ path, name })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
            <Link href="/chinese-companies" className="btn-secondary">Iptal</Link>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
