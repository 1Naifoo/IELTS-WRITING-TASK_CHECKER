import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-action-600 text-white hover:bg-action-700 disabled:bg-slate-300 disabled:text-slate-500',
  secondary:
    'bg-white text-action-700 border border-action-100 hover:border-action-500 hover:bg-action-50 disabled:text-slate-400 disabled:border-slate-200',
  ghost: 'text-action-700 hover:bg-action-50 disabled:text-slate-400',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:text-slate-400',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-mint-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </section>
  )
}

type Tone = 'info' | 'warning' | 'error' | 'success' | 'accent'

const TONE: Record<Tone, string> = {
  info: 'border-action-100 bg-action-50 text-action-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-mint-300 bg-mint-100 text-emerald-900',
  accent: 'border-accent-200 bg-accent-50 text-accent-800',
}

export function Notice({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TONE[tone]} ${className}`}
    >
      {children}
    </div>
  )
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 text-slate-600">{subtitle}</p>}
    </header>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-action-700 underline underline-offset-2 hover:text-action-600"
    >
      {children}
    </a>
  )
}
