import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import MembersClient from "./MembersClient"

interface PageProps {
  params: Promise<{ gymSlug: string }>
}

export default async function MembersPage({ params }: PageProps) {
  const { gymSlug } = await params
  const user = await getCurrentUser()

  if (!user || !user.gymId || !user.gymSlug) {
    redirect("/login")
  }
  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/dashboard`)
  }

  const gymId = user.gymId

  // Fetch all members under this gym tenant
  const membersRaw = await prisma.member.findMany({
    where: { gymId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      membershipPlan: true,
      startDate: true,
      expiryDate: true,
      paymentStatus: true,
      status: true,
      notes: true,
    }
  })

  // Format Dates to string for client boundary compatibility
  const members = membersRaw.map((member) => ({
    ...member,
    startDate: member.startDate.toISOString(),
    expiryDate: member.expiryDate.toISOString(),
  }))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          DIRECTORY
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Members Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage gym registrations, view membership statuses, and track renewals.
        </p>
      </div>

      <MembersClient members={members} />
    </div>
  )
}
