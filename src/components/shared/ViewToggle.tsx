'use client'

import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'

export type ViewMode = 'grid' | 'table'

interface Props {
  view: ViewMode
  onChange: (v: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex items-center rounded-xl border border-slate-700/50 bg-slate-800/60 p-1">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          view === 'grid'
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Squares2X2Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          view === 'table'
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <ListBulletIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tablo</span>
      </button>
    </div>
  )
}
