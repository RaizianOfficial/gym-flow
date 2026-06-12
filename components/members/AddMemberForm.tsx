"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/toast"
import { addMember } from "@/app/actions/gym"

interface AddMemberFormProps {
  onSuccess: () => void
}

export default function AddMemberForm({ onSuccess }: AddMemberFormProps) {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [planDays, setPlanDays] = useState<number>(30)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID")
  const [notes, setNotes] = useState("")
  const [expiryPreview, setExpiryPreview] = useState("")
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!startDate) return
    const start = new Date(startDate)
    const expiry = new Date(start)
    expiry.setDate(expiry.getDate() + Number(planDays))
    setExpiryPreview(
      expiry.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [startDate, planDays])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      const res = await addMember({
        fullName,
        phone,
        email,
        planDays,
        startDate,
        paymentStatus,
        notes,
      })

      if (res?.error) {
        toast(res.error, "error")
      } else {
        toast("Member added successfully!", "success")
        setFullName("")
        setPhone("")
        setEmail("")
        setNotes("")
        onSuccess()
      }
    } catch (err) {
      toast("An unexpected error occurred.", "error")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Full Name
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2.5 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          placeholder="John Doe"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Phone Number
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2.5 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          placeholder="9876543210"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Email Address (Optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2.5 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          placeholder="member@email.com"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Membership Plan
        </label>
        <select
          value={planDays}
          onChange={(e) => setPlanDays(Number(e.target.value))}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          disabled={isPending}
        >
          <option value={30}>30 Days (Monthly)</option>
          <option value={90}>90 Days (Quarterly)</option>
          <option value={180}>180 Days (Half-Yearly)</option>
          <option value={365}>365 Days (Annual)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Start Date
        </label>
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Payment Status
        </label>
        <div className="mt-2 flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="text-accent focus:ring-accent"
              name="paymentStatus"
              value="PAID"
              checked={paymentStatus === "PAID"}
              onChange={() => setPaymentStatus("PAID")}
              disabled={isPending}
            />
            <span className="ml-2 text-sm text-primary">Paid</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="text-accent focus:ring-accent"
              name="paymentStatus"
              value="PENDING"
              checked={paymentStatus === "PENDING"}
              onChange={() => setPaymentStatus("PENDING")}
              disabled={isPending}
            />
            <span className="ml-2 text-sm text-primary">Pending</span>
          </label>
        </div>
      </div>

      <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/5">
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Calculated Expiry Date
        </label>
        <p className="mt-1 text-sm font-semibold text-accent">{expiryPreview}</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          rows={3}
          placeholder="Membership notes..."
          disabled={isPending}
        />
      </div>

      <div className="pt-4 flex gap-3 border-t border-secondary/5">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-success transition-all disabled:opacity-50 cursor-pointer text-center"
        >
          {isPending ? "Adding Member..." : "Add Member"}
        </button>
      </div>
    </form>
  )
}
