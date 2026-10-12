import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserHistoryView } from "./components/user-history-view"

export const metadata = {
  title: "Riwayat Presensi | HRIS Aksa Tech",
  description: "Rekap data kehadiran dan jam kerja karyawan",
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="p-4 md:p-8 min-h-full">
      <UserHistoryView />
    </div>
  )
}
