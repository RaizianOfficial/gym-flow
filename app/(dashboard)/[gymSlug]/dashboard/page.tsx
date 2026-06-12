import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import KpiCard from "@/components/dashboard/kpi-card"
import ActionRequiredList from "@/components/dashboard/ActionRequiredList"
import RefreshButton from "@/components/dashboard/RefreshButton"
import { Users, UserCheck, AlertTriangle, UserX, CreditCard, CalendarCheck } from "lucide-react"

interface PageProps {
  params: Promise<{ gymSlug: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { gymSlug } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/dashboard`)
  }

  const gymId = user.gymId

  // Define Date parameters
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const next7Days = new Date(today)
  next7Days.setDate(next7Days.getDate() + 7)
  next7Days.setHours(23, 59, 59, 999)

  const next3Days = new Date(today)
  next3Days.setDate(next3Days.getDate() + 3)
  next3Days.setHours(23, 59, 59, 999)

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Fetch metrics and gym details in parallel
  const [
    gym,
    totalMembers,
    activeMembers,
    expiringSoon,
    expiredMembers,
    paymentsThisMonth,
    attendanceToday,
    actionRequiredMembersRaw
  ] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: gymId },
      select: { name: true }
    }),
    // 1. Total Members
    prisma.member.count({ where: { gymId } }),
    // 2. Active Members (ACTIVE or EXPIRING_SOON statuses)
    prisma.member.count({
      where: {
        gymId,
        status: { in: ["ACTIVE", "EXPIRING_SOON"] }
      }
    }),
    // 3. Expiring Soon (within 7 days)
    prisma.member.count({
      where: {
        gymId,
        expiryDate: {
          gte: today,
          lte: next7Days
        }
      }
    }),
    // 4. Expired Members
    prisma.member.count({
      where: {
        gymId,
        status: "EXPIRED"
      }
    }),
    // 5. Monthly Revenue (sum of payments this calendar month)
    prisma.payment.aggregate({
      where: {
        gymId,
        paidAt: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        amount: true
      }
    }),
    // 6. Today's Attendance
    prisma.attendance.count({
      where: {
        gymId,
        date: {
          gte: today,
          lte: todayEnd
        }
      }
    }),
    // Action Required: expiryDate is within 3 days or in the past
    prisma.member.findMany({
      where: {
        gymId,
        expiryDate: {
          lte: next3Days
        }
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        membershipPlan: true,
        expiryDate: true,
        status: true,
        paymentStatus: true
      }
    })
  ])

  const monthlyRevenue = paymentsThisMonth._sum.amount || 0
  const gymName = gym?.name || "Test Gym"

  // Format and sort actionRequiredMembers: Expired first, then by nearest expiry
  const actionRequiredMembers = actionRequiredMembersRaw
    .map((member: any) => ({
      ...member,
      expiryDate: member.expiryDate.toISOString()
    }))
    .sort((a, b) => {
      if (a.status === "EXPIRED" && b.status !== "EXPIRED") return -1
      if (a.status !== "EXPIRED" && b.status === "EXPIRED") return 1
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    })

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      icon: Users,
      description: "Registered members",
      iconBgClass: "bg-slate-100",
      iconTextClass: "text-slate-500",
    },
    {
      title: "Active Members",
      value: activeMembers,
      icon: UserCheck,
      description: "Active subscriptions",
      iconBgClass: "bg-green-50",
      iconTextClass: "text-green-600",
    },
    {
      title: "Expiring Soon",
      value: expiringSoon,
      icon: AlertTriangle,
      description: "Expires in next 7 days",
      iconBgClass: "bg-amber-50",
      iconTextClass: "text-amber-500",
    },
    {
      title: "Expired Members",
      value: expiredMembers,
      icon: UserX,
      description: "Overdue renewals",
      iconBgClass: "bg-red-50",
      iconTextClass: "text-red-500",
    },
    {
      title: "Monthly Revenue",
      value: `₹${monthlyRevenue.toLocaleString("en-IN")}`,
      icon: CreditCard,
      description: "Earnings this month",
      iconBgClass: "bg-green-50",
      iconTextClass: "text-green-600",
    },
    {
      title: "Today's Attendance",
      value: attendanceToday,
      icon: CalendarCheck,
      description: "Check-ins today",
      iconBgClass: "bg-blue-50",
      iconTextClass: "text-blue-500",
    },
  ]

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  return (
    <div className="space-y-8">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            OVERVIEW
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Good morning, {gymName} 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {todayFormatted}
          </p>
        </div>
        <div className="flex items-center">
          <RefreshButton />
        </div>
      </div>

      {/* KPI Cards Responsive Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, idx) => (
          <KpiCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            iconBgClass={stat.iconBgClass}
            iconTextClass={stat.iconTextClass}
          />
        ))}
      </div>

      {/* Action Required Card Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h3 className="font-semibold text-slate-900">Action Required</h3>
            {actionRequiredMembers.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {actionRequiredMembers.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Members expired or expiring within 3 days
          </p>
        </div>
        
        <ActionRequiredList members={actionRequiredMembers} />
      </div>
    </div>
  )
}
