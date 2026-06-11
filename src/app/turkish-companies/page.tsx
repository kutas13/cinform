'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PencilIcon, TrashIcon, BuildingLibraryIcon, ChatBubbleLeftIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'
import ListPageShell from '@/components/shared/ListPageShell'
import NotesPanel from '@/components/shared/NotesPanel'
import type { ViewMode } from '@/components/shared/ViewToggle'

const DOC_BUCKET = 'company-documents'
const PAGE_SIZE = 20

interface TurkishCompany {
  id: string
  company_name: string
  address: string
  phone: string
  manager_name: string
  created_at: string
  stamped_paper_file_path: string | null
  stamped_paper_file_name: string | null
}

export default function TurkishCompaniesPage() {
  const [companies, setCompanies] = useState<TurkishCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesEntity, setNotesEntity] = useState<{ id: string; name: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientClient()

  const currentPage = Number(searchParams.get('page')) || 1

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { count } = await supabase
      .from('turkish_companies')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    setTotalCount(count || 0)

    const { data, error } = await supabase
      .from('turkish_companies')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else setCompanies(((data as unknown) as TurkishCompany[]) || [])
    setLoading(false)
  }, [user, currentPage])

  useEffect(() => { load() }, [load])

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('turkish_companies').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); load() }
  }

  async function downloadStampedPaper(path: string | null, fileName?: string | null) {
    if (!path) return
    try {
      const { data, error } = await supabase.storage.from(DOC_BUCKET).download(path)
      if (error || !data) throw error || new Error('Dosya indirilemedi')
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'kaseli-kagit'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error('Kaseli kagit indirilemedi: ' + (e.message || ''))
    }
  }

  function openNotes(c: TurkishCompany) {
    setNotesEntity({ id: c.id, name: c.company_name })
    setNotesOpen(true)
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/turkish-companies?${params.toString()}`)
  }

  const filtered = useMemo(() =>
    companies.filter(c =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.manager_name?.toLowerCase().includes(search.toLowerCase())
    ), [companies, search])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <ListPageShell
        title="Turk Sirketler"
        icon={<BuildingLibraryIcon className="h-5 w-5 text-rose-400" />}
        iconBgClass="bg-rose-500/10"
        totalCount={totalCount}
        createHref="/turkish-companies/new"
        createLabel="Yeni Sirket"
        searchPlaceholder="Sirket adi veya mudur ile ara..."
        search={search}
        onSearchChange={setSearch}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        storageKey="turkish-companies"
      >
        {(view: ViewMode) => (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
                <BuildingLibraryIcon className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-1 font-medium">Henuz turk sirket yok</p>
              <p className="text-slate-600 text-sm mb-6">Ilk sirketi olusturarak baslayin</p>
              <Link href="/turkish-companies/new" className="btn-primary">Ilk Sirketi Olustur</Link>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className="card p-5 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/20">
                        <span className="text-sm font-bold text-rose-400">{c.company_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.company_name}</p>
                        <p className="text-xs text-slate-500">{c.manager_name || '—'}</p>
                      </div>
                    </div>
                    <button onClick={() => openNotes(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Notlar">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Kaseli Kagit</span>
                      <button
                        type="button"
                        onClick={() => downloadStampedPaper(c.stamped_paper_file_path, c.stamped_paper_file_name)}
                        disabled={!c.stamped_paper_file_path}
                        className={`p-1.5 rounded-md border transition-all ${c.stamped_paper_file_path ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'}`}
                      >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Telefon</span>
                      <span className="text-xs text-slate-400 font-mono">{c.phone || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="text-[10px] text-slate-600">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/turkish-companies/${c.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
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
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Belge</th>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Mudur</th>
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
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/20">
                              <span className="text-xs font-bold text-rose-400">{c.company_name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-white">{c.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => downloadStampedPaper(c.stamped_paper_file_path, c.stamped_paper_file_name)} disabled={!c.stamped_paper_file_path}
                            className={`p-1.5 rounded-md border transition-all ${c.stamped_paper_file_path ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-slate-700/40 bg-slate-800/30 text-slate-600 cursor-not-allowed'}`}>
                            <DocumentTextIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{c.manager_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono hidden lg:table-cell">{c.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openNotes(c)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Notlar">
                              <ChatBubbleLeftIcon className="h-4 w-4" />
                            </button>
                            <Link href={`/turkish-companies/${c.id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Duzenle">
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
          entityType="turkish_company"
          entityId={notesEntity.id}
          entityName={notesEntity.name}
        />
      )}
    </>
  )
}
