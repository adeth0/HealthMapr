import { Link, useLocation } from 'react-router-dom'

const navItems = [
  {
    path: '/dashboard',
    label: 'Insights',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M2 16 L6 10 L10 13 L14 6 L18 10 L20 8"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active ? 1 : 0.55}
        />
        <circle cx="6" cy="10" r="1.5" fill={active ? '#0A84FF' : 'currentColor'} opacity={active ? 1 : 0.55} />
        <circle cx="14" cy="6" r="1.5" fill={active ? '#0A84FF' : 'currentColor'} opacity={active ? 1 : 0.55} />
      </svg>
    ),
  },
  {
    path: '/log',
    label: 'Log',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3" y="3" width="16" height="16" rx="4"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          opacity={active ? 1 : 0.55}
        />
        <path
          d="M11 8v6M8 11h6"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          opacity={active ? 1 : 0.55}
        />
      </svg>
    ),
  },
  {
    path: '/trends',
    label: 'Trends',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 19 L3 12 L7 12 L7 19"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={active ? 1 : 0.55}
        />
        <path
          d="M9 19 L9 8 L13 8 L13 19"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={active ? 1 : 0.55}
        />
        <path
          d="M15 19 L15 4 L19 4 L19 19"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={active ? 1 : 0.55}
        />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="7.5" r="3.5"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          opacity={active ? 1 : 0.55}
        />
        <path
          d="M3 19c0-4 3.6-6 8-6s8 2 8 6"
          stroke={active ? '#0A84FF' : 'currentColor'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          opacity={active ? 1 : 0.55}
        />
      </svg>
    ),
  },
]

export default function Nav() {
  const { pathname: raw } = useLocation()
  // HashRouter gives us the hash path after #
  const pathname = raw

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'max(16px, var(--safe-bottom))' }}
    >
      {/* Glass pill */}
      <div className="mx-3 mb-2">
        <div
          className="flex items-center justify-around px-2 py-2 rounded-[28px]"
          style={{
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 active:scale-[0.92]"
                style={{
                  background: active ? 'rgba(10,132,255,0.14)' : 'transparent',
                  minWidth: 56,
                }}
              >
                {item.icon(active)}
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: active ? '#0A84FF' : 'rgba(255,255,255,0.40)' }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
