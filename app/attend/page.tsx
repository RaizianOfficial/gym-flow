import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkInMember } from "@/app/actions/gym"
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ gym?: string; token?: string }>
}

export default async function AttendPage({ searchParams }: PageProps) {
  const { gym, token } = await searchParams

  if (!gym || !token) {
    return <ErrorLayout message="Invalid check-in link. Please scan a fresh QR code at the desk." />
  }

  const session = await auth()
  if (!session?.user) {
    const callbackUrl = `/attend?gym=${gym}&token=${token}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const res = await checkInMember(gym, token)

  if (res.redirect) {
    const callbackUrl = `/attend?gym=${gym}&token=${token}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  if (res.error) {
    return <ErrorLayout message={res.error} />
  }

  const alreadyCheckedIn = res.alreadyCheckedIn
  const memberName = res.memberName
  const gymName = res.gymName

  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 bg-bg">
      <div className="bg-card w-full max-w-md p-8 shadow-md rounded-xl border border-secondary/5 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 animate-pulse text-success" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20 mb-3">
          Checked In
        </span>

        <h2 className="text-2xl font-bold tracking-tight text-primary">
          {alreadyCheckedIn ? "Already Checked In" : "Check-in Successful"}
        </h2>
        
        <p className="text-sm text-secondary/60 mt-2">
          {alreadyCheckedIn
            ? "You have already logged your check-in for today."
            : "Welcome! Your daily attendance check-in has been recorded."}
        </p>

        <div className="w-full bg-slate-50 rounded-xl p-4 border border-secondary/5 my-6 text-left space-y-2.5">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary/50">Gym Name</label>
            <p className="text-sm font-semibold text-primary">{gymName}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary/50">Member Name</label>
            <p className="text-sm font-semibold text-primary">{memberName}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary/50">Timestamp</label>
            <p className="text-sm font-semibold text-primary">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}
            </p>
          </div>
        </div>

        <Link
          href={`/${gym}/me`}
          className="flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary transition-all"
        >
          Go to Member Portal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function ErrorLayout({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 bg-bg">
      <div className="bg-card w-full max-w-md p-8 shadow-md rounded-xl border border-secondary/5 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-danger/15 text-danger border border-danger/20 mb-3">
          Check-in Failed
        </span>

        <h2 className="text-2xl font-bold tracking-tight text-primary">Check-in Error</h2>
        <p className="text-sm text-secondary/60 mt-3 max-w-xs leading-relaxed">{message}</p>

        <div className="pt-6 w-full border-t border-secondary/5 mt-6">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
