"use client"

import React, { useEffect } from "react"
import { X } from "lucide-react"

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with fade-in and backdrop-blur */}
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Slide-over panel with translation slide-in */}
        <div className="pointer-events-auto w-screen max-w-md transform bg-card shadow-2xl border-l border-secondary/5 flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-secondary/5">
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-secondary/50 hover:text-primary hover:bg-secondary/5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
