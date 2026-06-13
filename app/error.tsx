"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Root application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
      <div className="bg-red-50 text-red-500 p-4 rounded-full mb-6">
        <AlertTriangle className="h-10 w-10 text-danger" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Application Error</h2>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-8 leading-relaxed">
        We encountered an unexpected error. Please try reloading the page or return home.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all cursor-pointer select-none"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </button>
        <a
          href="/"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-2.5 text-sm font-semibold transition-colors select-none"
        >
          <Home className="h-4 w-4" />
          Go Home
        </a>
      </div>
    </div>
  )
}
