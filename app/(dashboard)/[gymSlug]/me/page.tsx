import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Badge from "@/components/ui/badge"
import { Calendar, CheckSquare, Clock, AlertTriangle, Dumbbell } from "lucide-react"

interface PageProps {
  params: Promise<{ gymSlug: string }>
}

export default async function MemberPortalPage({ params }: PageProps) {
  const { gymSlug } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/me`)
  }

  if (user.role !== "MEMBER") {
    redirect(`/${gymSlug}/dashboard`)
  }

  // Fetch member profile
  const member = await prisma.member.findFirst({
    where: {
      gymId: user.gymId,
      email: user.email
    },
    include: {
      _count: {
        select: {
          attendance: true
        }
      },
      attendance: {
        orderBy: {
          date: "desc"
        },
        take: 10
      }
    }
  })

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-secondary/5 shadow-sm p-8">
        <div className="p-4 bg-bg rounded-full text-secondary/30 mb-4 animate-bounce">
          <Dumbbell className="h-8 w-8" />
        </div>
        <h4 className="font-semibold text-primary text-lg">Profile Unlinked</h4>
        <p className="text-sm text-secondary/60 max-w-sm mt-2">
          Your account is not yet linked to a gym member profile. Please contact the gym administrator and ask them to register your email address: <strong>{user.email}</strong>.
        </p>
      </div>
    )
  }

  // Calculate days remaining
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(member.expiryDate)
  expiry.setHours(0, 0, 0, 0)

  let daysRemaining = 0
  if (expiry >= today) {
    const diffTime = expiry.getTime() - today.getTime()
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const formattedExpiry = expiry.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  const isExpiringSoon = daysRemaining < 5 && member.status !== "EXPIRED"

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Welcome, {member.fullName}</h2>
        <p className="text-sm text-secondary/70">
          Monitor your subscription status, visit history, and renewal alerts.
        </p>
      </div>

      {/* Expiry Alert Warning */}
      {member.status === "EXPIRED" ? (
        <div className="bg-danger/10 text-danger border border-danger/25 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Membership Expired</h4>
            <p className="text-xs text-danger/80 mt-1">
              Your membership expired on {formattedExpiry}. Please contact the gym reception to renew and regain access.
            </p>
          </div>
        </div>
      ) : isExpiringSoon ? (
        <div className="bg-warning/10 text-warning border border-warning/25 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Action Required: Expiring Soon</h4>
            <p className="text-xs text-warning/80 mt-1">
              Your membership expires in {daysRemaining} {daysRemaining === 1 ? "day" : "days"} ({formattedExpiry}). Contact gym staff to renew.
            </p>
          </div>
        </div>
      ) : null}

      {/* Grid of Key Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Days Remaining Card */}
        <div className="bg-card border border-secondary/5 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge variant={member.status as any} />
          </div>
          <span className="text-secondary/50 font-bold uppercase text-[10px] tracking-wider mb-2">Days Remaining</span>
          <h3 className="text-6xl font-black text-primary select-none tracking-tight">
            {member.status === "EXPIRED" ? 0 : daysRemaining}
          </h3>
          <span className="text-xs text-secondary/60 mt-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Expires on {formattedExpiry}
          </span>
        </div>

        {/* Total Attendance Card */}
        <div className="bg-card border border-secondary/5 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <span className="text-secondary/50 font-bold uppercase text-[10px] tracking-wider mb-2">Total Visits</span>
          <h3 className="text-6xl font-black text-accent select-none tracking-tight">
            {member._count.attendance}
          </h3>
          <span className="text-xs text-secondary/60 mt-3 flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" />
            Successful check-ins
          </span>
        </div>

        {/* Membership Details Card */}
        <div className="bg-card border border-secondary/5 rounded-xl shadow-sm p-6 flex flex-col justify-center space-y-4">
          <h4 className="font-bold text-primary text-sm border-b border-secondary/5 pb-2">Plan Details</h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-secondary/60">Subscription Plan:</span>
              <span className="font-bold text-primary capitalize">{member.membershipPlan.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary/60">Start Date:</span>
              <span className="font-semibold text-primary">
                {new Date(member.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary/60">Payment Status:</span>
              <Badge variant={member.paymentStatus as any} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-card border border-secondary/5 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 border-b border-secondary/5 pb-4 mb-6">
          <div className="p-2 bg-secondary/5 text-primary rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-primary">Recent Visits</h3>
            <p className="text-xs text-secondary/60">Your last 10 visits logged at the gym</p>
          </div>
        </div>

        {member.attendance.length === 0 ? (
          <div className="py-8 text-center text-xs text-secondary/50">
            No check-in visits logged yet. Scan the receptionist's QR code to record your visit!
          </div>
        ) : (
          <div className="divide-y divide-secondary/5">
            {member.attendance.map((entry) => {
              const visitDate = new Date(entry.date)
              return (
                <div key={entry.id} className="py-3 flex justify-between items-center text-sm">
                  <span className="font-semibold text-primary">
                    {visitDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                  <span className="text-xs text-secondary font-medium bg-secondary/5 px-2.5 py-1 rounded-lg">
                    {visitDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
