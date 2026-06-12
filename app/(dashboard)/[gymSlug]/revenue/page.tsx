import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import KpiCard from "@/components/dashboard/kpi-card"
import RevenueChart from "@/components/dashboard/RevenueChart"
import { CreditCard, TrendingUp, DollarSign } from "lucide-react"

interface PageProps {
  params: Promise<{ gymSlug: string }>
}

export default async function RevenuePage({ params }: PageProps) {
  const { gymSlug } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/dashboard`)
  }

  if (user.role !== "OWNER") {
    redirect(`/${gymSlug}/me`)
  }

  // Fetch all payments for this gym tenant
  const paymentsRaw = await prisma.payment.findMany({
    where: { gymId: user.gymId },
    include: {
      member: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      paidAt: "desc"
    }
  })

  // Format date fields for client boundary compatibility
  const payments = paymentsRaw.map((payment) => ({
    ...payment,
    paidAt: payment.paidAt.toISOString()
  }))

  const totalMembers = await prisma.member.count({ where: { gymId: user.gymId } })

  // Compute stats
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisMonthRevenue = payments
    .filter((p) => new Date(p.paidAt) >= firstDayOfMonth)
    .reduce((sum, p) => sum + p.amount, 0)

  const avgPerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0

  // Aggregate monthly earnings for the last 6 months
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" })
    
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const amount = payments
      .filter((p) => {
        const date = new Date(p.paidAt)
        return date >= start && date <= end
      })
      .reduce((sum, p) => sum + p.amount, 0)

    chartData.push({
      month: `${monthLabel} ${year.toString().slice(-2)}`,
      amount
    })
  }

  const stats = [
    {
      title: "This Month's Revenue",
      value: `₹${thisMonthRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      description: "Earnings in the current calendar month",
      iconBgClass: "bg-green-50",
      iconTextClass: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      description: "Lifetime business earnings",
      iconBgClass: "bg-green-50",
      iconTextClass: "text-green-600"
    },
    {
      title: "Avg per Member",
      value: `₹${Math.round(avgPerMember).toLocaleString("en-IN")}`,
      icon: CreditCard,
      description: "Average lifetime value per registered member",
      iconBgClass: "bg-slate-100",
      iconTextClass: "text-slate-500"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          BILLING
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Revenue & Billing</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track payments, view billing histories, and monitor subscription income.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-5 md:grid-cols-3">
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

      {/* Recharts Monthly Earnings Bar Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-none p-6">
        <h3 className="font-semibold text-slate-900 text-lg mb-6">Monthly Revenue (Last 6 Months)</h3>
        <RevenueChart data={chartData} />
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-none p-6">
        <h3 className="font-semibold text-slate-900 text-lg mb-6">Recent Payments</h3>
        
        {payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No payments logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Member Name</th>
                  <th className="pb-3 px-4 font-semibold">Plan</th>
                  <th className="pb-3 px-4 font-semibold">Amount</th>
                  <th className="pb-3 pl-4 text-right font-semibold">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {payments.map((payment) => (
                  <tr key={payment.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                    <td className="py-4 pr-4 font-semibold text-slate-900">{payment.member.fullName}</td>
                    <td className="py-4 px-4 text-slate-500 capitalize">{payment.plan.toLowerCase()}</td>
                    <td className="py-4 px-4 text-slate-900 font-bold">₹{payment.amount.toLocaleString("en-IN")}</td>
                    <td className="py-4 pl-4 text-right text-slate-500">
                      {new Date(payment.paidAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
