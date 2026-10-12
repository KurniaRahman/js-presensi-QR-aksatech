"use client"

import { useState } from "react"
import { submitOvertime } from "../actions"
import { 
  Calendar, 
  Clock, 
  FileText, 
  Loader2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  CalendarDays
} from "lucide-react"
import { isWeekendDay } from "@/lib/attendance-utils"

export function OvertimeForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Tanggal default hari ini (local time)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  const isWeekend = isWeekendDay(selectedDate)
  const maxHours = isWeekend ? 8 : 3

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const durationStr = formData.get("duration_hours") as string
    const duration = parseInt(durationStr, 10)
    
    // Client-side validation
    if (isWeekend && duration > 8) {
      setMessage({ type: 'error', text: 'Maksimal lembur akhir pekan adalah 8 jam. Pengajuan ditolak.' })
      setIsLoading(false)
      return
    }
    if (!isWeekend && duration > 3) {
      setMessage({ type: 'error', text: 'Maksimal lembur hari kerja adalah 3 jam. Pengajuan ditolak.' })
      setIsLoading(false)
      return
    }

    const res = await submitOvertime(formData)
    if (res.success) {
      setMessage({ type: 'success', text: res.message })
      form.reset()
      // Reset date to today
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      setSelectedDate(`${y}-${m}-${d}`)
    } else {
      setMessage({ type: 'error', text: res.message })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(31,119,197,0.08)] border border-slate-200/90 relative overflow-hidden space-y-5">
      {/* Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

      {/* Header Form */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center shadow-2xs flex-shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            Formulir Lembur Baru
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Lengkapi data pengajuan jam lembur Anda
          </p>
        </div>
      </div>
      
      {/* Pesan Feedback */}
      {message && (
        <div 
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs sm:text-sm animate-fade-in shadow-2xs ${
            message.type === 'error' 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-2xs ${
            message.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <span className="font-medium leading-relaxed">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Tanggal */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="request_date" className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Tanggal Lembur
            </label>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
              isWeekend 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {isWeekend ? 'Akhir Pekan (Weekend)' : 'Hari Kerja (Weekday)'}
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              name="request_date"
              id="request_date"
              required
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Input Durasi */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="duration_hours" className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Durasi (Jam)
            </label>
            <span className="text-[11px] font-bold text-[#1F77C5] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Maks {maxHours} Jam
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
            <input
              type="number"
              name="duration_hours"
              id="duration_hours"
              min="1"
              max={maxHours}
              required
              placeholder={`Contoh: ${isWeekend ? '5' : '2'}`}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] focus:bg-white transition-all font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {isWeekend 
              ? '• Weekend: Dihitung dari jam masuk s/d pulang (maks 8j)' 
              : '• Weekday: Dihitung setelah pukul 17:00 WIB (maks 3j)'}
          </p>
        </div>

        {/* Input Alasan */}
        <div className="space-y-1.5">
          <label htmlFor="reason" className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Alasan / Pekerjaan
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              name="reason"
              id="reason"
              required
              rows={3}
              placeholder="Jelaskan detail pekerjaan lembur yang dilakukan..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] focus:bg-white transition-all resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* Tombol Kirim */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#155494] to-[#1F77C5] hover:from-[#09203A] hover:to-[#1765A8] text-white font-extrabold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mengirim Pengajuan...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Kirim Pengajuan Lembur</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
