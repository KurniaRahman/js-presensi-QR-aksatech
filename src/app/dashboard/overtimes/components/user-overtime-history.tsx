"use client"

import { useState, useMemo } from "react"
import { 
  Clock3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Clock, 
  AlertCircle,
  CalendarCheck,
  CalendarDays
} from "lucide-react"
import { isWeekendDay } from "@/lib/attendance-utils"

type Overtime = {
  id: string;
  request_date: Date;
  duration_hours: number;
  reason: string;
  status: string;
  created_at: Date;
}

type SortCol = "date" | "duration" | "status" | "reason"
type SortDir = "asc" | "desc"

export function UserOvertimeHistory({ overtimes }: { overtimes: Overtime[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sortCol, setSortCol] = useState<SortCol>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
  }

  const processedList = useMemo(() => {
    let list = [...overtimes]

    if (statusFilter !== "ALL") {
      list = list.filter(o => o.status === statusFilter)
    }

    if (searchQuery.trim() !== "") {
      const lowerQ = searchQuery.toLowerCase()
      list = list.filter(o => o.reason.toLowerCase().includes(lowerQ))
    }

    list.sort((a, b) => {
      let valA: any, valB: any

      switch (sortCol) {
        case "date":
          valA = new Date(a.request_date).getTime()
          valB = new Date(b.request_date).getTime()
          break
        case "duration":
          valA = a.duration_hours
          valB = b.duration_hours
          break
        case "status":
          valA = a.status
          valB = b.status
          break
        case "reason":
          valA = a.reason.toLowerCase()
          valB = b.reason.toLowerCase()
          break
        default:
          valA = 0
          valB = 0
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1
      if (valA > valB) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return list
  }, [overtimes, searchQuery, statusFilter, sortCol, sortDir])

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 inline-block ml-1" />
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    )
  }

  const renderStatus = (status: string) => {
    if (status === 'PENDING') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold whitespace-nowrap shadow-2xs">
        <Clock3 className="w-3.5 h-3.5 text-amber-500" />
        <span>Menunggu</span>
      </span>
    )
    if (status === 'APPROVED') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Disetujui</span>
      </span>
    )
    if (status === 'REJECTED') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold whitespace-nowrap shadow-2xs">
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        <span>Ditolak</span>
      </span>
    )
    return null
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(31,119,197,0.06)] border border-slate-200/90 space-y-5">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center shadow-2xs flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
              Riwayat Pengajuan Lembur
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar seluruh tiket lembur yang telah Anda ajukan
            </p>
          </div>
        </div>

        <span className="text-xs font-bold bg-blue-50 text-[#1F77C5] px-3 py-1 rounded-full border border-blue-200/80 w-fit">
          {processedList.length} Total Data
        </span>
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari alasan pekerjaan lembur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] transition-all bg-slate-50/60 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1F77C5] bg-white cursor-pointer font-bold text-slate-700 shadow-2xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-xl transition-colors font-bold cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* List / Table Area */}
      {processedList.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-600 font-bold">Tidak ada riwayat pengajuan ditemukan</p>
          <p className="text-xs text-slate-400">Gunakan form di samping untuk membuat pengajuan lembur baru.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid gap-3 md:hidden">
            {processedList.map((ot) => (
              <div key={ot.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">
                        {new Date(ot.request_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {isWeekendDay(ot.request_date) ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Weekend
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Weekday
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1 font-mono">
                      {ot.duration_hours} <span className="text-xs font-bold font-sans text-slate-500">Jam Lembur</span>
                    </p>
                  </div>
                  <div>
                    {renderStatus(ot.status)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Alasan: </span>{ot.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50/90 text-slate-700 text-xs uppercase font-extrabold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th 
                      onClick={() => handleSort("date")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/4"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal</span>
                        <SortIcon col="date" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("duration")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/6"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Durasi</span>
                        <SortIcon col="duration" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("status")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/6"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <SortIcon col="status" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("reason")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-5/12"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Alasan / Tugas</span>
                        <SortIcon col="reason" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedList.map((ot) => (
                    <tr key={ot.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{new Date(ot.request_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          {isWeekendDay(ot.request_date) ? (
                            <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                              Weekend
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                              Weekday
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[#1F77C5] font-black font-mono">
                          {ot.duration_hours} Jam
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {renderStatus(ot.status)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium max-w-[280px] truncate" title={ot.reason}>
                        {ot.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-4 py-3 border-t border-slate-100 bg-slate-50/60 font-medium">
              <span>Menampilkan data riwayat lembur terbaru Anda</span>
              <span className="font-bold text-slate-700 font-mono">{processedList.length} Entri</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
