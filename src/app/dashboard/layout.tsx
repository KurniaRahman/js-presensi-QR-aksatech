import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Home, ScanLine, Clock, FileText, ClipboardList, Wrench, PlaneTakeoff } from "lucide-react"
import { SessionTimeoutWatcher } from "@/components/auth/session-timeout-watcher"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const isGuest = session.user.role === "GUEST"

  const canAccessActivityLogs = 
    session.user.role === "STAFF" || 
    session.user.role === "PM"

  const canAccessDroneLogbook = 
    session.user.role === "STAFF" || 
    session.user.role === "PM" ||
    isGuest

  const activityLogLabel = 
    session.user.role === "PM" 
      ? "Log Aktivitas Tim" 
      : "Log Aktivitas"

  const userNavItems = isGuest
    ? [
        { name: "Log Perawatan", href: "/dashboard/drones", icon: <Wrench className="h-5 w-5" /> },
        { name: "Log Penerbangan", href: "/dashboard/flights", icon: <PlaneTakeoff className="h-5 w-5" /> },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
        { name: "Scan Presensi", href: "/dashboard/scan", icon: <ScanLine className="h-5 w-5" /> },
        session.user.role === "PM"
          ? { name: "Approval Lembur", href: "/dashboard/approvals", icon: <Clock className="h-5 w-5" /> }
          : { name: "Pengajuan Lembur", href: "/dashboard/overtimes", icon: <Clock className="h-5 w-5" /> },
        ...(canAccessActivityLogs ? [
          { name: activityLogLabel, href: "/dashboard/activities", icon: <ClipboardList className="h-5 w-5" /> }
        ] : []),
        ...(canAccessDroneLogbook ? [
          { name: "Log Perawatan", href: "/dashboard/drones", icon: <Wrench className="h-5 w-5" /> },
          { name: "Log Penerbangan", href: "/dashboard/flights", icon: <PlaneTakeoff className="h-5 w-5" /> },
        ] : []),
        { name: "Riwayat", href: "/dashboard/history", icon: <FileText className="h-5 w-5" /> },
      ]

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        navItems={userNavItems} 
        userName={session.user.name || session.user.email || "Karyawan"} 
        userRole={
          session.user.role === 'GUEST' ? 'Guest (External)' :
          session.user.role === 'PM' ? 'Project Manager' : 
          session.user.role === 'MAGANG' ? 'Magang' : 
          session.user.role === 'ADMIN' ? 'Administrator' : 
          'Engineer'
        } 
      />

      <main className="flex-1 overflow-y-auto w-full relative">
        {children}
      </main>

      <SessionTimeoutWatcher loginAt={session.user.loginAt} />
    </div>
  )
}
