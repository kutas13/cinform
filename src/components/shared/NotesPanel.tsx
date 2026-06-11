'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { createClientClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Note {
  id: string
  content: string
  created_at: string
}

interface Props {
  open: boolean
  onClose: () => void
  entityType: 'customer' | 'chinese_company' | 'turkish_company'
  entityId: string
  entityName: string
}

export default function NotesPanel({ open, onClose, entityType, entityId, entityName }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [sending, setSending] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClientClient()

  useEffect(() => {
    if (open && entityId) loadNotes()
  }, [open, entityId])

  async function loadNotes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (!error && data) setNotes(data)
    setLoading(false)
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Oturum bulunamadi'); setSending(false); return }

    const { error } = await supabase.from('notes').insert({
      entity_type: entityType as 'customer' | 'chinese_company' | 'turkish_company',
      entity_id: entityId,
      content: newNote.trim(),
      created_by: session.user.id,
    } as any)

    if (error) {
      toast.error('Not eklenemedi')
    } else {
      setNewNote('')
      await loadNotes()
    }
    setSending(false)
  }

  async function deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-slate-900 border-l border-slate-700/50 shadow-2xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Notlar</h2>
            <p className="text-xs text-slate-500 truncate max-w-[250px]">{entityName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-slate-600 text-sm py-10">Henuz not eklenmemis</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="group relative p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-all">
                <p className="text-sm text-slate-300 whitespace-pre-wrap pr-7">{n.content}</p>
                <p className="text-[10px] text-slate-600 mt-2">
                  {new Date(n.created_at).toLocaleString('tr-TR')}
                </p>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="absolute top-3 right-3 p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* New note input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Not ekle..."
              rows={2}
              className="input-field flex-1 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() }
              }}
            />
            <button
              onClick={addNote}
              disabled={sending || !newNote.trim()}
              className="self-end p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
