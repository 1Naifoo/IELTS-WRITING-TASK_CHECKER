import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { APP_NAME, AUTHOR, DISCLAIMER, REPO_URL } from '../configs/app'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/results', label: 'Results', end: false },
  { to: '/about', label: 'About', end: false },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-100 text-accent-800' : 'text-slate-600 hover:bg-mint-100 hover:text-accent-800'
  }`
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 4.3c.4-1.7 3-1.7 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.5 1.8 3 0 3.5a1.7 1.7 0 0 0-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.8-3 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.8-.4-1.8-3 0-3.4a1.7 1.7 0 0 0 1-2.6c-.9-1.5.9-3.3 2.4-2.4a1.7 1.7 0 0 0 2.6-1z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-mint-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3" aria-label="Main">
        {/* Logo placeholder: replace with the real logo later. */}
        <Link to="/" className="mr-auto flex items-center gap-2" aria-label={`${APP_NAME} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-600 text-sm font-bold text-white">
            IW
          </span>
          <span className="hidden font-bold text-accent-800 sm:inline">{APP_NAME}</span>
        </Link>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) => `${navClass({ isActive })} px-2.5!`}
          aria-label="Settings"
          title="Settings"
        >
          <GearIcon />
        </NavLink>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-mint-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-xs leading-relaxed text-slate-500">
        <p>
          <strong className="text-slate-700">{DISCLAIMER.title}</strong>{' '}
          {DISCLAIMER.full}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Made by <span className="font-semibold text-accent-700">{AUTHOR}</span>
          </span>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-action-700">
            Open source on GitHub
          </a>
          <span>Your essays and key stay in this browser.</span>
        </p>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-mint-50 text-slate-800">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
