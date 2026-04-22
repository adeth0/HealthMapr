"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Insights",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3" y="3" width="6" height="6" rx="2"
          fill={active ? "white" : "none"}
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
        <rect
          x="13" y="3" width="6" height="6" rx="2"
          fill={active ? "white" : "none"}
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
        <rect
          x="3" y="13" width="6" height="6" rx="2"
          fill="none"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
        <rect
          x="13" y="13" width="6" height="6" rx="2"
          fill="none"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/log",
    label: "Log",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="11" r="8"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
        <path
          d="M11 7v4l3 3"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/trends",
    label: "Trends",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 15l4-4 4 2 5-6 3 1"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="8" r="3.5"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
        />
        <path
          d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
          stroke={active ? "white" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        flex justify-around items-end
        px-4 pb-safe
        border-t border-white/[0.07]
      "
      style={{
        background: "rgba(8,8,15,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="
              flex flex-col items-center gap-1 pt-3 pb-1 px-4
              transition-opacity duration-150
            "
            style={{ opacity: active ? 1 : 0.5 }}
          >
            {item.icon(active)}
            <span
              className={`
                text-[10px] font-medium tracking-wide
                ${active ? "text-white" : "text-white/40"}
              `}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
