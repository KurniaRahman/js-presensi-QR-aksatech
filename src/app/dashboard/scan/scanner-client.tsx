"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { processAttendance } from "./actions"
import { useRouter } from "next/navigation"

export function ScannerClient({ redirectUrl = '/dashboard' }: { redirectUrl?: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const handleScan = async (detectedCodes: any[]) => {
    if (loading || detectedCodes.length === 0) return
    const qrValue = detectedCodes[0].rawValue

    if (!qrValue) return

    setLoading(true)
    try {
      const res = await processAttendance(qrValue)
      if (res.success) {
        console.log("✅ [SCAN SUCCESS] Berhasil memproses QR Code:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'success' })
        // Kembali ke dashboard setelah scan sukses
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
      } else {
        console.log("❌ [SCAN FAILED] QR Code ditolak:", qrValue)
        console.log("Server Response:", res.message)
        setMessage({ text: res.message, type: 'error' })
        // Beri jeda 3 detik sebelum boleh scan lagi jika gagal
        setTimeout(() => {
          setLoading(false)
          setMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error("🚨 [SCAN ERROR] Terjadi kesalahan fatal saat menghubungi server:", error)
      setMessage({ text: "Terjadi kesalahan jaringan atau server.", type: 'error' })
      setTimeout(() => {
        setLoading(false)
        setMessage(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-gray-100 shadow-lg">
        {loading ? (
          <div className="h-[350px] w-full flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium animate-pulse">Memproses Kehadiran...</p>
          </div>
        ) : (
          <Scanner
            onScan={handleScan}
            formats={["qr_code"]}
            components={{
              zoom: false,
              finder: true,
            }}
            styles={{
              container: { width: '100%', height: '100%' }
            }}
          />
        )}
      </div>
    </div>
  )
}
