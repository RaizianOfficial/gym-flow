"use client"

import { useState } from "react"
import Badge from "@/components/ui/badge"
import SlideOver from "@/components/ui/slide-over"
import AddMemberForm from "@/components/members/AddMemberForm"
import RenewalModal from "@/components/members/RenewalModal"
import { Search, UserPlus } from "lucide-react"

interface Member {
  id: string
  fullName: string
  phone: string
  membershipPlan: string
  startDate: string
  expiryDate: string
  paymentStatus: any
  status: any
  notes: string | null
}

interface MembersClientProps {
  members: Member[]
}

export default function MembersClient({ members }: MembersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRING" | "EXPIRED">("ALL")
  
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Filtering Logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
      
    if (!matchesSearch) return false

    if (statusFilter === "ALL") return true
    if (statusFilter === "ACTIVE") return member.status === "ACTIVE"
    if (statusFilter === "EXPIRING") return member.status === "EXPIRING_SOON"
    if (statusFilter === "EXPIRED") return member.status === "EXPIRED"
    
    return true
  })

  const handleOpenRenew = (member: Member) => {
    setSelectedMember(member)
    setIsRenewModalOpen(true)
  }

  const handleCloseRenew = () => {
    setSelectedMember(null)
    setIsRenewModalOpen(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-slate-800 text-sm shadow-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 select-none">
          {(["ALL", "ACTIVE", "EXPIRING", "EXPIRED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold select-none transition-all cursor-pointer ${
                statusFilter === filter
                  ? "bg-[#22C55E] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {filter === "ALL"
                ? "All"
                : filter === "ACTIVE"
                ? "Active"
                : filter === "EXPIRING"
                ? "Expiring"
                : "Expired"}
            </button>
          ))}
          
          <button
            onClick={() => setIsSlideOverOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer select-none"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Members Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">No members found matching the filters.</p>
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-55 bg-slate-50 text-slate-400 font-semibold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Phone</th>
                  <th className="py-4 px-6 font-semibold">Plan</th>
                  <th className="py-4 px-6 hidden md:table-cell font-semibold">Start Date</th>
                  <th className="py-4 px-6 font-semibold">Expiry Date</th>
                  <th className="py-4 px-6 hidden sm:table-cell font-semibold">Payment</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                    <td className="py-4 px-6 font-semibold text-slate-900">{member.fullName}</td>
                    <td className="py-4 px-6 text-slate-500">{member.phone}</td>
                    <td className="py-4 px-6 text-slate-500 capitalize">
                      {member.membershipPlan.toLowerCase()}
                    </td>
                    <td className="py-4 px-6 text-slate-500 hidden md:table-cell">
                      {formatDate(member.startDate)}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDate(member.expiryDate)}
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <Badge variant={member.paymentStatus} />
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={member.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenRenew(member)}
                        className="rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 transition-all text-slate-600 cursor-pointer select-none"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Member Slideover Drawer */}
      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Add New Member"
      >
        <AddMemberForm onSuccess={() => setIsSlideOverOpen(false)} />
      </SlideOver>

      {/* Renewal Confirmation Modal */}
      {selectedMember && (
        <RenewalModal
          isOpen={isRenewModalOpen}
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
