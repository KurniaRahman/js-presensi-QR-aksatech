import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DroneLogbookContainer } from "./components/drone-logbook-container"
import { getDrones, getDroneMaintenanceLogs } from "@/actions/drone-maintenance"
import { getDateStringWIB } from "@/lib/attendance-utils"
import { Plane, ArrowLeft, ShieldCheck, Wrench, Sparkles, Cpu } from "lucide-react"

export const metadata = {
  title: "Logbook Perawatan Drone | HRIS Aksa Tech",
  description: "Pencatatan riwayat inspeksi, perbaikan, dan penggantian komponen armada drone PT Aksa Tech Indonesia",
}

export default async function DroneLogbookPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Khusus role STAFF (Engineer) dan PM. Admin dan Magang diarahkan kembali ke dashboard.
  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    if (session.user.role === "ADMIN") {
      redirect("/admin")
    }
    redirect("/dashboard")
  }

  const userRole = session.user.role as "STAFF" | "PM"
  const isSupervisor = userRole === "PM"

  const now = new Date()
  const todayStr = getDateStringWIB(now)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const startStr = getDateStringWIB(thirtyDaysAgo)

  // Fetch initial data secara paralel
  const [dronesRes, logsRes] = await Promise.all([
    getDrones(),
    getDroneMaintenanceLogs({ startDate: startStr, endDate: todayStr }),
  ])

  const initialDrones = dronesRes.success && dronesRes.data ? dronesRes.data : []
  const initialLogs = logsRes.success && logsRes.data ? logsRes.data : []

  return (
    <div className="relative min-h-screen bg-slate-50/60 font-sans">
      {/* Background Ornaments: Aerospace Dot-Grid & Ambient Blue Glow */}
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

      {/* Orbital Radar Rings Decoration */}
      <div 
        className="pointer-events-none fixed -top-24 right-12 w-96 h-96 rounded-full border border-blue-200/35" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed -top-40 right-0 w-[34rem] h-[34rem] rounded-full border border-blue-100/25" 
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
                  <Plane className="w-3.5 h-3.5" />
                  {isSupervisor ? "Project Manager • Manajemen & Monitoring Armada" : "Engineer • Perawatan & Servis Armada"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Cpu className="w-3 h-3 text-slate-500" />
                  Avionics & Drone Logbook
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-[#1F77C5] border border-blue-100/80 shadow-sm">
                  <Plane className="w-6 h-6" />
                </span>
                Logbook Drone
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Pencatatan riwayat pemeliharaan, inspeksi berkala, penanganan kendala, dan penggantian suku cadang pada setiap unit armada drone PT Aksa Tech Indonesia.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-[#1F77C5] hover:border-blue-200 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Client Logbook & Fleet Container */}
        <DroneLogbookContainer
          userRole={userRole}
          currentUserId={session.user.id}
          initialDrones={initialDrones}
          initialLogs={initialLogs}
          initialStartDate={startStr}
          initialEndDate={todayStr}
          todayStr={todayStr}
        />
      </div>
    </div>
  )
}
