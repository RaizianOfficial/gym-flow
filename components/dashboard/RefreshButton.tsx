"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"

export default function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastUpdated, setLastUpdated] = useState("just now")

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span>Last updated {isPending ? "updating..." : lastUpdated}</span>
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        aria-label="Refresh data"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      </button>
    </div>
  )
}
