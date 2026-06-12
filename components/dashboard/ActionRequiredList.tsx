"use client"

import { useState } from "react"
import Badge from "@/components/ui/badge"
import RenewalModal from "@/components/members/RenewalModal"
import { AlertTriangle, ChevronRight } from "lucide-react"

interface MemberRow {
  id: string
  fullName: string
  phone: string
  membershipPlan: string
  expiryDate: string
  status: string
  paymentStatus: string
}

interface ActionRequiredListProps {
  members: MemberRow[]
}

export default function ActionRequiredList({ members }: ActionRequiredListProps) {
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null)
  const [isRenewOpen, setIsRenewOpen] = useState(false)

  const handleOpenRenew = (member: MemberRow) => {
    setSelectedMember(member)
    setIsRenewOpen(true)
  }

  const handleCloseRenew = () => {
    setSelectedMember(null)
    setIsRenewOpen(false)
  }

  // Helper to format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper to get status badge type
  const getBadgeVariant = (member: MemberRow) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(member.expiryDate)
    expiry.setHours(0, 0, 0, 0)

    if (expiry < today) {
      return "EXPIRED"
    } else {
      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays <= 1) {
        // We'll return expiring soon since the Badge maps ACTIVE, EXPIRING_SOON, EXPIRED
        return "EXPIRING_SOON"
      }
      return "EXPIRING_SOON"
    }
  }

  const getStatusLabel = (member: MemberRow) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(member.expiryDate)
    expiry.setHours(0, 0, 0, 0)

    if (expiry < today) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 select-none">
          Expired
        </span>
      )
    }
    
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 select-none">
          Expires Today
        </span>
      )
    } else if (diffDays === 1) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 select-none">
          Expires Tomorrow
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 select-none">
          Expiring Soon
        </span>
      )
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h4 className="font-semibold text-slate-900">All memberships are up to date</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          No members are currently expired or expiring in the next 3 days.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
            <th className="pb-3 pr-4 font-semibold">Member Name</th>
            <th className="pb-3 px-4 hidden sm:table-cell font-semibold">Phone</th>
            <th className="pb-3 px-4 hidden md:table-cell font-semibold">Plan</th>
            <th className="pb-3 px-4 font-semibold">Expiry Date</th>
            <th className="pb-3 px-4 font-semibold">Status</th>
            <th className="pb-3 pl-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-transparent">
          {members.map((member) => (
            <tr key={member.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
              <td className="py-4 pr-4 font-semibold text-slate-900">{member.fullName}</td>
              <td className="py-4 px-4 text-slate-500 hidden sm:table-cell">{member.phone}</td>
              <td className="py-4 px-4 text-slate-500 hidden md:table-cell capitalize">
                {member.membershipPlan.toLowerCase()}
              </td>
              <td className="py-4 px-4 text-slate-500">{formatDate(member.expiryDate)}</td>
              <td className="py-4 px-4">{getStatusLabel(member)}</td>
              <td className="py-4 pl-4 text-right">
                <button
                  onClick={() => handleOpenRenew(member)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A] px-4 py-1.5 rounded-lg transition-colors cursor-pointer select-none"
                >
                  Renew
                  <ChevronRight className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedMember && (
        <RenewalModal
          isOpen={isRenewOpen}
          onClose={handleCloseRenew}
          member={{
            id: selectedMember.id,
            fullName: selectedMember.fullName,
            expiryDate: selectedMember.expiryDate,
          }}
        />
      )}
    </div>
  )
}
