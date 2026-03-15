'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/components/providers/AuthProvider'
import { copyToClipboard } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

interface FormItem {
  id: string
  access_token: string
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
    // Once formlari al
    const { data: formsData, error: formsError } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (formsError) { 
      toast.error('Yuklenemedi'); 
      console.error(formsError);
      setLoading(false);
      return;
    }

    // Her form icin iliskili verileri al
    const enriched = await Promise.all((formsData || []).map(async (form: any) => {
      const [custRes, chinRes, turkRes] = await Promise.all([
        supabase.from('customers').select('full_name').eq('id', form.customer_id).single(),
        supabase.from('chinese_companies').select('company_name').eq('id', form.chinese_company_id).single(),
        supabase.from('turkish_companies').select('company_name').eq('id', form.turkish_company_id).single(),
      ]);
      return {
        ...form,
        customer: custRes.data,
        chinese_company: chinRes.data,
        turkish_company: turkRes.data,
      };
    }));

    setForms(enriched);
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
      (f.chinese_company?.company_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-950 bg-grid py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-2 inline-block">← Dashboard</Link>
            <h1 className="page-title">Formlar</h1>
          </div>
          <Link href="/forms/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Yeni Form
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Token, musteri veya sirket ile ara..."
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
            <p className="text-slate-400 mb-4">Henuz form yok</p>
            <Link href="/forms/new" className="btn-primary">Ilk Formu Olustur</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(f => (
              <div key={f.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {f.customer?.full_name || 'Bilinmeyen Musteri'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {f.chinese_company?.company_name} → {f.turkish_company?.company_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {f.entries_type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(f.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    <button
                      onClick={() => deleteForm(f.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Token */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                  <code className="text-emerald-400 font-mono text-sm break-all mr-4">
                    {f.access_token}
                  </code>
                  <button
                    onClick={() => handleCopy(f.access_token, f.id)}
                    className="flex-shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {copiedId === f.id ? (
                      <><CheckIcon className="h-4 w-4" /> Kopyalandi</>
                    ) : (
                      <><ClipboardDocumentIcon className="h-4 w-4" /> Kopyala</>
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
                  <span>Vize: {f.visa_type}</span>
                  <span>Gidis: {new Date(f.travel_start_date).toLocaleDateString('tr-TR')}</span>
                  <span>Donus: {new Date(f.travel_end_date).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}