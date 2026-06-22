'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { CalendarDaysIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface YunanCustomer {
  id: string
  full_name: string
  tc_number: string
  appointment_date: string
  choice_index: number
  status: 'pending' | 'done' | 'error'
  created_at: string
}

const statusLabel: Record<string, string> = {
  pending: 'Bekliyor',
  done: 'Tamamlandi',
  error: 'Hata',
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export default function YunanCustomersPage() {
  const [customers, setCustomers] = useState<YunanCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', tc_number: '', appointment_date: '', choice_index: 1 })
  const { user } = useAuth()
  const supabase = createClientClient()

  const loadCustomers = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await (supabase
      .from('yunan_customers') as any)
      .select('*')
      .eq('created_by', user.id)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error(error)
      if (error.code === '42P01') {
        toast.error('yunan_customers tablosu bulunamadi. SQL dosyasini calistirin.')
      }
    } else {
      setCustomers((data as YunanCustomer[]) || [])
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  async function addCustomer() {
    if (!user) return
    if (!form.full_name.trim()) { toast.error('Isim girin'); return }
    if (form.tc_number.length !== 11) { toast.error('TC 11 haneli olmali'); return }
    if (!form.appointment_date) { toast.error('Tarih secin'); return }

    setSaving(true)
    const { error } = await (supabase.from('yunan_customers') as any).insert({
      full_name: form.full_name.trim().toUpperCase(),
      tc_number: form.tc_number,
      appointment_date: form.appointment_date,
      choice_index: form.choice_index,
      status: 'pending',
      created_by: user.id,
    })

    if (error) {
      console.error(error)
      toast.error('Eklenemedi: ' + (error.message || ''))
    } else {
      toast.success('Musteri eklendi!')
      setForm({ full_name: '', tc_number: '', appointment_date: '', choice_index: 1 })
      setFormOpen(false)
      loadCustomers()
    }
    setSaving(false)
  }

  async function deleteCustomer(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const { error } = await (supabase.from('yunan_customers') as any).delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Silindi'); loadCustomers() }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await (supabase.from('yunan_customers') as any).update({ status }).eq('id', id)
    if (!error) loadCustomers()
  }

  const pendingCount = customers.filter(c => c.status === 'pending').length

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <CalendarDaysIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Yunan Randevu</h1>
            <p className="text-slate-500 text-sm">
              {pendingCount} bekleyen / {customers.length} toplam musteri
            </p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          {formOpen ? 'Kapat' : 'Yeni Musteri'}
        </button>
      </div>

      {/* Add Form */}
      {formOpen && (
        <div className="card p-6 mb-6 animate-fade-in border border-blue-500/20">
          <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-4">Yeni Yunan Randevu Musterisi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Ad Soyad *</label>
              <input
                type="text"
                className="input-field"
                placeholder="ISIM SOYISIM"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">TC Kimlik No *</label>
              <input
                type="text"
                className="input-field font-mono tracking-wider"
                placeholder="11 haneli TC"
                maxLength={11}
                value={form.tc_number}
                onChange={e => setForm({ ...form, tc_number: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div>
              <label className="form-label">Randevu Tarihi *</label>
              <input
                type="date"
                className="input-field"
                value={form.appointment_date}
                onChange={e => setForm({ ...form, appointment_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Kisi Secimi</label>
              <select
                className="input-field"
                value={form.choice_index}
                onChange={e => setForm({ ...form, choice_index: parseInt(e.target.value) })}
              >
                <option value={1}>1. Secenek</option>
                <option value={2}>2. Secenek</option>
                <option value={3}>3. Secenek</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setFormOpen(false)} className="btn-secondary">Iptal</button>
            <button onClick={addCustomer} disabled={saving} className="btn-primary">
              {saving ? 'Ekleniyor...' : 'Musteri Ekle'}
            </button>
          </div>
        </div>
      )}

      {/* Tarih Kartlari */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Yukleniyor...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
            <CalendarDaysIcon className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-1 font-medium">Henuz musteri yok</p>
          <p className="text-slate-600 text-sm mb-6">Yunan vize randevusu icin musteri ekleyin</p>
          <button onClick={() => setFormOpen(true)} className="btn-primary">Ilk Musteriyi Ekle</button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            customers.reduce<Record<string, YunanCustomer[]>>((acc, c) => {
              const key = c.appointment_date.substring(0, 10)
              if (!acc[key]) acc[key] = []
              acc[key].push(c)
              return acc
            }, {})
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, group]) => {
              const [y, m, d] = date.split('-')
              const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
              const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' })
              const dayNum = d
              const monthName = dateObj.toLocaleDateString('tr-TR', { month: 'long' })
              const year = y
              const pendingInGroup = group.filter(c => c.status === 'pending').length
              const doneInGroup = group.filter(c => c.status === 'done').length

              return (
                <div key={date} className="rounded-2xl border border-slate-700/30 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d1225 0%, #080c18 100%)' }}>
                  {/* Tarih Basligi */}
                  <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-700/30" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.05) 100%)' }}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-black text-blue-400 leading-none">{dayNum}</span>
                      <span className="text-[9px] font-bold text-blue-400/70 uppercase">{monthName.substring(0, 3)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-white">{dayNum} {monthName} {year}</div>
                      <div className="text-xs text-slate-500 capitalize">{dayName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingInGroup > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {pendingInGroup} Bekliyor
                        </span>
                      )}
                      {doneInGroup > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          {doneInGroup} Tamam
                        </span>
                      )}
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        {group.length} Kisi
                      </span>
                    </div>
                  </div>

                  {/* Musteri Kartlari */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.map((c) => (
                      <div key={c.id} className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-4 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all group/card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/25 to-cyan-500/15 flex items-center justify-center border border-blue-500/20">
                              <span className="text-sm font-bold text-blue-400">{c.full_name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{c.full_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.tc_number}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${statusColor[c.status] || ''}`}>
                            {statusLabel[c.status] || c.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{c.choice_index}. secenek</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            {(c.status === 'done' || c.status === 'error') && (
                              <button
                                onClick={() => updateStatus(c.id, 'pending')}
                                className="px-2 py-1 rounded-md text-[10px] font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                              >
                                {c.status === 'done' ? 'Sifirla' : 'Tekrar'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteCustomer(c.id, c.full_name)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
