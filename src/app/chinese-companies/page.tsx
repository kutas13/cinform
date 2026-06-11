'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PencilIcon, TrashIcon, BuildingOfficeIcon, ChatBubbleLeftIcon,
  DocumentTextIcon, IdentificationIcon, EnvelopeOpenIcon,
} from '@heroicons/react/24/outline'
import ListPageShell from '@/components/shared/ListPageShell'
import NotesPanel from '@/components/shared/NotesPanel'
import type { ViewMode } from '@/components/shared/ViewToggle'

const DOC_BUCKET = 'company-documents'
const PAGE_SIZE = 20

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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesEntity, setNotesEntity] = useState<{ id: string; name: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientClient()

  const currentPage = Number(searchParams.get('page')) || 1

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('chinese_companies')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)

    if (debouncedSearch.trim()) {
      query = query.or(`company_name.ilike.%${debouncedSearch.trim()}%,city.ilike.%${debouncedSearch.trim()}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else {
      setCompanies(((data as unknown) as ChineseCompany[]) || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [user, currentPage, debouncedSearch])

  useEffect(() => { load() }, [load])

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('chinese_companies').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); load() }
  }

  async function downloadDoc(path: string | null, label: string, fileName?: string | null) {
    if (!path) return
    try {
      const { data, error } = await supabase.storage.from(DOC_BUCKET).download(path)
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

  function openNotes(c: ChineseCompany) {
    setNotesEntity({ id: c.id, name: c.company_name })
    setNotesOpen(true)
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/chinese-companies?${params.toString()}`)
  }

  const filtered = companies
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function DocIcons({ c }: { c: ChineseCompany }) {
    return (
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => downloadDoc(c.invitation_file_path, 'Davetiye', c.invitation_file_name)} disabled={!c.invitation_file_path} title={c.invitation_file_path ? 'Davetiye indir' : 'Davetiye yok'}
          className={`p-1.5 rounded-md border transition-all ${c.invitation_file_path ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'}`}>
          <EnvelopeOpenIcon className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => downloadDoc(c.business_license_file_path, 'Faaliyet', c.business_license_file_name)} disabled={!c.business_license_file_path} title={c.business_license_file_path ? 'Faaliyet indir' : 'Faaliyet yok'}
          className={`p-1.5 rounded-md border transition-all ${c.business_license_file_path ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'}`}>
          <DocumentTextIcon className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => downloadDoc(c.id_card_file_path, 'ID Kart', c.id_card_file_name)} disabled={!c.id_card_file_path} title={c.id_card_file_path ? 'ID Kart indir' : 'ID kart yok'}
          className={`p-1.5 rounded-md border transition-all ${c.id_card_file_path ? 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'}`}>
          <IdentificationIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <>
      <ListPageShell
        title="Cinli Sirketler"
        icon={<BuildingOfficeIcon className="h-5 w-5 text-amber-400" />}
        iconBgClass="bg-amber-500/10"
        totalCount={totalCount}
        createHref="/chinese-companies/new"
        createLabel="Yeni Sirket"
        searchPlaceholder="Sirket adi veya sehir ile ara..."
        search={search}
        onSearchChange={(v) => { setSearch(v); if (currentPage !== 1) handlePageChange(1) }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        storageKey="chinese-companies"
      >
        {(view: ViewMode) => (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-800/40 animate-pulse" />
              ))}
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
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c, idx) => (
                <div key={c.id} className="card p-5 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                        <span className="text-sm font-bold text-amber-400">{c.company_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.company_name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">{c.city}</span>
                      </div>
                    </div>
                    <button onClick={() => openNotes(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Notlar">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Davet Eden</span>
                      <span className="text-xs text-slate-400">{c.inviter_name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Belgeler</span>
                      <DocIcons c={c} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="text-[10px] text-slate-600">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/chinese-companies/${c.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => del(c.id, c.company_name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sirket Adi</th>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sehir</th>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Belgeler</th>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Davet Eden</th>
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
                        <td className="px-6 py-4"><DocIcons c={c} /></td>
                        <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{c.inviter_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openNotes(c)} className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Notlar">
                              <ChatBubbleLeftIcon className="h-4 w-4" />
                            </button>
                            <Link href={`/chinese-companies/${c.id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Duzenle">
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
          )
        )}
      </ListPageShell>

      {notesEntity && (
        <NotesPanel
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          entityType="chinese_company"
          entityId={notesEntity.id}
          entityName={notesEntity.name}
        />
      )}
    </>
  )
}
