"use client"

import { useState, useEffect } from "react"
import Modal from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { renewMember } from "@/app/actions/gym"

interface RenewalModalProps {
  isOpen: boolean
  onClose: () => void
  member: {
    id: string
    fullName: string
    expiryDate: Date | string
  } | null
}

export default function RenewalModal({ isOpen, onClose, member }: RenewalModalProps) {
  const [duration, setDuration] = useState<number>(30)
  const [amount, setAmount] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [newExpiryPreview, setNewExpiryPreview] = useState<string>("")
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!member) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentExpiry = new Date(member.expiryDate)
    currentExpiry.setHours(0, 0, 0, 0)

    // Calculate base date to extend from
    const baseDate = currentExpiry >= today ? currentExpiry : today
    const previewDate = new Date(baseDate)
    previewDate.setDate(previewDate.getDate() + Number(duration))

    setNewExpiryPreview(
      previewDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [member, duration])

  // Set default price according to duration
  useEffect(() => {
    if (duration === 30) setAmount("1000")
    else if (duration === 90) setAmount("2700")
    else if (duration === 180) setAmount("5000")
    else if (duration === 365) setAmount("9000")
  }, [duration])

  if (!member) return null

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      const res = await renewMember({
        memberId: member.id,
        durationDays: duration,
        amount: Number(amount),
        note: note,
      })

      if (res?.error) {
        toast(res.error, "error")
      } else {
        toast("Membership renewed successfully!", "success")
        onClose()
      }
    } catch (err) {
      toast("An unexpected error occurred.", "error")
    } finally {
      setIsPending(false)
    }
  }

  const formattedCurrentExpiry = new Date(member.expiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renew Membership">
      <form onSubmit={handleRenew} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
            Member Name
          </label>
          <input
            type="text"
            readOnly
            value={member.fullName}
            className="mt-1 block w-full rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-2.5 text-primary text-sm font-medium focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
              Current Expiry
            </label>
            <p className="mt-1 text-sm font-semibold text-danger">{formattedCurrentExpiry}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
              New Expiry Preview
            </label>
            <p className="mt-1 text-sm font-semibold text-success">{newExpiryPreview}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          >
            <option value={30}>30 Days (Monthly)</option>
            <option value={90}>90 Days (Quarterly)</option>
            <option value={180}>180 Days (Half-Yearly)</option>
            <option value={365}>365 Days (Annual)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
            Payment Amount (₹)
          </label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            placeholder="1000"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary/60 uppercase tracking-wider">
            Notes (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            rows={2}
            placeholder="e.g. Cash payment received"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-secondary/5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-secondary/20 px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary/5 transition-all cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-success transition-all cursor-pointer disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? "Renewing..." : "Confirm Renewal"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
