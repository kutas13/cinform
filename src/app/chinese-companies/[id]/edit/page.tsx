'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  useEffect(() => { if (user && id) loadData() }, [user, id])

  async function loadData() {
    const { data, error } = await supabase.from('chinese_companies').select('*').eq('id', id as string).eq('created_by', user!.id).single()
    if (error || !data) { toast.error('Sirket bulunamadi'); router.push('/chinese-companies'); return }
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

  if (pageLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div></div>

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/chinese-companies" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm mb-4"><ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Geri Don</Link>
          <h1 className="page-title">Cinli Sirket Duzenle</h1>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="form-section bg-amber-500/5 border-amber-500/20">
              <h3 className="text-lg font-bold text-amber-400 mb-6">Sirket Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Sirket Adi *</label>
                  <input {...register('company_name', { required: true })} className="input-field" />
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
                  <input {...register('district', { required: true })} className="input-field" placeholder="Orn: Guangzhou" />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Adres *</label>
                  <textarea {...register('address', { required: true })} rows={3} className="input-field" />
                </div>
              </div>
            </div>

            <div className="form-section bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-lg font-bold text-indigo-400 mb-6">Iletisim</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <h3 className="text-lg font-bold text-emerald-400 mb-6">Davet Eden</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
              <Link href="/chinese-companies" className="btn-secondary">Iptal</Link>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}