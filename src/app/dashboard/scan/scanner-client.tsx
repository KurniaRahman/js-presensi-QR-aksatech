"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { processAttendance } from "./actions"
import { useRouter } from "next/navigation"
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Sparkles, 
  ScanLine, 
  SunMedium, 
  ShieldCheck 
} from "lucide-react"

export function ScannerClient({ redirectUrl = '/dashboard' }: { redirectUrl?: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const handleScan = async (detectedCodes: any[]) => {
    if (loading || detectedCodes.length === 0) return
    const qrValue = detectedCodes[0].rawValue

    if (!qrValue) return

    setLoading(true)
    try {
      const res = await processAttendance(qrValue)
      if (res.success) {
        console.log("✅ [SCAN SUCCESS] Berhasil memproses QR Code:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'success' })
        // Kembali ke dashboard setelah scan sukses
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
      } else {
        console.log("❌ [SCAN FAILED] QR Code ditolak:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'error' })
        // Beri jeda 3 detik sebelum boleh scan lagi jika gagal
        setTimeout(() => {
          setLoading(false)
          setMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error("🚨 [SCAN ERROR] Terjadi kesalahan fatal saat menghubungi server:", error)
      setMessage({ text: "Terjadi kesalahan jaringan atau server.", type: 'error' })
      setTimeout(() => {
        setLoading(false)
        setMessage(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Status Scan */}
      {message && (
        <div 
          className={`p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 border transition-all animate-fade-in shadow-xs ${
            message.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
            message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
              {message.type === 'success' ? 'Presensi Berhasil Diverifikasi' : 'Presensi Gagal Diproses'}
            </h4>
            <p className="text-xs sm:text-sm mt-0.5 opacity-90">
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Frame Viewfinder Kamera Modern */}
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-square rounded-3xl overflow-hidden border-2 border-blue-200/90 shadow-xl shadow-blue-500/10 bg-slate-950 group">
        
        {/* Sudut Viewfinder Beraksen Biru Aksa Tech */}
        <div className="absolute top-3.5 left-3.5 w-7 h-7 border-t-3 border-l-3 border-[#1F77C5] rounded-tl-xl pointer-events-none z-20"></div>
        <div className="absolute top-3.5 right-3.5 w-7 h-7 border-t-3 border-r-3 border-[#1F77C5] rounded-tr-xl pointer-events-none z-20"></div>
        <div className="absolute bottom-3.5 left-3.5 w-7 h-7 border-b-3 border-l-3 border-[#1F77C5] rounded-bl-xl pointer-events-none z-20"></div>
        <div className="absolute bottom-3.5 right-3.5 w-7 h-7 border-b-3 border-r-3 border-[#1F77C5] rounded-br-xl pointer-events-none z-20"></div>

        {/* Status Badge Live Kamera */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Kamera Aktif
          </span>
        </div>

        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#1F77C5] animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white tracking-wide">
                Memverifikasi QR Code...
              </p>
              <p className="text-xs text-slate-400">
                Menghubungkan ke server absensi Aksa Tech
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            <Scanner
              onScan={handleScan}
              formats={["qr_code"]}
              components={{
                zoom: false,
                finder: true,
              }}
              styles={{
                container: { width: '100%', height: '100%' }
              }}
            />
          </div>
        )}
      </div>

      {/* 3 Petunjuk Cepat Pemindaian */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1F77C5] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800">Posisikan QR</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Posisikan kode pas di dalam area bidik kamera.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <SunMedium className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800">Cahaya Cukup</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Hindari pantulan cahaya silau atau bayangan gelap.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800">Verifikasi Aman</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Jam kerja tercatat otomatis sesuai waktu server WIB.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
