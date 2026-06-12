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

      {/* Customer Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Yukleniyor...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-1 font-medium">Henuz musteri yok</p>
            <p className="text-slate-600 text-sm mb-6">Yunan vize randevusu icin musteri ekleyin</p>
            <button onClick={() => setFormOpen(true)} className="btn-primary">Ilk Musteriyi Ekle</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ad Soyad</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TC Kimlik</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tarih</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secenek</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durum</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Islem</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.id} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-600 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
                          <span className="text-xs font-bold text-blue-400">{c.full_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{c.tc_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(c.appointment_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.choice_index}. secenek</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${statusColor[c.status] || ''}`}>
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        {c.status === 'done' && (
                          <button
                            onClick={() => updateStatus(c.id, 'pending')}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all text-xs"
                            title="Tekrar beklete al"
                          >
                            Sifirla
                          </button>
                        )}
                        {c.status === 'error' && (
                          <button
                            onClick={() => updateStatus(c.id, 'pending')}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all text-xs"
                            title="Tekrar dene"
                          >
                            Tekrar
                          </button>
                        )}
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
        )}
      </div>
    </div>
  )
}
