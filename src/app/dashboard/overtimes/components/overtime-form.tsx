"use client"

import { useState } from "react"
import { submitOvertime } from "../actions"
import { Calendar, Clock, FileText, Loader2 } from "lucide-react"

export function OvertimeForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const durationStr = formData.get("duration_hours") as string
    const duration = parseInt(durationStr, 10)
    
    // Client-side validation to show popup immediately if > 3
    if (duration > 3) {
      setMessage({ type: 'error', text: 'Maksimal lembur harian adalah 3 jam. Pengajuan ditolak.' })
      setIsLoading(false)
      return
    }

    const res = await submitOvertime(formData)
    if (res.success) {
      setMessage({ type: 'success', text: res.message })
      form.reset()
    } else {
      setMessage({ type: 'error', text: res.message })
    }
    
    setIsLoading(false)
  }

  // Dapatkan tanggal hari ini dalam format YYYY-MM-DD
  const today = new Date()
  // Kita butuh offset lokal untuk format input date yang benar
  const todayFormatted = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Form Pengajuan Lembur</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="request_date" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tanggal Lembur
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              name="request_date"
              id="request_date"
              required
              defaultValue={todayFormatted}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="duration_hours" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Durasi (Jam)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="number"
              name="duration_hours"
              id="duration_hours"
              min="1"
              max="12"
              required
              placeholder="Contoh: 2"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5]"
            />
          </div>
          <p className="text-[10px] text-slate-400">*Maksimal 3 jam per hari</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reason" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Alasan / Pekerjaan
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <textarea
              name="reason"
              id="reason"
              required
              rows={3}
              placeholder="Jelaskan pekerjaan yang dilakukan..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5]"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2.5 bg-[#1F77C5] hover:bg-[#155b99] text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ajukan Lembur"}
        </button>
      </form>
    </div>
  )
}
