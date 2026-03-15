'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface ChineseCompanyForm {
  company_name: string
  address: string
  city: string
  district: string
  phone: string
  inviter_name: string
  inviter_position: string
  email: string
  relationship_type: string
}

export default function NewChineseCompanyPage() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChineseCompanyForm>({
    defaultValues: {
      relationship_type: 'Business partnership'
    }
  })

  const onSubmit = async (data: ChineseCompanyForm) => {
    if (!user) {
      toast.error('Giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('chinese_companies')
        .insert({
          ...data,
          created_by: user.id,
        })

      if (error) {
        throw error
      }

      toast.success('Çinli şirket başarıyla oluşturuldu!')
      router.push('/chinese-companies')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/chinese-companies" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Cinli Sirketlere Geri Don
          </Link>
          <h1 className="page-title">Yeni Cinli Sirket Olustur</h1>
          <p className="text-slate-400 mt-1">Cinli sirket ve davet bilgilerini girin</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Şirket Bilgileri */}
            <div className="form-section bg-amber-500/5 border-amber-500/20">
              <h3 className="text-lg font-bold text-amber-400 mb-6">Cinli Sirket Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="form-label">Şirket Adı *</label>
                  <input
                    {...register('company_name', { required: 'Şirket adı gereklidir' })}
                    type="text"
                    className="input-field"
                    placeholder="Örn: Beijing International Trading Co."
                  />
                  {errors.company_name && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.company_name.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="form-label">Sehir *</label>
                  <select
                    {...register('city', { required: 'Sehir gereklidir' })}
                    className="input-field"
                  >
                    <option value="">Sehir Secin</option>
                    <option value="GuangDong">GuangDong</option>
                    <option value="BeiJing">BeiJing</option>
                    <option value="ShangHai">ShangHai</option>
                    <option value="ZheJiang">ZheJiang</option>
                    <option value="JiangSu">JiangSu</option>
                    <option value="ShanDong">ShanDong</option>
                    <option value="FuJian">FuJian</option>
                    <option value="SiChuan">SiChuan</option>
                    <option value="HuBei">HuBei</option>
                    <option value="HuNan">HuNan</option>
                    <option value="HeNan">HeNan</option>
                    <option value="HeBei">HeBei</option>
                    <option value="ChongQing">ChongQing</option>
                    <option value="TianJin">TianJin</option>
                    <option value="ShaanXi">ShaanXi</option>
                    <option value="ShanXi">ShanXi</option>
                    <option value="LiaoNing">LiaoNing</option>
                    <option value="JiLin">JiLin</option>
                    <option value="HeiLongJiang">HeiLongJiang</option>
                    <option value="AnHui">AnHui</option>
                    <option value="JiangXi">JiangXi</option>
                    <option value="GuangXi">GuangXi</option>
                    <option value="HaiNan">HaiNan</option>
                    <option value="GuiZhou">GuiZhou</option>
                    <option value="YunNan">YunNan</option>
                    <option value="NingXia">NingXia</option>
                    <option value="GanSu">GanSu</option>
                    <option value="QingHai">QingHai</option>
                    <option value="XinJiang">XinJiang</option>
                    <option value="NeiMengGu">NeiMengGu</option>
                    <option value="XiZang">XiZang</option>
                    <option value="HongKong">HongKong</option>
                    <option value="MaCao">MaCao</option>
                    <option value="TaiWan">TaiWan</option>
                  </select>
                  {errors.city && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.city.message}</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="form-label">Ilce *</label>
                  <input
                    {...register('district', { required: 'Ilce gereklidir' })}
                    type="text"
                    className="input-field"
                    placeholder="Orn: Guangzhou"
                  />
                  {errors.district && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.district.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="form-label">Şirket Adresi *</label>
                  <textarea
                    {...register('address', { required: 'Adres gereklidir' })}
                    rows={3}
                    className="input-field"
                    placeholder="Tam şirket adresi"
                  />
                  {errors.address && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.address.message}</p>
                  )}
                  <small className="text-slate-500">6.1E kalacak adres icin kullanilacak</small>
                </div>
              </div>
            </div>

            {/* 2. İletişim Bilgileri */}
            <div className="form-section bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-lg font-bold text-indigo-400 mb-6">Iletisim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label className="form-label">Şirket Telefonu *</label>
                  <input
                    {...register('phone', { required: 'Telefon numarası gereklidir' })}
                    type="tel"
                    className="input-field"
                    placeholder="+86 20 1234 5678"
                  />
                  {errors.phone && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.phone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Şirket E-postası *</label>
                  <input
                    {...register('email', {
                      required: 'E-posta gereklidir',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Geçerli bir e-posta adresi girin'
                      }
                    })}
                    type="email"
                    className="input-field"
                    placeholder="contact@company.com.cn"
                  />
                  {errors.email && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>
                  )}
                </div>

              </div>
            </div>

            {/* 3. Davet Eden Kişi */}
            <div className="form-section bg-emerald-500/5 border-emerald-500/20">
              <h3 className="text-lg font-bold text-emerald-400 mb-6">Davet Eden Kisi Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inviter Name */}
                <div>
                  <label className="form-label">Davet Eden Adı *</label>
                  <input
                    {...register('inviter_name', { required: 'Davet eden adı gereklidir' })}
                    type="text"
                    className="input-field"
                    placeholder="Örn: Li Wei"
                  />
                  {errors.inviter_name && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.inviter_name.message}</p>
                  )}
                </div>

                {/* Inviter Position */}
                <div>
                  <label className="form-label">Davet Eden Pozisyonu *</label>
                  <input
                    {...register('inviter_position', { required: 'Pozisyon gereklidir' })}
                    type="text"
                    className="input-field"
                    placeholder="Örn: General Manager"
                  />
                  {errors.inviter_position && (
                    <p className="text-rose-400 text-xs mt-1.5">{errors.inviter_position.message}</p>
                  )}
                </div>

                {/* Relationship Type (Auto-filled) */}
                <div className="md:col-span-2">
                  <label className="form-label">İlişki Türü *</label>
                  <input
                    {...register('relationship_type', { required: 'İlişki türü gereklidir' })}
                    type="text"
                    className="input-field bg-slate-800/50"
                    defaultValue="Business partnership"
                    readOnly
                  />
                  <small className="text-slate-500">6.2B icin otomatik "Business partnership" secilecek</small>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-800">
              <Link href="/chinese-companies" className="btn-secondary">
                İptal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kaydediliyor...' : 'Çinli Şirketi Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}