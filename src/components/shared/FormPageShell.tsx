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
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-in">
      {/* Animated background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute bottom-20 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-[80px] animate-float" />
      </div>

      {/* Back link */}
      <Link href={backHref} className="inline-flex items-center gap-2 text-slate-500 hover:text-violet-400 text-xs font-medium mb-8 transition-all duration-300 group uppercase tracking-wider">
        <ArrowLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-1.5 transition-transform duration-300" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${iconBgClass} border border-white/[0.08] shrink-0 shadow-lg animate-float`}>
            {icon}
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-2xl shadow-black/20 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
