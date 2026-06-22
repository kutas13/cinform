'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import { copyToClipboard } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, ClipboardDocumentIcon, CheckIcon, DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import ListPageShell from '@/components/shared/ListPageShell'
import type { ViewMode } from '@/components/shared/ViewToggle'

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

const PAGE_SIZE = 20

const entryTypeColors: Record<string, string> = {
  'Single': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Double': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Multiple': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientClient()

  const currentPage = Number(searchParams.get('page')) || 1

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const loadForms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('forms')
      .select('id, access_token, travel_name, visa_type, travel_start_date, travel_end_date, entries_type, created_at, customer_id, chinese_company_id, turkish_company_id', { count: 'exact' })

    if (debouncedSearch.trim()) {
      query = query.or(`access_token.ilike.%${debouncedSearch.trim()}%,travel_name.ilike.%${debouncedSearch.trim()}%,visa_type.ilike.%${debouncedSearch.trim()}%`)
    }

    const { data: formsData, error: formsError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    setTotalCount(count || 0)

    if (formsError) { toast.error('Yuklenemedi'); console.error(formsError); setLoading(false); return }
    if (!formsData || formsData.length === 0) { setForms([]); setLoading(false); return }

    const custIds = Array.from(new Set(formsData.map((f: any) => f.customer_id).filter(Boolean)))
    const chinIds = Array.from(new Set(formsData.map((f: any) => f.chinese_company_id).filter(Boolean)))
    const turkIds = Array.from(new Set(formsData.map((f: any) => f.turkish_company_id).filter(Boolean)))

    const [custRes, chinRes, turkRes] = await Promise.all([
      custIds.length ? supabase.from('customers').select('id, full_name').in('id', custIds) : { data: [] },
      chinIds.length ? supabase.from('chinese_companies').select('id, company_name').in('id', chinIds) : { data: [] },
      turkIds.length ? supabase.from('turkish_companies').select('id, company_name').in('id', turkIds) : { data: [] },
    ])

    const custMap = new Map(((custRes.data || []) as any[]).map(c => [c.id, c.full_name]))
    const chinMap = new Map(((chinRes.data || []) as any[]).map(c => [c.id, c.company_name]))
    const turkMap = new Map(((turkRes.data || []) as any[]).map(c => [c.id, c.company_name]))

    const enriched: FormItem[] = formsData.map((f: any) => ({
      id: f.id,
      access_token: f.access_token,
      travel_name: f.travel_name,
      visa_type: f.visa_type,
      travel_start_date: f.travel_start_date,
      travel_end_date: f.travel_end_date,
      entries_type: f.entries_type,
      created_at: f.created_at,
      customer: custMap.has(f.customer_id) ? { full_name: custMap.get(f.customer_id)! } : null,
      chinese_company: chinMap.has(f.chinese_company_id) ? { company_name: chinMap.get(f.chinese_company_id)! } : null,
      turkish_company: turkMap.has(f.turkish_company_id) ? { company_name: turkMap.get(f.turkish_company_id)! } : null,
    }))

    setForms(enriched)
    setLoading(false)
  }, [user, currentPage, debouncedSearch])

  useEffect(() => { loadForms() }, [loadForms])

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

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/forms?${params.toString()}`)
  }

  const filtered = forms
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <ListPageShell
      title="Formlar"
      icon={<DocumentTextIcon className="h-5 w-5 text-emerald-400" />}
      iconBgClass="bg-emerald-500/10"
      totalCount={totalCount}
      createHref="/forms/new"
      createLabel="Yeni Form"
      searchPlaceholder="Token, musteri veya sirket ile ara..."
      search={search}
      onSearchChange={(v) => { setSearch(v); if (currentPage !== 1) handlePageChange(1) }}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      storageKey="forms"
    >
      {(view: ViewMode) => (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-800/40 animate-pulse" />
            ))}
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
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f, idx) => (
              <div key={f.id} className="card p-5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                      <span className="text-sm font-bold text-emerald-400">
                        {(f.customer?.full_name || '?').charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.customer?.full_name || 'Bilinmeyen'}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span>{f.chinese_company?.company_name || '?'}</span>
                        <ArrowRightIcon className="h-2.5 w-2.5" />
                        <span>{f.turkish_company?.company_name || '?'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${entryTypeColors[f.entries_type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {f.entries_type}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {f.travel_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Seyahat</span>
                      <span className="text-xs text-blue-400 font-medium">{f.travel_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">Vize</span>
                    <span className="text-xs text-slate-400">{f.visa_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">Tarih</span>
                    <span className="text-xs text-slate-400">
                      {new Date(f.travel_start_date).toLocaleDateString('tr-TR')} — {new Date(f.travel_end_date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0f0f17] rounded-lg p-2.5 border border-slate-700/50 flex items-center justify-between gap-2">
                  <code className="text-emerald-400 font-mono text-[11px] truncate flex-1">{f.access_token}</code>
                  <button
                    onClick={() => handleCopy(f.access_token, f.id)}
                    className="shrink-0 p-1.5 rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all"
                  >
                    {copiedId === f.id ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/50">
                  <span className="text-[10px] text-slate-600">{new Date(f.created_at).toLocaleDateString('tr-TR')}</span>
                  <button onClick={() => deleteForm(f.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Musteri</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Sirketler</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Token</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Vize</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Tarih</th>
                    <th className="text-right px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-xs font-bold text-emerald-400">{(f.customer?.full_name || '?').charAt(0)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">{f.customer?.full_name || 'Bilinmeyen'}</span>
                            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-md border font-medium ${entryTypeColors[f.entries_type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              {f.entries_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span>{f.chinese_company?.company_name || '—'}</span>
                          <ArrowRightIcon className="h-3 w-3 text-slate-600" />
                          <span>{f.turkish_company?.company_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-400 font-mono text-xs">{f.access_token}</code>
                          <button onClick={() => handleCopy(f.access_token, f.id)} className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors">
                            {copiedId === f.id ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 hidden lg:table-cell">{f.visa_type}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 hidden lg:table-cell">
                        {new Date(f.travel_start_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteForm(f.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sil">
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
        )
      )}
    </ListPageShell>
  )
}
