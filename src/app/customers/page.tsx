'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface Customer {
  id: string
  full_name: string
  tc_number: string
  birth_province: string
  marital_status: string
  occupation_type: string
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) loadCustomers()
  }, [user])

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, tc_number, birth_province, marital_status, occupation_type, created_at')
      .eq('created_by', user!.id)
      .order('created_at', { ascending: false })

    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else setCustomers(data || [])
    setLoading(false)
  }

  async function deleteCustomer(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); loadCustomers() }
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.tc_number.includes(search)
  )

  const maritalLabel: Record<string, string> = {
    'Single': 'Bekar', 'Married': 'Evli', 'Divorced': 'Bosanmis', 'Widowed': 'Dul', 'Other': 'Diger'
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <UserGroupIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="page-title">Musteriler</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">Toplam {customers.length} musteri</p>
        </div>
        <Link href="/customers/new" className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="h-4 w-4" /> Yeni Musteri
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Ad veya TC ile ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            <p className="text-xs text-slate-500">Yukleniyor...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-1 font-medium">Henuz musteri yok</p>
          <p className="text-slate-600 text-sm mb-6">Ilk musterinizi olusturarak baslayin</p>
          <Link href="/customers/new" className="btn-primary">Ilk Musteriyi Olustur</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ad Soyad</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TC Kimlik</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Sehir</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Durum</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Tarih</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Islem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/20">
                          <span className="text-xs font-bold text-blue-400">{c.full_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{c.tc_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{c.birth_province}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {maritalLabel[c.marital_status] || c.marital_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/customers/${c.id}/edit`}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Duzenle"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteCustomer(c.id, c.full_name)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Sil"
                        >
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
