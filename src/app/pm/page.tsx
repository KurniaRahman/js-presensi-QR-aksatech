import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PMPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Halaman PM Khusus</h1>
      <p>Hanya role PM dan ADMIN yang bisa melihat halaman ini.</p>
      <Link href="/dashboard" className="inline-block px-4 py-2 border rounded-md hover:bg-gray-100">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
