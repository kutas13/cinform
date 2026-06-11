'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, UserGroupIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import ListPageShell from '@/components/shared/ListPageShell'
import NotesPanel from '@/components/shared/NotesPanel'
import type { ViewMode } from '@/components/shared/ViewToggle'

interface Customer {
  id: string
  full_name: string
  tc_number: string
  birth_province: string
  marital_status: string
  occupation_type: string
  created_at: string
}

const PAGE_SIZE = 20

const maritalLabel: Record<string, string> = {
  'Single': 'Bekar', 'Married': 'Evli', 'Divorced': 'Bosanmis', 'Widowed': 'Dul', 'Other': 'Diger'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
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

  const loadCustomers = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    setTotalCount(count || 0)

    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, tc_number, birth_province, marital_status, occupation_type, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) { toast.error('Yuklenemedi'); console.error(error) }
    else setCustomers((data as Customer[]) || [])
    setLoading(false)
  }, [user, currentPage])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  async function deleteCustomer(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); loadCustomers() }
  }

  function openNotes(c: Customer) {
    setNotesEntity({ id: c.id, name: c.full_name })
    setNotesOpen(true)
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/customers?${params.toString()}`)
  }

  const filtered = useMemo(() =>
    customers.filter(c =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.tc_number.includes(search)
    ), [customers, search])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <ListPageShell
        title="Musteriler"
        icon={<UserGroupIcon className="h-5 w-5 text-blue-400" />}
        iconBgClass="bg-blue-500/10"
        totalCount={totalCount}
        createHref="/customers/new"
        createLabel="Yeni Musteri"
        searchPlaceholder="Ad veya TC ile ara..."
        search={search}
        onSearchChange={setSearch}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        storageKey="customers"
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
                <UserGroupIcon className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-1 font-medium">Henuz musteri yok</p>
              <p className="text-slate-600 text-sm mb-6">Ilk musterinizi olusturarak baslayin</p>
              <Link href="/customers/new" className="btn-primary">Ilk Musteriyi Olustur</Link>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className="card p-5 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/20">
                        <span className="text-sm font-bold text-blue-400">{c.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{c.tc_number}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openNotes(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Notlar"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Sehir</span>
                      <span className="text-xs text-slate-400">{c.birth_province || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Durum</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {maritalLabel[c.marital_status] || c.marital_status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="text-[10px] text-slate-600">
                      {new Date(c.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/customers/${c.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => deleteCustomer(c.id, c.full_name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
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
                            <button onClick={() => openNotes(c)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Notlar">
                              <ChatBubbleLeftIcon className="h-4 w-4" />
                            </button>
                            <Link href={`/customers/${c.id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Duzenle">
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button onClick={() => deleteCustomer(c.id, c.full_name)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sil">
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
          entityType="customer"
          entityId={notesEntity.id}
          entityName={notesEntity.name}
        />
      )}
    </>
  )
}
