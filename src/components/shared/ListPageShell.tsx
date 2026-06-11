'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import ViewToggle, { ViewMode } from './ViewToggle'
import Pagination from './Pagination'

interface Props {
  title: string
  subtitle?: string
  icon: ReactNode
  iconBgClass: string
  totalCount: number
  createHref: string
  createLabel: string
  searchPlaceholder: string
  search: string
  onSearchChange: (v: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
  storageKey: string
  children: (view: ViewMode) => ReactNode
}

export default function ListPageShell({
  title,
  subtitle,
  icon,
  iconBgClass,
  totalCount,
  createHref,
  createLabel,
  searchPlaceholder,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  storageKey,
  children,
}: Props) {
  const [view, setView] = useState<ViewMode>('grid')

  useEffect(() => {
    const saved = localStorage.getItem(`view_${storageKey}`)
    if (saved === 'table' || saved === 'grid') setView(saved)
  }, [storageKey])

  function handleViewChange(v: ViewMode) {
    setView(v)
    localStorage.setItem(`view_${storageKey}`, v)
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2.5 rounded-xl ${iconBgClass}`}>
              {icon}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
              <p className="text-slate-500 text-sm">{subtitle || `Toplam ${totalCount} kayit`}</p>
            </div>
          </div>
        </div>
        <Link href={createHref} className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="h-4 w-4" /> {createLabel}
        </Link>
      </div>

      {/* Search + Toggle */}
      <div className="sticky top-0 z-10 -mx-6 lg:-mx-10 px-6 lg:px-10 py-3 bg-[#0f0f17]/90 backdrop-blur-xl border-b border-slate-800/50 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <ViewToggle view={view} onChange={handleViewChange} />
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {children(view)}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
