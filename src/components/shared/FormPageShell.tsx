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
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium mb-6 transition-all group uppercase tracking-wider">
        <ArrowLeftIcon className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${iconBgClass} border border-white/[0.06] shrink-0`}>
            {icon}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-slate-500 mt-0.5 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
