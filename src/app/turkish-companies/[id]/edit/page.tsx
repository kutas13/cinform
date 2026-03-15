'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface FormData {
  company_name: string
  address: string
  phone: string
  manager_name: string
}

export default function EditTurkishCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { register, handleSubmit, reset } = useForm<FormData>()

  useEffect(() => { if (user && id) loadData() }, [user, id])

  async function loadData() {
    const { data, error } = await supabase.from('turkish_companies').select('*').eq('id', id as string).eq('created_by', user!.id).single()
    if (error || !data) { toast.error('Bulunamadi'); router.push('/turkish-companies'); return }
    reset(data)
    setPageLoading(false)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('turkish_companies').update(data).eq('id', id as string)
      if (error) throw error
      toast.success('Guncellendi!')
      router.push('/turkish-companies')
    } catch (e: any) { toast.error('Hata: ' + (e.message || '')) }
    finally { setLoading(false) }
  }

  if (pageLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div></div>

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/turkish-companies" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm mb-4"><ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Geri Don</Link>
          <h1 className="page-title">Turk Sirket Duzenle</h1>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="form-section bg-rose-500/5 border-rose-500/20">
              <h3 className="text-lg font-bold text-rose-400 mb-6">Sirket Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Sirket Adi *</label>
                  <input {...register('company_name', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="form-label">Adres *</label>
                  <textarea {...register('address', { required: true })} rows={3} className="input-field" />
                </div>
                <div>
                  <label className="form-label">Telefon *</label>
                  <input {...register('phone', { required: true })} className="input-field" />
                </div>
              </div>
            </div>
            <div className="form-section bg-violet-500/5 border-violet-500/20">
              <h3 className="text-lg font-bold text-violet-400 mb-6">Mudur</h3>
              <div>
                <label className="form-label">Mudur Adi *</label>
                <input {...register('manager_name', { required: true })} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
              <Link href="/turkish-companies" className="btn-secondary">Iptal</Link>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}