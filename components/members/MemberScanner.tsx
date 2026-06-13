"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { checkInMember } from "@/app/actions/gym"
import Modal from "@/components/ui/modal"
import { QrCode, AlertTriangle, CheckCircle2, Loader2, Camera } from "lucide-react"

interface MemberScannerProps {
  gymSlug: string
  onSuccess?: () => void // Optional callback
}

export default function MemberScanner({ gymSlug, onSuccess }: MemberScannerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  
  const qrCodeRegionId = "html5qr-code-member-region"

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccessMsg(null)
      return
    }

    let html5Qrcode: any;

    // Dynamically import to prevent SSR document/navigator undefined errors
    import("html5-qrcode").then((module) => {
      html5Qrcode = new module.Html5Qrcode(qrCodeRegionId)
      scannerRef.current = html5Qrcode

      html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          handleScanSuccess(decodedText)
        },
        () => {
          // Ignore verbose scanning frame errors
        }
      ).catch((err: any) => {
        console.error("Camera access failed:", err)
        setError("Failed to access camera. Please allow camera permissions and try again.")
      })
    })

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch((err: any) => console.error("Error stopping scanner:", err))
      }
    }
  }, [isOpen])

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Owner QR format: https://domain/attend?gym=[gymSlug]&token=[daily-token]
      const url = new URL(decodedText)
      const scannedGym = url.searchParams.get("gym")
      const token = url.searchParams.get("token")

      if (!scannedGym || !token) {
        setError("Invalid QR code format. Please scan the official GymFlow attendance QR code.")
        return
      }

      if (scannedGym !== gymSlug) {
        setError("This QR code belongs to a different gym. Please scan the QR code for your gym.")
        return
      }

      // Stop camera before processing to prevent double scans
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
      }

      setIsLoading(true)
      setError(null)
      
      const res = await checkInMember(scannedGym, token)
      setIsLoading(false)

      if (res.error) {
        setError(res.error)
      } else {
        setSuccessMsg(
          res.alreadyCheckedIn 
            ? `Already Checked In! You have already logged your check-in for today at ${res.gymName}.`
            : `Success! Your daily attendance at ${res.gymName} has been recorded.`
        )
        router.refresh()
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      setError("Failed to read QR Code URL. Make sure it is a valid check-in link.")
    }
  }

  const handleClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (err) {
        console.error("Error stopping camera on close:", err)
      }
    }
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-6 flex w-full justify-center items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-success transition-all cursor-pointer select-none"
      >
        <Camera className="h-4 w-4" />
        Scan Gym QR Code
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Scan Attendance QR">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {!error && !successMsg && !isLoading && (
            <>
              <p className="text-xs text-secondary/70">
                Point your camera at the gym's reception check-in QR code.
              </p>
              <div 
                id={qrCodeRegionId} 
                className="w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-secondary/15 bg-slate-50 relative shadow-inner"
              />
            </>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-[#22C55E] animate-spin" />
              <p className="text-xs text-secondary/60">Processing your check-in...</p>
            </div>
          )}

          {error && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-primary text-sm">Check-in Failed</h4>
              <p className="text-xs text-secondary/60 max-w-xs leading-relaxed">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setIsOpen(false)
                  setTimeout(() => setIsOpen(true), 100) // Restart camera
                }}
                className="rounded-lg bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-secondary transition-colors cursor-pointer select-none"
              >
                Try Scanning Again
              </button>
            </div>
          )}

          {successMsg && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-bold text-primary text-sm">Attendance Logged</h4>
              <p className="text-xs text-secondary/60 max-w-xs leading-relaxed">{successMsg}</p>
              <button
                onClick={handleClose}
                className="rounded-lg bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-secondary transition-colors cursor-pointer select-none"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
