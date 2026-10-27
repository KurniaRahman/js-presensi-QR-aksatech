import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, PlaneTakeoff, Clock, BatteryCharging, Radio, ShieldCheck, Compass, Info } from "lucide-react"

export const metadata = {
  title: "Log Penerbangan | Aksa Tech Integrated Portal",
  description: "Monitoring riwayat dan telemetry penerbangan drone Aksa Tech",
}

export default async function FlightLogPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Khusus role GUEST, STAFF (Engineer/Pilot), dan PM
  if (
    session.user.role !== "STAFF" && 
    session.user.role !== "PM" && 
    session.user.role !== "GUEST"
  ) {
    if (session.user.role === "ADMIN") {
      redirect("/admin")
    }
    redirect("/dashboard")
  }

  const isGuest = session.user.role === "GUEST"
  const isPM = session.user.role === "PM"

  return (
    <div className="relative min-h-screen bg-slate-50/60 font-sans">
      {/* Aerospace Grid Background */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:radial-gradient(#0B2545_1px,transparent_1px)] [background-size:24px_24px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed -top-40 right-0 w-[32rem] h-[32rem] rounded-full bg-[#1F77C5]/12 blur-3xl" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed top-1/2 -left-32 w-96 h-96 rounded-full bg-sky-400/8 blur-3xl" 
        aria-hidden="true" 
      />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1F77C5] border border-blue-200/60">
                  <PlaneTakeoff className="w-3.5 h-3.5" />
                  {isGuest 
                    ? "External Guest • Viewer Log Penerbangan"
                    : isPM 
                      ? "Project Manager • Monitoring Penerbangan Drone" 
                      : "Pilot / Engineer • Pencatatan Riwayat Terbang"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Telemetry Hub Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-[#1F77C5] border border-blue-100/80 shadow-sm">
                  <PlaneTakeoff className="w-6 h-6" />
                </span>
                Log Penerbangan
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Pencatatan riwayat setiap penerbangan drone: jam take-off, jam landing, total durasi penerbangan, tipe misi (Latihan/Operasi), dan rotasi baterai unit.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center">
              <Link
                href={isGuest ? "/dashboard/drones" : "/dashboard"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-[#1F77C5] hover:border-blue-200 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>{isGuest ? "Log Perawatan" : "Dashboard"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Informational Status Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/90 text-center space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 text-[#1F77C5] border border-blue-100 flex items-center justify-center mx-auto shadow-inner">
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-[#1F77C5] animate-pulse" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              Integrasi Telemetry & Log Penerbangan
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Modul pencatatan log penerbangan sedang dalam tahap finalisasi sinkronisasi telemetry dengan unit armada drone Aksa Tech.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                <Compass className="w-4 h-4 text-[#1F77C5]" />
                <span>Take-Off & Landing</span>
              </div>
              <p className="text-xs text-slate-500">
                Pencatatan presisi jam penerbangan dan kalkulasi durasi operasional otomatis.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                <BatteryCharging className="w-4 h-4 text-[#1F77C5]" />
                <span>Manajemen Baterai</span>
              </div>
              <p className="text-xs text-slate-500">
                Tracking nomor siklus baterai untuk menjaga keandalan power unit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#1F77C5]" />
                <span>Keamanan Misi</span>
              </div>
              <p className="text-xs text-slate-500">
                Klasifikasi misi training vs operational flight sesuai SOP Aksa Tech.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/drones"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1F77C5] text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:bg-[#1862a5] transition-all"
            >
              <span>Lihat Log Perawatan Armada</span>
              <PlaneTakeoff className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
