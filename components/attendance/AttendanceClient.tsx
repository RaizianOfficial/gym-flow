"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Download, Calendar, Dumbbell, QrCode } from "lucide-react"

interface AttendanceItem {
  id: string
  createdAt: string
  member: {
    fullName: string
    phone: string
  }
}

interface AttendanceClientProps {
  initialAttendance: AttendanceItem[]
  selectedDate: string
  qrCodeUrl: string
  signedUrl: string
}

export default function AttendanceClient({
  initialAttendance,
  selectedDate,
  qrCodeUrl,
  signedUrl,
}: AttendanceClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [date, setDate] = useState(selectedDate)

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", newDate)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleExportCSV = () => {
    if (initialAttendance.length === 0) return

    const headers = ["Member Name", "Phone", "Check-in Time"]
    const rows = initialAttendance.map((item) => [
      item.member.fullName,
      item.member.phone,
      new Date(item.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `attendance-${date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      {/* Date Filter & Export Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="h-5 w-5 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="block rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-800 text-sm shadow-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none transition-all"
          />
          <span className="text-sm text-slate-400">
            Total Check-ins: <strong className="text-slate-900 font-semibold">{initialAttendance.length}</strong>
          </span>
        </div>

        {initialAttendance.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors cursor-pointer select-none"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* QR Generation Area */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-none p-6 flex flex-col items-center justify-center text-center md:col-span-1">
          <div className="p-3 bg-[#22C55E]/10 rounded-xl text-[#22C55E] mb-4">
            <QrCode className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">Daily Check-in QR</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
            Display this on a screen at the reception desk. Members scan it to record their check-in.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
            <img src={qrCodeUrl} alt="Check-in QR Code" className="h-44 w-44 object-contain" />
          </div>

          <div className="mt-4 break-all max-w-[200px]">
            <p className="text-[10px] font-mono text-slate-400 select-all">{signedUrl}</p>
          </div>
        </div>

        {/* Checked-in List */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-none p-6 md:col-span-2">
          <h3 className="font-semibold text-slate-900 text-lg mb-6">Checked-in Members</h3>

          {initialAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
                <Dumbbell className="h-8 w-8" />
              </div>
              <h4 className="font-semibold text-slate-900">No check-ins yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                There are no attendance records logged for this date.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3 pr-4 font-semibold">Member</th>
                    <th className="pb-3 px-4 font-semibold">Phone</th>
                    <th className="pb-3 pl-4 text-right font-semibold">Check-in Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {initialAttendance.map((item) => {
                    const initial = item.member.fullName.charAt(0).toUpperCase()
                    const timeStr = new Date(item.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                        <td className="py-3 pr-4 flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#22C55E]/10 text-[#22C55E] font-semibold text-sm">
                            {initial}
                          </div>
                          <span className="font-semibold text-slate-900">{item.member.fullName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{item.member.phone}</td>
                        <td className="py-3 pl-4 text-right text-slate-500 font-medium">
                          {timeStr}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
