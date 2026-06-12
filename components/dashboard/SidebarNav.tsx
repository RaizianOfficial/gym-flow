"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CalendarCheck, CreditCard, User as UserIcon } from "lucide-react"

interface SidebarNavProps {
  gymSlug: string
  role: string
}

export default function SidebarNav({ gymSlug, role }: SidebarNavProps) {
  const pathname = usePathname()

  const navigation = role === "OWNER"
    ? [
        { name: "Dashboard", href: `/${gymSlug}/dashboard`, icon: LayoutDashboard },
        { name: "Members", href: `/${gymSlug}/members`, icon: Users },
        { name: "Attendance", href: `/${gymSlug}/attendance`, icon: CalendarCheck },
        { name: "Revenue", href: `/${gymSlug}/revenue`, icon: CreditCard },
      ]
    : [
        { name: "My Portal", href: `/${gymSlug}/me`, icon: UserIcon },
      ]

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-all gap-3 select-none ${
              isActive
                ? "bg-[#22C55E]/10 text-[#22C55E] rounded-lg border-l-2 border-[#22C55E]"
                : "text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
