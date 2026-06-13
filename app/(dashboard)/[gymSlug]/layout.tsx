import { signOut, getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Dumbbell, LogOut } from "lucide-react"
import NotificationDropdown from "@/components/dashboard/NotificationDropdown"
import SidebarNav from "@/components/dashboard/SidebarNav"
import HeaderTitle from "@/components/dashboard/HeaderTitle"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ gymSlug: string }>
}

export default async function DashboardLayout({ children, params }: LayoutProps) {
  const { gymSlug } = await params
  const user = await getCurrentUser()

  if (!user || !user.gymId || !user.gymSlug) {
    redirect("/login")
  }

  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/dashboard`)
  }

  // Fetch the current gym from database
  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId }
  })

  if (!gym) {
    redirect("/login")
  }

  // Fetch notifications
  const notificationsRaw = await prisma.notification.findMany({
    where: {
      gymId: user.gymId,
      seen: false,
      ...(user.role === "MEMBER" ? { memberId: user.id } : {})
    },
    include: {
      member: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  })

  const notifications = notificationsRaw.map((n: any) => ({
    ...n,
    createdAt: n.createdAt.toISOString()
  }))

  // Get initial for user avatar
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 border-r border-slate-800 bg-[#0F1117] text-white z-20">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo / Branding */}
          <div className="flex items-center h-16 px-6 gap-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2 select-none">
              <div className="w-6 h-6 bg-[#22C55E] rounded flex items-center justify-center">
                <Dumbbell className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-white tracking-tight">GymFlow</span>
            </div>
            {gym.plan === "PRO" && (
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22C55E]/20 text-[#22C55E]">
                PRO
              </span>
            )}
          </div>

          {/* Dynamic Gym Name Banner */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
              {gym.name}
            </p>
          </div>
          
          {/* Navigation Links (Path-Aware Client component) */}
          <SidebarNav gymSlug={gymSlug} role={user.role} />
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800/60">
            <div className="flex items-center gap-3 mb-4 px-2 select-none">
              <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-bold text-sm shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.email.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <button
                type="submit"
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors gap-3 cursor-pointer select-none"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 md:pl-[240px]">
        {/* Header/Navbar */}
        <header className="flex items-center justify-between h-16 px-8 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <HeaderTitle />
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationDropdown initialNotifications={notifications} />

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-semibold text-xs select-none">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 truncate max-w-[120px] select-none">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-medium capitalize select-none">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  )
}
