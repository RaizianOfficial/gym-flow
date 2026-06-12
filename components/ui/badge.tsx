import { cn } from "@/lib/utils"

interface BadgeProps {
  variant: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "PAID" | "PENDING" | "OVERDUE"
  className?: string
}

export default function Badge({ variant, className }: BadgeProps) {
  const styles = {
    ACTIVE: "bg-green-100 text-green-700 border-transparent",
    EXPIRING_SOON: "bg-amber-100 text-amber-700 border-transparent",
    EXPIRED: "bg-red-100 text-red-700 border-transparent",
    PAID: "bg-green-100 text-green-700 border-transparent",
    PENDING: "bg-amber-100 text-amber-700 border-transparent",
    OVERDUE: "bg-red-100 text-red-700 border-transparent",
  }

  const label = {
    ACTIVE: "Active",
    EXPIRING_SOON: "Expiring Soon",
    EXPIRED: "Expired",
    PAID: "Paid",
    PENDING: "Pending",
    OVERDUE: "Overdue",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold select-none transition-colors",
        styles[variant],
        className
      )}
    >
      {label[variant]}
    </span>
  )
}
