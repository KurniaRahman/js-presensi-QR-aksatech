import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { LayoutDashboard, Users, Clock, FileDown } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const adminNavItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Scan Presensi", href: "/admin/scan", icon: <Clock className="h-5 w-5" /> },
    { name: "Manajemen Pengguna", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { name: "Manajemen Lembur", href: "/admin/overtime", icon: <Clock className="h-5 w-5" /> },
    { name: "Export Laporan", href: "/admin/reports", icon: <FileDown className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar navItems={adminNavItems} userName={session.user.name || session.user.email || "Admin"} />
      
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  )
}
