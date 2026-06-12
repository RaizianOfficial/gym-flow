import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  iconBgClass?: string
  iconTextClass?: string
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  iconBgClass = "bg-slate-50",
  iconTextClass = "text-slate-600",
}: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
          <h4 className="text-3xl font-bold text-slate-900 mt-3">{value}</h4>
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0", iconBgClass, iconTextClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="text-slate-400">{description}</span>
        </div>
      )}
    </div>
  )
}
