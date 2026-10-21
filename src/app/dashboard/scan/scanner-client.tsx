"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { processAttendance } from "./actions"
import { useRouter } from "next/navigation"
import { GeoRadarMap, GeoLocationState } from "@/components/scan/geo-radar-map"
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ScanLine, 
  SunMedium, 
  ShieldCheck, 
  Lock,
  MapPinOff,
  FlaskConical
} from "lucide-react"

// Koordinat resmi kantor PT Aksa Tech (sama dengan DEFAULT_OFFICE_COORDINATES di geo-utils.ts)
const OFFICE_LAT = -7.877989458768671
const OFFICE_LNG = 110.31851240674597

const IS_DEV = process.env.NODE_ENV !== 'production'

export function ScannerClient({ redirectUrl = '/dashboard' }: { redirectUrl?: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [userLocation, setUserLocation] = useState<GeoLocationState | null>(null)
  const [simulateOffice, setSimulateOffice] = useState(false)
  const router = useRouter()

  // Jika mode simulasi aktif, anggap selalu berada di dalam kantor
  const canScan = simulateOffice || userLocation?.isInside === true

  const handleScan = async (detectedCodes: any[]) => {
    if (loading || detectedCodes.length === 0 || !canScan) return
    // Saat simulasi aktif, tidak perlu userLocation GPS asli
    if (!simulateOffice && !userLocation) return

    const qrValue = detectedCodes[0].rawValue
    if (!qrValue) return

    // Gunakan koordinat kantor saat mode simulasi, GPS asli jika tidak
    const lat = simulateOffice ? OFFICE_LAT : userLocation!.latitude
    const lng = simulateOffice ? OFFICE_LNG : userLocation!.longitude

    setLoading(true)
    try {
      const res = await processAttendance(qrValue, lat, lng)
      if (res.success) {
        console.log("✅ [SCAN SUCCESS] Berhasil memproses QR Code:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'success' })
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
      } else {
        console.log("❌ [SCAN FAILED] QR Code ditolak:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'error' })

        if (res.message.includes("Sesi telah habis")) {
          setTimeout(() => {
            window.location.href = "/login?reason=expired"
          }, 2000)
          return
        }

        setTimeout(() => {
          setLoading(false)
          setMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error("🚨 [SCAN ERROR] Terjadi kesalahan fatal saat menghubungi server:", error)
      setMessage({ text: "Terjadi kesalahan jaringan atau server saat memproses presensi.", type: 'error' })
      setTimeout(() => {
        setLoading(false)
        setMessage(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 1. Alert Notifikasi Hasil Scan (Jika Ada) */}
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
            <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* DEV ONLY: Banner Simulasi Berada di Kantor */}
      {IS_DEV && (
        <div className={`rounded-2xl border-2 transition-all duration-300 ${
          simulateOffice
            ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-200/50'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                simulateOffice ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <FlaskConical className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black tracking-widest uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200">
                    DEV ONLY
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                    Simulasi Berada di Kantor
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {simulateOffice
                    ? '⚠️ Aktif — koordinat kantor dikirim ke server sebagai pengganti GPS.'
                    : 'Toggle untuk bypass geofencing GPS (hanya tampil di lingkungan development).'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => setSimulateOffice(prev => !prev)}
              aria-label="Toggle simulasi kantor"
              className={`relative flex-shrink-0 w-12 h-6 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                simulateOffice
                  ? 'bg-amber-400 border-amber-400'
                  : 'bg-slate-200 border-slate-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                simulateOffice ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Strip peringatan saat aktif */}
          {simulateOffice && (
            <div className="px-4 pb-3 pt-0">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <p className="text-[11px] font-semibold text-amber-800 leading-tight">
                  Mode simulasi AKTIF. Scan akan tercatat menggunakan koordinat kantor PT Aksa Tech. Matikan sebelum production.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Layout Opsi A: 2 Kolom di Desktop (lg:), Kamera di Atas saat Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* KOLOM KIRI (Hero Utama): Pemindai Kamera QR Code (Di Mobile: Tampil Pertama di Atas) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header Baris Status Kamera */}
          <div className="flex items-center justify-between px-1">
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#1F77C5]" />
                <span>Pemindai Kamera QR Code</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {canScan 
                  ? "Kamera aktif. Arahkan lensa ke QR Code resmi kantor."
                  : "Kamera terkunci hingga lokasi Anda terverifikasi di area kantor."}
              </p>
            </div>

            <div>
              {canScan ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Kamera Siap
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Terkunci
                </span>
              )}
            </div>
          </div>

          {/* Frame Viewfinder Kamera */}
          <div className="relative w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border-2 border-blue-200/90 shadow-xl shadow-blue-500/10 bg-slate-950 group">
            
            {/* Sudut Viewfinder Beraksen Biru Aksa Tech */}
            <div className="absolute top-3.5 left-3.5 w-7 h-7 border-t-3 border-l-3 border-[#1F77C5] rounded-tl-xl pointer-events-none z-20"></div>
            <div className="absolute top-3.5 right-3.5 w-7 h-7 border-t-3 border-r-3 border-[#1F77C5] rounded-tr-xl pointer-events-none z-20"></div>
            <div className="absolute bottom-3.5 left-3.5 w-7 h-7 border-b-3 border-l-3 border-[#1F77C5] rounded-bl-xl pointer-events-none z-20"></div>
            <div className="absolute bottom-3.5 right-3.5 w-7 h-7 border-b-3 border-r-3 border-[#1F77C5] rounded-br-xl pointer-events-none z-20"></div>

            {/* Status Badge Live Kamera */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md text-white border flex items-center gap-1.5 shadow-xs ${
                canScan
                  ? simulateOffice
                    ? "bg-amber-500/80 border-amber-300/30"
                    : "bg-black/60 border-white/20"
                  : "bg-rose-950/70 border-rose-400/30 text-rose-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  canScan ? "bg-white animate-pulse" : "bg-rose-400"
                }`} />
                {canScan
                  ? simulateOffice ? "Mode Simulasi" : "Kamera Aktif"
                  : "Pemindai Ditangguhkan"}
              </span>
            </div>

            {/* Tampilan Kondisional Viewfinder */}
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[#1F77C5] animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white tracking-wide">
                    Memverifikasi QR {simulateOffice ? '(Simulasi Kantor)' : '& Lokasi GPS'}...
                  </p>
                  <p className="text-xs text-slate-400">
                    Menghubungkan ke server absensi Aksa Tech
                  </p>
                </div>
              </div>
            ) : !canScan ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 space-y-4 animate-fade-in text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
                  {!userLocation ? (
                    <Loader2 className="w-8 h-8 text-[#1F77C5] animate-spin" />
                  ) : (
                    <MapPinOff className="w-8 h-8 text-rose-400" />
                  )}
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-sm font-bold text-white tracking-wide">
                    {!userLocation
                      ? "Menunggu Deteksi Lokasi GPS..."
                      : "Di Luar Jangkauan Kantor"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {!userLocation
                      ? "Pastikan izin akses lokasi peramban telah diaktifkan."
                      : `Jarak Anda (${userLocation.distance.toLocaleString("id-ID")} m) melebihi batas radius 100 meter dari kantor PT Aksa Tech.`}
                  </p>
                </div>
                {userLocation && (
                  <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono font-semibold">
                    Maksimal Radius: 100 m
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full relative">
                {simulateOffice && (
                  <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
                    <div className="mx-3 mb-3 px-2.5 py-1.5 rounded-xl bg-amber-500/80 backdrop-blur-md border border-amber-300/30 text-center">
                      <p className="text-[10px] font-bold text-white tracking-wide uppercase">
                        🧪 Simulasi Kantor Aktif
                      </p>
                    </div>
                  </div>
                )}
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

          {/* Tiga Petunjuk Ringkas di Bawah Kamera */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1F77C5] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <ScanLine className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-slate-800">Posisikan Pas</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Tepat di area bidik kamera.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <SunMedium className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-slate-800">Cahaya Cukup</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Hindari pantulan silau.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-slate-800">Geofence GPS</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Radius toleransi 100m.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Peta Radar 3D Geofence & Status Lokasi (Di Mobile: Tampil di Bawah Kamera) */}
        <div className="lg:col-span-6 space-y-4">
          <GeoRadarMap onLocationChange={setUserLocation} />
        </div>

      </div>
    </div>
  )
}
