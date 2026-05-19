'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  IdentificationIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline'

const DOC_BUCKET = 'company-documents'

interface ChineseCompany {
  id: string
  company_name: string
  city: string
  phone: string
  email: string
  inviter_name: string
  created_at: string
  invitation_file_path: string | null
  invitation_file_name: string | null
  business_license_file_path: string | null
  business_license_file_name: string | null
  id_card_file_path: string | null
  id_card_file_name: string | null
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
      .select('*')
      .eq('created_by', user!.id).order('created_at', { ascending: false })
    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else setCompanies(((data as unknown) as ChineseCompany[]) || [])
    setLoading(false)
  }

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('chinese_companies').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); load() }
  }

  async function downloadDoc(path: string | null, label: string, fileName?: string | null) {
    if (!path) return
    try {
      const { data, error } = await supabase.storage
        .from(DOC_BUCKET)
        .download(path)
      if (error || !data) throw error || new Error('Dosya indirilemedi')
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || label
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(`${label} indirilemedi: ${e.message || ''}`)
    }
  }

  const filtered = companies.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <BuildingOfficeIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="page-title">Cinli Sirketler</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">Toplam {companies.length} sirket</p>
        </div>
        <Link href="/chinese-companies/new" className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="h-4 w-4" /> Yeni Sirket
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Sirket adi veya sehir ile ara..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
            <p className="text-xs text-slate-500">Yukleniyor...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
            <BuildingOfficeIcon className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-1 font-medium">Henuz cinli sirket yok</p>
          <p className="text-slate-600 text-sm mb-6">Ilk sirketi olusturarak baslayin</p>
          <Link href="/chinese-companies/new" className="btn-primary">Ilk Sirketi Olustur</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sirket Adi</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sehir</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Belgeler</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Davet Eden</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Telefon</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Tarih</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Islem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                          <span className="text-xs font-bold text-amber-400">{c.company_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{c.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">{c.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadDoc(c.invitation_file_path, 'Davetiye', c.invitation_file_name)}
                          disabled={!c.invitation_file_path}
                          title={c.invitation_file_path ? `Davetiye: ${c.invitation_file_name || ''}` : 'Davetiye yok'}
                          className={`p-1.5 rounded-md border transition-all ${
                            c.invitation_file_path
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer'
                              : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <EnvelopeOpenIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDoc(c.business_license_file_path, 'Faaliyet', c.business_license_file_name)}
                          disabled={!c.business_license_file_path}
                          title={c.business_license_file_path ? `Faaliyet: ${c.business_license_file_name || ''}` : 'Faaliyet belgesi yok'}
                          className={`p-1.5 rounded-md border transition-all ${
                            c.business_license_file_path
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer'
                              : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <DocumentTextIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDoc(c.id_card_file_path, 'ID Kart', c.id_card_file_name)}
                          disabled={!c.id_card_file_path}
                          title={c.id_card_file_path ? `ID Kart: ${c.id_card_file_name || ''}` : 'ID kart yok'}
                          className={`p-1.5 rounded-md border transition-all ${
                            c.id_card_file_path
                              ? 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 cursor-pointer'
                              : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <IdentificationIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{c.inviter_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono hidden lg:table-cell">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Link href={`/chinese-companies/${c.id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Duzenle">
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button onClick={() => del(c.id, c.company_name)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sil">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
