import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Home, ScanLine, Clock, FileText } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const userNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Scan Presensi", href: "/dashboard/scan", icon: <ScanLine className="h-5 w-5" /> },
    { name: "Pengajuan Lembur", href: "/dashboard/overtimes", icon: <Clock className="h-5 w-5" /> },
    { name: "Riwayat", href: "/dashboard/history", icon: <FileText className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar navItems={userNavItems} userName={session.user.name || session.user.email || "Karyawan"} />
      
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  )
}
