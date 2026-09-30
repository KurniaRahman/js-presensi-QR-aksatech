import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 space-y-4">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <h2 className="text-xl font-semibold">Akses Ditolak</h2>
      <p className="text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <Link href="/dashboard" className="inline-block px-4 py-2 text-white bg-[#1F77C5] rounded-md hover:bg-[#155b99]">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
