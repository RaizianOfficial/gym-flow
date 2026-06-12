"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { markAllNotificationsAsRead } from "@/app/actions/gym"
import { useToast } from "@/components/ui/toast"

interface NotificationItem {
  id: string
  type: string
  createdAt: string
  member: {
    fullName: string
  }
}

interface NotificationDropdownProps {
  initialNotifications: NotificationItem[]
}

export default function NotificationDropdown({ initialNotifications }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const { toast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  // Close when clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAsRead = async () => {
    try {
      const res = await markAllNotificationsAsRead()
      if (res?.error) {
        toast(res.error, "error")
      } else {
        setNotifications([])
        toast("Notifications cleared!", "success")
        setIsOpen(false)
      }
    } catch (err) {
      toast("Failed to clear notifications", "error")
    }
  }

  const getNotificationText = (item: NotificationItem) => {
    switch (item.type) {
      case "EXPIRY_5":
        return `5 days left on ${item.member.fullName}'s membership`
      case "EXPIRY_3":
        return `3 days left on ${item.member.fullName}'s membership`
      case "EXPIRY_1":
        return `1 day left on ${item.member.fullName}'s membership`
      case "EXPIRED":
        return `Membership expired: ${item.member.fullName}`
      default:
        return `Alert for ${item.member.fullName}`
    }
  }

  const unreadCount = notifications.length

  return (
    <div className="relative animate-fade-in" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-secondary hover:text-primary rounded-xl hover:bg-secondary/5 transition-colors relative cursor-pointer focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4.5 w-4.5 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-secondary/5 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/5 border-b border-secondary/5">
            <span className="font-bold text-sm text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-success transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-secondary/5">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-secondary/50">
                No new notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors text-left">
                  <p className="text-xs font-semibold text-primary">
                    {getNotificationText(item)}
                  </p>
                  <p className="text-[10px] text-secondary/60 mt-1">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
