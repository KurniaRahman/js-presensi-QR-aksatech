import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { attendanceColumns } from "./components/attendance-columns"
import { syncAlphaAttendance } from "@/lib/sync-alpha"
import { DigitalClock } from "@/app/dashboard/components/digital-clock"
import Link from "next/link"
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  AlertCircle, 
  ScanLine, 
  FileDown, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass
} from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Dashboard Administrator",
}

export default async function AdminDashboardPage() {
  const session = await auth()

  const now = new Date()

  // Sapaan dinamis berdasarkan jam Asia/Jakarta
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(now),
    10
  )
  const greeting = 
    currentHour >= 4 && currentHour < 11 ? "Selamat Pagi" :
    currentHour >= 11 && currentHour < 15 ? "Selamat Siang" :
    currentHour >= 15 && currentHour < 18 ? "Selamat Sore" :
    "Selamat Malam"

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
  const todayStart = new Date(`${todayStr}T00:00:00.000Z`)
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`)

  // Fetch Dashboard Stats, Latest Attendances, dan Sinkronisasi ALPHA secara paralel
  const [totalUsers, pendingOvertimes, todayAttendances, todayAlphas, recentAttendances] = await Promise.all([
    db.user.count({ where: { is_active: true } }),
    db.overtime.count({ where: { status: 'PENDING' } }),
    db.attendance.count({ 
      where: { 
        record_date: { gte: todayStart, lte: todayEnd },
        status: 'HADIR'
      } 
    }),
    db.attendance.count({ 
      where: { 
        record_date: { gte: todayStart, lte: todayEnd },
        status: 'ALPHA'
      } 
    }),
    db.attendance.findMany({
      where: {
        record_date: { gte: todayStart, lte: todayEnd }
      },
      include: {
        user: {
          select: { full_name: true, role: true }
        }
      },
      orderBy: {
        clock_in: 'desc'
      },
      take: 15
    }),
    syncAlphaAttendance()
  ]).then(([u, ot, att, alp, rec]) => [u, ot, att, alp, rec] as const)

  // Hitung berapa yang auto-checkout hari ini (untuk notifikasi admin)
  const autoCheckoutCount = await db.attendance.count({
    where: {
      record_date: { gte: todayStart, lte: todayEnd },
      auto_checkout: true
    }
  })

  return (
    <div className="relative min-h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Ornamen Ambient Background & Aerospace Radar Rings */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#1F77C5]/12 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-96 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-sky-400/8 via-[#1F77C5]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Delicate Aerospace Orbital Radar Rings */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full border border-blue-200/35 pointer-events-none -z-10"></div>
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full border border-blue-100/25 pointer-events-none -z-10"></div>

      {/* Subtle Aerospace Tech Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F77C515_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 opacity-70"></div>

      {/* Banner Notifikasi: Auto-Checkout (hanya muncul jika ada record auto-checkout hari ini) */}
      {autoCheckoutCount > 0 && (
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-900">
              ⚠️ {autoCheckoutCount} Karyawan Lupa Presensi Pulang Kemarin
            </h3>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Sistem otomatis mencatat jam pulang pukul <strong>23:59</strong> untuk karyawan tersebut.
              Periksa kolom <strong>"Catatan"</strong> pada tabel di bawah, lalu koreksi jam pulang yang sebenarnya jika diperlukan.
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Eksekutif Admin & Live Clock */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(31,119,197,0.08)] border border-blue-100/90 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Aksen Top Stripe Gradient Brand Aksa Tech */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

        {/* Ornamen Grafis Lingkaran Halus */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-gradient-to-br from-blue-100/40 to-sky-50/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#1F77C5] text-white shadow-xs shadow-blue-500/20 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Administrator
            </span>
            <span className="text-xs text-blue-300 font-bold hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-[#1F77C5] bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100">
              Sistem HRIS Aksa Tech
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-600 bg-clip-text text-transparent">{session?.user?.name || "Admin"}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-normal leading-relaxed">
            Pusat kendali kehadiran dan manajemen operasional karyawan Aksa Tech.
          </p>
        </div>

        {/* Live Clock Widget beraksen Kaca & Biru */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs min-w-[240px] flex-shrink-0 relative z-10">
          <DigitalClock align="right" />
        </div>
      </div>

      {/* 2. 4 Executive Metric Cards (Berwarna & Tetap Dominan Putih Bersih) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Karyawan Aktif (Aksen Aksa Blue) */}
        <Link 
          href="/admin/users"
          className="group p-5 rounded-2xl border-l-4 border-l-[#1F77C5] bg-gradient-to-br from-blue-50/70 via-white to-white border-t border-r border-b border-blue-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider">Karyawan Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-[#1F77C5] text-white flex items-center justify-center shadow-xs shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#1F77C5] font-mono">
            {totalUsers} <span className="text-xs font-bold text-slate-500 font-sans">Orang</span>
          </p>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 group-hover:text-[#1F77C5] transition-colors font-medium">
            <span>Kelola pengguna</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Hadir Hari Ini (Aksen Emerald) */}
        <div className="p-5 rounded-2xl border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/70 via-white to-white border-t border-r border-b border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Hadir Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 font-mono">
            {todayAttendances} <span className="text-xs font-bold text-slate-500 font-sans">Karyawan</span>
          </p>
          <p className="text-[11px] font-medium text-slate-400 pt-1">
            Presensi terverifikasi valid
          </p>
        </div>

        {/* Card 3: Lembur Pending (Aksen Amber) */}
        <Link 
          href="/admin/overtime"
          className="group p-5 rounded-2xl border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/70 via-white to-white border-t border-r border-b border-amber-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Lembur Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 font-mono">
            {pendingOvertimes} <span className="text-xs font-bold text-slate-500 font-sans">Pengajuan</span>
          </p>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 group-hover:text-amber-600 transition-colors font-medium">
            <span>Tinjau lembur</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Alpha / Tidak Hadir (Aksen Rose) */}
        <div className="p-5 rounded-2xl border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50/70 via-white to-white border-t border-r border-b border-rose-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider">Alpha Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shadow-rose-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 font-mono">
            {todayAlphas} <span className="text-xs font-bold text-slate-500 font-sans">Karyawan</span>
          </p>
          <p className="text-[11px] font-medium text-slate-400 pt-1">
            Otomatis setelah 17:00 WIB
          </p>
        </div>

      </div>

      {/* 4. Real-time Attendances Table Card */}
      <div className="bg-white rounded-3xl shadow-[0_4px_25px_-5px_rgba(31,119,197,0.06)] border border-slate-200/90 overflow-hidden relative">
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center shadow-2xs">
              <Compass className="w-5 h-5 text-[#1F77C5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Data Presensi Hari Ini (Real-Time)
              </h2>
              <p className="text-[11px] text-slate-400">
                {now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Monitoring
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <DataTable 
            columns={attendanceColumns} 
            data={recentAttendances} 
            searchPlaceholder="Cari presensi atau nama karyawan..."
          />
        </div>
      </div>

    </div>
  )
}
