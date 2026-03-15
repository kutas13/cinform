'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'

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

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-2 inline-block">← Dashboard</Link>
            <h1 className="page-title">Musteriler</h1>
          </div>
          <Link href="/customers/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Yeni Musteri
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Ad veya TC ile ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-400 mb-4">Henuz musteri yok</p>
            <Link href="/customers/new" className="btn-primary">Ilk Musteriyi Olustur</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ad Soyad</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">TC</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sehir</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Islem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{c.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{c.tc_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.birth_province}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {c.marital_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                        title="Duzenle"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteCustomer(c.id, c.full_name)}
                        className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                        title="Sil"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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