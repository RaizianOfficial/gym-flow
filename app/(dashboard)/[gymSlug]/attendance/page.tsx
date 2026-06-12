import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AttendanceClient from "@/components/attendance/AttendanceClient"
import { generateDailyToken } from "@/lib/utils"
import QRCode from "qrcode"

interface PageProps {
  params: Promise<{ gymSlug: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function AttendancePage({ params, searchParams }: PageProps) {
  const { gymSlug } = await params
  const { date } = await searchParams
  
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  if (user.gymSlug !== gymSlug) {
    redirect(`/${user.gymSlug}/dashboard`)
  }

  // Define active date (default is today)
  const todayStr = new Date().toISOString().split("T")[0]
  const selectedDateStr = date || todayStr

  // Setup date range boundaries for selected day
  const startOfDay = new Date(selectedDateStr)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDateStr)
  endOfDay.setHours(23, 59, 59, 999)

  // Query database check-ins
  const attendanceRaw = await prisma.attendance.findMany({
    where: {
      gymId: user.gymId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      member: {
        select: {
          fullName: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Format Date objects to ISO strings for client boundaries
  const attendance = attendanceRaw.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString()
  }))

  // Generate signed QR parameters
  const dailyToken = generateDailyToken(gymSlug, selectedDateStr)
  const signedUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/attend?gym=${gymSlug}&token=${dailyToken}`
  
  // Generate base64 QR Code image string
  let qrCodeUrl = ""
  try {
    qrCodeUrl = await QRCode.toDataURL(signedUrl, { margin: 1 })
  } catch (err) {
    console.error("QR Code generation error:", err)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          TRACKING
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Attendance Tracking</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Check members in, view real-time visits, and monitor gym traffic.
        </p>
      </div>

      <AttendanceClient
        initialAttendance={attendance}
        selectedDate={selectedDateStr}
        qrCodeUrl={qrCodeUrl}
        signedUrl={signedUrl}
      />
    </div>
  )
}
