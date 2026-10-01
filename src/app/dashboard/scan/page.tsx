import { ScannerClient } from "./scanner-client"
import { checkNetworkIp } from "./network-actions"
import { Lock } from "lucide-react"

export default async function ScanPage() {
  const network = await checkNetworkIp()

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scan Presensi</h1>
        <p className="text-gray-600 mt-1">
          Arahkan kamera ke QR Code yang ada di kantor untuk melakukan absensi.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
        {!network.allowed ? (
           <div className="py-12 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
               <Lock className="h-10 w-10 text-red-600" />
             </div>
             <h2 className="text-xl font-bold text-gray-900">Akses Ditolak (Di Luar Jaringan)</h2>
             <p className="text-gray-500 max-w-md mx-auto mt-2">
               Anda terdeteksi menggunakan jaringan di luar kantor (IP: <strong className="text-gray-800">{network.clientIp}</strong>).
               Silakan hubungkan perangkat Anda ke Wi-Fi Kantor untuk membuka kamera.
             </p>
           </div>
        ) : (
          <>
            <ScannerClient />
            <p className="mt-6 text-sm text-gray-500">
              Pastikan seluruh area QR Code terlihat jelas di dalam kotak kamera.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
