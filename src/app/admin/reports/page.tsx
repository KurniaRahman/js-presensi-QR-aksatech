import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ReportsBoard } from "./components/reports-board"
import { getUsersForOverride } from "@/actions/admin-attendance"

export default async function ReportsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')

  const staffUsers = await getUsersForOverride()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Absensi</h1>
          <p className="text-slate-500 text-sm">Kelola data absensi manual dan unduh laporan.</p>
        </div>
      </div>
      
      <ReportsBoard staffUsers={staffUsers} />
    </div>
  )
}
