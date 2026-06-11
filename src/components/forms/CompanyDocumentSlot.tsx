'use client'

import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

const BUCKET = 'company-documents'
const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif'
const MAX_SIZE_MB = 10

interface Props {
  label: string
  description?: string
  /** Hangi tabloya update atılacak (örn: chinese_companies, turkish_companies) */
  table: 'chinese_companies' | 'turkish_companies'
  /** Tablodaki kolon adı (örn: invitation_file_path) */
  pathColumn: string
  /** Kolon adı (örn: invitation_file_name) */
  nameColumn: string
  /** Eklendiği şirketin ID'si (yeni form için crypto.randomUUID ile üretilebilir) */
  companyId: string
  /** Kullanıcı ID — RLS path zorunluluğu için */
  userId: string
  /** İçeride çağrılacak supabase client */
  supabase: SupabaseClient
  /** Şu anki dosyanın storage path'i (yoksa null) */
  currentPath: string | null
  /** Şu anki dosyanın gösterim adı */
  currentName: string | null
  /** "new" modunda DB'de henüz şirket kaydı yok — upload yapılır ama DB update atlanır.
   *  "edit" modunda upload + DB update yapılır. */
  mode: 'new' | 'edit'
  /** Upload başarılı olduğunda parent'a (path, name) bildirilir. */
  onChange: (path: string | null, name: string | null) => void
  /** Yüklenebilir mi? (kullanıcı oturumu yoksa false) */
  disabled?: boolean
}

export default function CompanyDocumentSlot({
  label,
  description,
  table,
  pathColumn,
  nameColumn,
  companyId,
  userId,
  supabase,
  currentPath,
  currentName,
  mode,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const isImage =
    currentName && /\.(png|jpe?g|webp|heic|heif)$/i.test(currentName)

  async function handleFile(file: File) {
    if (!file) return
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Dosya ${MAX_SIZE_MB}MB'tan büyük olamaz`)
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const safeType = pathColumn.replace(/_file_path$/, '')
      const path = `${userId}/${companyId}/${safeType}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        })
      if (upErr) throw upErr

      if (currentPath && currentPath !== path) {
        await supabase.storage.from(BUCKET).remove([currentPath])
      }

      if (mode === 'edit') {
        const { error: dbErr } = await supabase
          .from(table)
          .update({ [pathColumn]: path, [nameColumn]: file.name })
          .eq('id', companyId)
        if (dbErr) throw dbErr
      }

      onChange(path, file.name)
      toast.success(`${label} yüklendi`)
    } catch (e: any) {
      console.error(e)
      toast.error('Yükleme hatası: ' + (e.message || 'Bilinmeyen'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDownload() {
    if (!currentPath) return
    setBusy(true)
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(currentPath)
      if (error || !data) throw error || new Error('Dosya indirilemedi')
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = currentName || 'dosya'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error(e)
      toast.error('İndirme hatası: ' + (e.message || ''))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!currentPath) return
    if (!confirm(`${label} silinsin mi?`)) return
    setBusy(true)
    try {
      await supabase.storage.from(BUCKET).remove([currentPath])

      if (mode === 'edit') {
        const { error: dbErr } = await supabase
          .from(table)
          .update({ [pathColumn]: null, [nameColumn]: null })
          .eq('id', companyId)
        if (dbErr) throw dbErr
      }

      onChange(null, null)
      toast.success(`${label} silindi`)
    } catch (e: any) {
      console.error(e)
      toast.error('Silme hatası: ' + (e.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition-colors hover:border-slate-600/60">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isImage ? (
              <PhotoIcon className="h-4 w-4 text-amber-400" />
            ) : (
              <DocumentIcon className="h-4 w-4 text-amber-400" />
            )}
            <h4 className="text-sm font-semibold text-white">{label}</h4>
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
          )}
        </div>
        {currentPath && (
          <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
            Yüklendi
          </span>
        )}
      </div>

      {currentPath ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-700/40 bg-[#060912] px-3 py-2 text-xs text-slate-300">
            <span className="truncate font-mono" title={currentName || ''}>
              {currentName || 'dosya'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy || disabled}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" /> İndir
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy || disabled}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-600/40 bg-slate-700/30 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700/50 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-3.5 w-3.5" /> Değiştir
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy || disabled}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
              title="Sil"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/40 px-3 py-4 text-xs font-medium text-slate-400 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400 disabled:opacity-50"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          {busy ? 'Yükleniyor...' : 'Dosya seç (PDF veya görsel)'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}
