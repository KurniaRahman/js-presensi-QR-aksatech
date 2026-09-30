import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: '/login' })
          }}>
            <Button type="submit" variant="outline">Logout</Button>
          </form>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl">Halo, <span className="font-semibold text-[#1F77C5]">{session.user.name}</span>!</h2>
          <p className="text-gray-600">
            Anda berhasil masuk. Role Anda saat ini adalah: <strong className="bg-gray-100 px-2 py-1 rounded">{session.user.role}</strong>
          </p>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Simulasi Navigasi Role:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li><a href="/admin" className="underline hover:text-blue-600">Ke Halaman Admin (Hanya ADMIN)</a></li>
              <li><a href="/pm" className="underline hover:text-blue-600">Ke Halaman PM (Hanya PM & ADMIN)</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
