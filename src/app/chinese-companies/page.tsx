'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'

interface ChineseCompany {
  id: string
  company_name: string
  city: string
  phone: string
  email: string
  inviter_name: string
  created_at: string
}

export default function ChineseCompaniesPage() {
  const [companies, setCompanies] = useState<ChineseCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data, error } = await supabase.from('chinese_companies')
      .select('id, company_name, city, phone, email, inviter_name, created_at')
      .eq('created_by', user!.id).order('created_at', { ascending: false })
    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else setCompanies(data || [])
    setLoading(false)
  }

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('chinese_companies').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); load() }
  }

  const filtered = companies.filter(c => c.company_name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-2 inline-block">← Dashboard</Link>
            <h1 className="page-title">Cinli Sirketler</h1>
          </div>
          <Link href="/chinese-companies/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Yeni Sirket
          </Link>
        </div>

        <div className="mb-6">
          <input type="text" placeholder="Sirket adi veya sehir ile ara..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-md" />
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-400 mb-4">Henuz cinli sirket yok</p>
            <Link href="/chinese-companies/new" className="btn-primary">Ilk Sirketi Olustur</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sirket Adi</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sehir</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Davet Eden</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Telefon</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Islem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{c.company_name}</td>
                    <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{c.city}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.inviter_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Link href={`/chinese-companies/${c.id}/edit`} className="text-indigo-400 hover:text-indigo-300 p-1" title="Duzenle"><PencilIcon className="h-4 w-4" /></Link>
                      <button onClick={() => del(c.id, c.company_name)} className="text-rose-400 hover:text-rose-300 p-1" title="Sil"><TrashIcon className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}