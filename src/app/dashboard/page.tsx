import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { DigitalClock } from "./components/digital-clock"
import Link from "next/link"
import { 
  ScanLine, 
  LogIn, 
  LogOut, 
  CalendarCheck, 
  Briefcase, 
  Clock, 
  Coffee, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  FileText,
  CalendarDays,
  Compass
} from "lucide-react"
import { syncAlphaAttendance } from "@/lib/sync-alpha"
import { calculateEffectiveOvertime, formatTimeWIB, getDateStringWIB } from "@/lib/attendance-utils"

export const metadata = {
  title: "Dashboard Karyawan",
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const now = new Date()

  // Dapatkan sapaan dinamis berdasarkan jam saat ini (WIB / Asia/Jakarta)
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(now),
    10
  )
  const greeting = 
    currentHour >= 4 && currentHour < 11 ? "Selamat Pagi" :
    currentHour >= 11 && currentHour < 15 ? "Selamat Siang" :
    currentHour >= 15 && currentHour < 18 ? "Selamat Sore" :
    "Selamat Malam"

  // Rentang hari ini berdasarkan zona waktu Indonesia (WIB / Asia/Jakarta)
  const todayStr = getDateStringWIB(now)
  const todayStart = new Date(`${todayStr}T00:00:00.000Z`)
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`)

  // Rentang bulan berjalan (1 s/d akhir bulan) dalam WIB
  const [currentYearStr, currentMonthStr] = todayStr.split('-')
  const currentYear = parseInt(currentYearStr, 10)
  const currentMonth = parseInt(currentMonthStr, 10)
  const firstDayOfMonth = new Date(`${currentYearStr}-${currentMonthStr}-01T00:00:00.000Z`)
  const lastDateNum = new Date(currentYear, currentMonth, 0).getDate()
  const lastDayOfMonth = new Date(`${currentYearStr}-${currentMonthStr}-${String(lastDateNum).padStart(2, '0')}T23:59:59.999Z`)

  // Ambil presensi hari ini, metrik bulan berjalan, dan sinkronisasi ALPHA secara paralel
  const [todayAttendance, monthAttendances, monthOvertimes, recentAttendances] = await Promise.all([
    db.attendance.findFirst({
      where: {
        user_id: session.user.id,
        record_date: {
          gte: todayStart,
          lte: todayEnd,
        }
      }
    }),
    db.attendance.findMany({
      where: {
        user_id: session.user.id,
        record_date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        }
      }
    }),
    db.overtime.findMany({
      where: {
        user_id: session.user.id,
        request_date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        status: 'APPROVED'
      }
    }),
    db.attendance.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        record_date: 'desc'
      },
      take: 5
    }),
    syncAlphaAttendance()
  ]).then(([att, mAtt, mOt, rAtt]) => [att, mAtt, mOt, rAtt] as const)

  // Hitung metrik bulan berjalan
  const hadirCount = monthAttendances.filter(a => a.status === 'HADIR').length
  const totalWorkMinutes = monthAttendances
    .filter(a => a.status === 'HADIR' && a.duration_minutes)
    .reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
  const totalWorkHours = Math.floor(totalWorkMinutes / 60)
  const remainingWorkMins = totalWorkMinutes % 60

  let totalLemburWeekday = 0
  let totalLemburWeekend = 0

  monthOvertimes.forEach(ot => {
    const otDateStr = ot.request_date.toISOString().split('T')[0]
    const matchingAtt = monthAttendances.find(a => {
      const aDateStr = a.record_date.toISOString().split('T')[0]
      return aDateStr === otDateStr
    })

    const eff = calculateEffectiveOvertime(
      otDateStr,
      matchingAtt?.clock_in,
      matchingAtt?.clock_out,
      ot.duration_hours
    )
    totalLemburWeekday += eff.weekdayHours
    totalLemburWeekend += eff.weekendHours
  })

  // Format nama bulan (WIB)
  const monthName = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', month: 'long', year: 'numeric' })

  // Status presensi hari ini
  const isAlphaToday = todayAttendance?.status === 'ALPHA'
  const isSakitToday = todayAttendance?.status === 'SAKIT'
  const isIzinToday = todayAttendance?.status === 'IZIN'
  const hasClockIn = !!(todayAttendance?.clock_in && todayAttendance.status === 'HADIR')
  const hasClockOut = !!(todayAttendance?.clock_out && todayAttendance.status === 'HADIR')

  // Hitung durasi kerja hari ini jika sudah clock-in
  let todayWorkDurationText = ""
  if (hasClockIn) {
    if (hasClockOut && todayAttendance?.duration_minutes) {
      const h = Math.floor(todayAttendance.duration_minutes / 60)
      const m = todayAttendance.duration_minutes % 60
      todayWorkDurationText = `${h} Jam ${m} Menit`
    } else if (todayAttendance?.clock_in) {
      const diffMs = now.getTime() - todayAttendance.clock_in.getTime()
      const diffM = Math.max(0, Math.floor(diffMs / 60000))
      const h = Math.floor(diffM / 60)
      const m = diffM % 60
      todayWorkDurationText = `${h} Jam ${m} Menit (Berjalan)`
    }
  }

  const userRoleName = 
    session.user.role === 'PM' ? 'Project Manager' : 
    session.user.role === 'ADMIN' ? 'Administrator' : 
    session.user.role === 'MAGANG' ? 'Magang' : 
    'Engineer'

  return (
    <div className="relative min-h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Ornamen Ambient Background & Aerospace Radar Rings (Tetap dominan putih namun beraksen teknologi Aksa Tech) */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#1F77C5]/12 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-96 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-sky-400/8 via-[#1F77C5]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Delicate Aerospace Orbital Radar Rings */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full border border-blue-200/35 pointer-events-none -z-10"></div>
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full border border-blue-100/25 pointer-events-none -z-10"></div>

      {/* Subtle Aerospace Tech Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F77C515_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 opacity-70"></div>

      {/* 1. Header Sambutan & Live Clock */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xs border border-blue-100/90 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Aksen Top Stripe Gradient Brand Aksa Tech */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

        {/* Ornamen Grafis Lingkaran Halus */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-gradient-to-br from-blue-100/40 to-sky-50/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#1F77C5] text-white shadow-xs shadow-blue-500/20 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              {userRoleName}
            </span>
            <span className="text-xs text-blue-300 font-bold hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-[#1F77C5] bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100">
              Sistem Presensi Aksa Tech
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-600 bg-clip-text text-transparent">{session.user.name}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-normal leading-relaxed">
            Portal kehadiran & operasional kerja digital Aksa Tech. Pantau jam kerja harian dan lembur Anda.
          </p>
        </div>

        {/* Live Clock Widget beraksen Kaca & Biru */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs min-w-[240px] flex-shrink-0 relative z-10">
          <DigitalClock align="right" />
        </div>
      </div>

      {/* 2. Main Grid: Hero Card (Kiri) + Widgets (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* KOLOM KIRI (7 Kolom): Hero Presensi & Riwayat 5 Hari Terakhir */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {/* Hero Card Presensi Hari Ini */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden relative group">
            {/* Top Accent Stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

            {/* Top Bar Status */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/70 flex items-center justify-center font-bold shadow-2xs">
                  <Compass className="w-5 h-5 text-[#1F77C5]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Status Presensi Hari Ini
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Status Badge Dinamis */}
              <div>
                {isAlphaToday ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    Alpha (Tidak Presensi)
                  </span>
                ) : isSakitToday ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    Sakit
                  </span>
                ) : isIzinToday ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    Izin
                  </span>
                ) : hasClockOut ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Presensi Selesai
                  </span>
                ) : hasClockIn ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sedang Bekerja (Aktif)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                    Belum Presensi Masuk
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-8 flex flex-col gap-4 sm:gap-6">
              
              {/* Tiles Jam Masuk & Jam Keluar dengan Aksen Berwarna Elegan */}
              <div className="order-2 sm:order-1 grid grid-cols-2 gap-3 sm:gap-5">
                {/* Jam Masuk */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  hasClockIn 
                    ? 'border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 border-emerald-200/90 shadow-xs' 
                    : 'border-l-4 border-l-slate-300 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Jam Masuk (Clock In)
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
                      hasClockIn ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      <LogIn className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-3xl font-mono font-black text-slate-800">
                    {hasClockIn && todayAttendance?.clock_in
                      ? formatTimeWIB(todayAttendance.clock_in)
                      : '--:--'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    {hasClockIn ? '✓ Jam masuk tersimpan' : 'Standar masuk 08:00 WIB'}
                  </p>
                </div>

                {/* Jam Keluar */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  hasClockOut 
                    ? 'border-l-4 border-l-[#1F77C5] bg-gradient-to-br from-blue-50/70 via-white to-sky-50/20 border-blue-200/90 shadow-xs' 
                    : 'border-l-4 border-l-slate-300 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Jam Keluar (Clock Out)
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
                      hasClockOut ? 'bg-[#1F77C5] text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      <LogOut className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-3xl font-mono font-black text-slate-800">
                    {hasClockOut && todayAttendance?.clock_out
                      ? formatTimeWIB(todayAttendance.clock_out)
                      : '--:--'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    {hasClockOut ? '✓ Jam kepulangan tersimpan' : 'Batas kerja 17:00 WIB'}
                  </p>
                </div>
              </div>

              {/* Banner Durasi Jika Sudah Clock In */}
              {todayWorkDurationText && (
                <div className="order-3 sm:order-2 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-blue-50/30 border border-blue-200/90 text-xs sm:text-sm shadow-2xs">
                  <span className="text-slate-700 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1F77C5]" />
                    Durasi Kerja Hari Ini:
                  </span>
                  <span className="font-extrabold font-mono text-[#0B2545] bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                    {todayWorkDurationText}
                  </span>
                </div>
              )}

              {/* Tombol Aksi Scan Presensi Utama */}
              <div className="order-1 sm:order-3">
                {isAlphaToday ? (
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-rose-800 text-sm">
                      Jam Kerja Hari Ini Telah Berakhir
                    </p>
                    <p className="text-xs text-rose-600 max-w-md mx-auto">
                      Anda tidak melakukan presensi hingga melewati batas pukul 17:00 WIB dan tercatat Alpha. Silakan hubungi admin jika terdapat kekeliruan atau izin tertulis.
                    </p>
                  </div>
                ) : hasClockOut ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 border border-emerald-200 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-emerald-950 text-base">Seluruh Presensi Hari Ini Selesai</h3>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Terima kasih atas dedikasi dan kerja keras Anda hari ini! Selamat beristirahat.
                      </p>
                    </div>
                  </div>
                ) : hasClockIn ? (
                  <Link
                    href="/dashboard/scan"
                    className="group relative flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
                        <LogOut className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">Presensi Kepulangan</span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">Scan Presensi Pulang (Clock Out)</h3>
                        <p className="text-xs text-white/80 mt-0.5">Klik untuk memindai QR Code presensi saat selesai bekerja</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/scan"
                    className="group relative flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#155494] to-[#1F77C5] hover:from-[#09203A] hover:to-[#1765A8] text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/45 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                        <ScanLine className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Presensi Kehadiran</span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">Scan Presensi Masuk (Clock In)</h3>
                        <p className="text-xs text-blue-100/90 mt-0.5">Pindai QR Code Aksa Tech untuk memulai jam kerja Anda</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Widget Riwayat 5 Hari Terakhir */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center shadow-2xs">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">Aktivitas Presensi Terbaru</h3>
                  <p className="text-[11px] text-slate-400">Catatan kehadiran 5 hari terakhir Anda</p>
                </div>
              </div>

              <Link
                href="/dashboard/history"
                className="text-xs font-bold text-[#1F77C5] hover:text-[#0B2545] flex items-center gap-1 group py-1.5 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 transition-all shadow-2xs"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentAttendances.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada riwayat kehadiran sebelumnya.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAttendances.map(record => {
                  const dStr = record.record_date.toISOString().split('T')[0]
                  const formattedDate = new Date(dStr + "T00:00:00").toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })

                  const isHadir = record.status === 'HADIR'
                  const statusBadgeClass =
                    record.status === 'HADIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    record.status === 'SAKIT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    record.status === 'IZIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'

                  return (
                    <div key={record.id} className="py-3 sm:py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-blue-50/40 rounded-xl px-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{formattedDate}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isHadir ? (
                              <>
                                Masuk: {formatTimeWIB(record.clock_in)}
                                {record.clock_out && (
                                  <> • Keluar: {formatTimeWIB(record.clock_out)}</>
                                )}
                              </>
                            ) : (
                              'Tidak ada jam kerja tercatat'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {record.duration_minutes && isHadir && (
                          <span className="font-mono text-slate-600 font-semibold hidden sm:inline bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {Math.floor(record.duration_minutes / 60)}j {record.duration_minutes % 60}m
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border ${statusBadgeClass}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (5 Kolom): Ringkasan Bulanan & Informasi Kerja */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          
          {/* Ringkasan Bulan Berjalan dengan Aksen Berwarna Elegan */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 rounded-full bg-[#1F77C5]"></div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">Rekapitulasi Bulan Ini</h3>
                  <p className="text-[11px] text-slate-400 font-medium capitalize">{monthName}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#1F77C5] border border-blue-200/80">
                Aktif
              </span>
            </div>

            {/* 4 Cards Grid Berwarna-warni namun Tetap Bersih */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              
              {/* Card 1: Kehadiran (Emerald Accent) */}
              <div className="p-4 rounded-2xl border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/70 via-white to-white border-t border-r border-b border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-wider">Hadir</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                  {hadirCount} <span className="text-xs font-bold text-slate-500 font-sans">Hari</span>
                </p>
                <p className="text-[10px] font-medium text-slate-400">Total hari kerja</p>
              </div>

              {/* Card 2: Jam Kerja (Aksa Blue Accent) */}
              <div className="p-4 rounded-2xl border-l-4 border-l-[#1F77C5] bg-gradient-to-br from-blue-50/70 via-white to-white border-t border-r border-b border-blue-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-blue-800 uppercase tracking-wider">Jam Kerja</span>
                  <div className="w-7 h-7 rounded-lg bg-[#1F77C5] text-white flex items-center justify-center shadow-xs shadow-blue-500/20">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#1F77C5] font-mono">
                  {totalWorkHours} <span className="text-xs font-bold text-slate-500 font-sans">Jam</span>
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  {remainingWorkMins > 0 ? `+ ${remainingWorkMins} menit` : 'Akumulasi kerja'}
                </p>
              </div>

              {/* Card 3: Lembur Weekday (Indigo Accent) */}
              <div className="p-4 rounded-2xl border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/70 via-white to-white border-t border-r border-b border-indigo-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-indigo-800 uppercase tracking-wider">Lembur Weekday</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
                  {totalLemburWeekday} <span className="text-xs font-bold text-slate-500 font-sans">Jam</span>
                </p>
                <p className="text-[10px] font-medium text-slate-400">Setelah 17:00 (maks 3j)</p>
              </div>

              {/* Card 4: Lembur Weekend (Purple Accent) */}
              <div className="p-4 rounded-2xl border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/70 via-white to-white border-t border-r border-b border-purple-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-purple-800 uppercase tracking-wider">Lembur Weekend</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs shadow-purple-600/20">
                    <Coffee className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">
                  {totalLemburWeekend} <span className="text-xs font-bold text-slate-500 font-sans">Jam</span>
                </p>
                <p className="text-[10px] font-medium text-slate-400">Akhir pekan (maks 8j)</p>
              </div>
            </div>
          </div>

          {/* Card Ketentuan Jam Kerja Aksa Tech (Kontras Elegan Biru Navy) */}
          <div className="bg-gradient-to-br from-[#0B2545] via-[#103D6D] to-[#1F77C5] text-white rounded-3xl p-6 shadow-xl shadow-blue-950/20 border border-blue-400/25 space-y-4 relative overflow-hidden">
            {/* Background Ornamen Chevron Watermark */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
              <Building2 className="w-40 h-40 text-white" />
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-white/15 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-xs">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">Ketentuan Jam Kerja</h3>
                <p className="text-[11px] text-blue-200 font-medium">PT AKSA KARYA SATRIA ANGKASA</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-blue-100 relative z-10">
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-300 mt-1.5 flex-shrink-0 shadow-xs shadow-sky-300/50"></span>
                <span><strong>Jam Masuk Reguler:</strong> Pukul <strong>08:00 WIB</strong> (Senin s/d Jumat).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-300 mt-1.5 flex-shrink-0 shadow-xs shadow-sky-300/50"></span>
                <span><strong>Jam Kepulangan:</strong> Pukul <strong>17:00 WIB</strong> (Wajib Clock Out).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 shadow-xs shadow-amber-400/50"></span>
                <span><strong>Batas Akhir Presensi:</strong> Melewati pukul <strong>17:00 WIB</strong> tanpa presensi otomatis dicatat sebagai <strong>Alpha</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 shadow-xs shadow-emerald-400/50"></span>
                <span><strong>Lembur Weekday & Weekend:</strong> Wajib diajukan dan disetujui PM sebelum dihitung valid.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-200 relative z-10">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Sesi login aman (2 jam)
              </span>
              <span className="font-mono text-white/90 font-bold">WIB (UTC+7)</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Link
              href={session.user.role === 'PM' ? "/dashboard/approvals" : "/dashboard/overtimes"}
              className="p-4 rounded-2xl bg-white border border-blue-200/80 hover:border-[#1F77C5] hover:bg-gradient-to-br hover:from-white hover:to-blue-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <p className="font-black text-slate-800 text-xs group-hover:text-[#1F77C5] transition-colors">
                  {session.user.role === 'PM' ? "Persetujuan Lembur" : "Ajukan Lembur"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Kelola lembur kerja</p>
              </div>
            </Link>

            <Link
              href="/dashboard/history"
              className="p-4 rounded-2xl bg-white border border-purple-200/80 hover:border-purple-500 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <p className="font-black text-slate-800 text-xs group-hover:text-purple-700 transition-colors">Riwayat Absensi</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Lihat rekapitulasi lengkap</p>
              </div>
            </Link>
          </div>

        </div>

      </div>

    </div>
  )
}
