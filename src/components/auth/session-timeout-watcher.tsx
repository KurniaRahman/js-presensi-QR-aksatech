"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { signOut } from "next-auth/react"
import { Clock, X, LogOut, ShieldAlert } from "lucide-react"

interface SessionTimeoutWatcherProps {
  loginAt?: number
}

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000 // 2 Jam dalam milidetik
const WARNING_THRESHOLD_MS = 5 * 60 * 1000  // Peringatan toast 5 menit sebelum habis
const DEFAULT_COUNTDOWN_SECONDS = 5         // Jeda hitung mundur modal habis sesi

export function SessionTimeoutWatcher({ loginAt }: SessionTimeoutWatcherProps) {
  const [warningRemainingMinutes, setWarningRemainingMinutes] = useState<number | null>(null)
  const [isWarningDismissed, setIsWarningDismissed] = useState(false)
  
  // State untuk popup modal sesi telah habis
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN_SECONDS)
  const isRedirectingRef = useRef(false)

  // Fungsi keluar paksa (Force Exit) seketika tanpa perlu refresh manual
  const handleForceExit = useCallback(() => {
    if (isRedirectingRef.current) return
    isRedirectingRef.current = true

    // Logout NextAuth di background lalu hard redirect ke login dengan notifikasi expired
    try {
      signOut({ redirect: false })
    } catch (err) {
      console.error("Gagal menjalankan signOut:", err)
    }

    window.location.href = "/login?reason=expired"
  }, [])

  // Timer hitung mundur saat popup modal sesi habis terbuka
  useEffect(() => {
    if (!isExpired) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleForceExit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExpired, handleForceExit])

  // Pengecekan waktu kedaluwarsa sesi
  useEffect(() => {
    if (!loginAt) return

    const expiresAtMs = loginAt * 1000 + TWO_HOURS_IN_MS

    const checkExpiration = () => {
      const now = Date.now()
      const remainingMs = expiresAtMs - now

      if (remainingMs <= 0) {
        // Sesi telah habis (2 jam), buka popup modal hitung mundur
        setIsExpired(true)
        setWarningRemainingMinutes(null)
        return
      }

      // Tampilkan peringatan toast jika sisa waktu <= 5 menit
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

  return (
    <>
      {/* 1. Modal Dialog Popup: Sesi Telah Habis (dengan jeda countdown & tombol X force exit) */}
      {isExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden text-center animate-in zoom-in-95 duration-200">
            
            {/* Aksen Top Stripe Gradient Brand Aksa Tech */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#1F77C5] to-blue-600"></div>

            {/* Tombol Silang (X) untuk Force Exit Seketika */}
            <button 
              type="button"
              onClick={handleForceExit}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              title="Keluar Sekarang (Force Exit)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ikon Jam / Shield Peringatan */}
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-md shadow-amber-500/10 mb-4 mt-2">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            {/* Judul & Deskripsi */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Sesi Login Telah Habis
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed px-2">
                Demi keamanan akun Anda, sesi login dibatasi maksimal 2 jam. Sistem akan otomatis mengalihkan Anda ke halaman login tanpa perlu me-refresh browser.
              </p>
            </div>

            {/* Kotak Hitung Mundur Jeda Waktu */}
            <div className="mt-5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Otomatis dialihkan dalam:</span>
              </span>
              <span className="font-mono font-black text-amber-700 text-sm bg-white px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs">
                {countdown} detik
              </span>
            </div>

            {/* Tombol Force Exit / Keluar Sekarang */}
            <button
              type="button"
              onClick={handleForceExit}
              className="w-full mt-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#1F77C5] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sekarang (Force Exit)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Toast Notifikasi Pra-Kedaluwarsa (5 Menit Sebelumnya) */}
      {!isExpired && warningRemainingMinutes && !isWarningDismissed && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-amber-500 text-white p-4 rounded-2xl shadow-xl border border-amber-600 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-100" />
          <div className="flex-1 text-xs space-y-1 text-left">
            <p className="font-bold text-white text-sm">Pemberitahuan Sesi Keamanan</p>
            <p className="text-amber-100 leading-relaxed">
              Sesi Anda akan berakhir dalam <strong className="text-white underline">{warningRemainingMinutes} menit</strong> (batas 2 jam). Pastikan pekerjaan Anda telah disimpan.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsWarningDismissed(true)} 
            className="text-amber-200 hover:text-white transition-colors p-1"
            title="Tutup Peringatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
