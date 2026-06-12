"use client"

import { usePathname } from "next/navigation"

export default function HeaderTitle() {
  const pathname = usePathname()

  let title = "Dashboard"
  if (pathname.includes("/members")) {
    title = "Members"
  } else if (pathname.includes("/attendance")) {
    title = "Attendance"
  } else if (pathname.includes("/revenue")) {
    title = "Revenue"
  } else if (pathname.includes("/me")) {
    title = "My Portal"
  }

  return <span className="font-semibold text-slate-900 text-lg">{title}</span>
}
