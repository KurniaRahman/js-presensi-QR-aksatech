"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { AlertCircle, Clock, X } from "lucide-react"

interface SessionTimeoutWatcherProps {
  loginAt?: number
}

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000 // 2 Jam dalam milidetik
const WARNING_THRESHOLD_MS = 5 * 60 * 1000  // Peringatan 5 menit sebelum habis

export function SessionTimeoutWatcher({ loginAt }: SessionTimeoutWatcherProps) {
  const [warningRemainingMinutes, setWarningRemainingMinutes] = useState<number | null>(null)
  const [isWarningDismissed, setIsWarningDismissed] = useState(false)

  useEffect(() => {
    if (!loginAt) return

    const expiresAtMs = loginAt * 1000 + TWO_HOURS_IN_MS

    const checkExpiration = () => {
      const now = Date.now()
      const remainingMs = expiresAtMs - now

      if (remainingMs <= 0) {
        // Sesi telah habis (2 jam), logout otomatis dan arahkan ke login
        signOut({ callbackUrl: "/login?reason=expired" })
        return
      }

      // Tampilkan peringatan jika sisa waktu <= 5 menit
      if (remainingMs <= WARNING_THRESHOLD_MS) {
        setWarningRemainingMinutes(Math.ceil(remainingMs / 60000))
      } else {
        setWarningRemainingMinutes(null)
      }
    }

    // Jalankan pengecekan pertama kali
    checkExpiration()

    // Interval pengecekan setiap 10 detik
    const interval = setInterval(checkExpiration, 10000)

    // Cek ketika user kembali ke tab (visibilitychange / window focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkExpiration()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", checkExpiration)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", checkExpiration)
    }
  }, [loginAt])

  if (!warningRemainingMinutes || isWarningDismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-amber-500 text-white p-4 rounded-xl shadow-lg border border-amber-600 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-100" />
      <div className="flex-1 text-xs space-y-1">
        <p className="font-bold text-white text-sm">Pemberitahuan Sesi Keamanan</p>
        <p className="text-amber-100 leading-relaxed">
          Sesi Anda akan berakhir dalam <strong className="text-white underline">{warningRemainingMinutes} menit</strong> (batas 2 jam). Pastikan pekerjaan Anda telah disimpan.
        </p>
      </div>
      <button 
        onClick={() => setIsWarningDismissed(true)} 
        className="text-amber-200 hover:text-white transition-colors"
        title="Tutup Peringatan"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
