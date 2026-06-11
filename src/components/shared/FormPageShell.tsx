'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Props {
  title: string
  subtitle: string
  backHref: string
  backLabel: string
  icon: ReactNode
  iconBgClass: string
  children: ReactNode
}

export default function FormPageShell({ title, subtitle, backHref, backLabel, icon, iconBgClass, children }: Props) {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors group">
        <ArrowLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${iconBgClass} shrink-0`}>
            {icon}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            <p className="text-slate-500 mt-0.5 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
