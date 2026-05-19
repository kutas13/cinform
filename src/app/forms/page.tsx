'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { copyToClipboard } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, ClipboardDocumentIcon, CheckIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface FormItem {
  id: string
  access_token: string
  travel_name: string | null
  visa_type: string
  travel_start_date: string
  travel_end_date: string
  entries_type: string
  created_at: string
  customer: { full_name: string } | null
  chinese_company: { company_name: string } | null
  turkish_company: { company_name: string } | null
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) loadForms()
  }, [user])

  async function loadForms() {
    // Tek sorguda foreign key'leri birlikte cek (N+1 yerine 1 query).
    const { data, error } = await supabase
      .from('forms')
      .select(`
        id, access_token, travel_name, visa_type,
        travel_start_date, travel_end_date, entries_type, created_at,
        customer:customers(full_name),
        chinese_company:chinese_companies(company_name),
        turkish_company:turkish_companies(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Yuklenemedi')
      console.error(error)
      setLoading(false)
      return
    }

    setForms((data as unknown as FormItem[]) || [])
    setLoading(false)
  }

  async function deleteForm(id: string) {
    if (!confirm('Bu form silinsin mi?')) return
    const { error } = await supabase.from('forms').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); loadForms() }
  }

  async function handleCopy(token: string, id: string) {
    const ok = await copyToClipboard(token)
    if (ok) {
      toast.success('Token kopyalandi!')
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const filtered = forms.filter(f => {
    const q = search.toLowerCase()
    return (
      f.access_token.toLowerCase().includes(q) ||
      (f.customer?.full_name || '').toLowerCase().includes(q) ||
      (f.chinese_company?.company_name || '').toLowerCase().includes(q) ||
      (f.travel_name || '').toLowerCase().includes(q)
    )
  })

  const entryTypeColors: Record<string, string> = {
    'Single': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Double': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Multiple': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <DocumentTextIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <h1 className="page-title">Formlar</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">Toplam {forms.length} form</p>
        </div>
        <Link href="/forms/new" className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="h-4 w-4" /> Yeni Form
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Token, musteri veya sirket ile ara..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-slate-500">Yukleniyor...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-1 font-medium">Henuz form yok</p>
          <p className="text-slate-600 text-sm mb-6">Ilk formu olusturarak baslayin</p>
          <Link href="/forms/new" className="btn-primary">Ilk Formu Olustur</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(f => (
            <div key={f.id} className="card p-5 hover:border-slate-600/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                    <span className="text-sm font-bold text-emerald-400">
                      {(f.customer?.full_name || '?').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{f.customer?.full_name || 'Bilinmeyen Musteri'}</h3>
                    <p className="text-slate-500 text-xs">
                      {f.chinese_company?.company_name} → {f.turkish_company?.company_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${entryTypeColors[f.entries_type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {f.entries_type}
                  </span>
                  <span className="text-xs text-slate-600">{new Date(f.created_at).toLocaleDateString('tr-TR')}</span>
                  <button onClick={() => deleteForm(f.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0e1a] rounded-xl p-3 border border-slate-700/50 flex items-center justify-between gap-3">
                <code className="text-emerald-400 font-mono text-xs break-all flex-1">{f.access_token}</code>
                <button
                  onClick={() => handleCopy(f.access_token, f.id)}
                  className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                  {copiedId === f.id ? <><CheckIcon className="h-3.5 w-3.5" /> Kopyalandi</> : <><ClipboardDocumentIcon className="h-3.5 w-3.5" /> Kopyala</>}
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
                {f.travel_name && <span className="text-blue-400 font-medium">{f.travel_name}</span>}
                <span>Vize: {f.visa_type}</span>
                <span>Gidis: {new Date(f.travel_start_date).toLocaleDateString('tr-TR')}</span>
                <span>Donus: {new Date(f.travel_end_date).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
