"use client"

import { useState, useMemo } from "react"
import { Clock3, CheckCircle2, XCircle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Clock, AlertCircle } from "lucide-react"
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
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold whitespace-nowrap">
        <Clock3 className="w-3.5 h-3.5" />
        <span>MENUNGGU</span>
      </span>
    )
    if (status === 'APPROVED') return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>DISETUJUI</span>
      </span>
    )
    if (status === 'REJECTED') return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5" />
        <span>DITOLAK</span>
      </span>
    )
    return null
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari alasan lembur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#1F77C5] transition-all bg-white"
          />
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1F77C5] bg-white cursor-pointer font-medium text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl transition-colors font-medium"
              title="Reset Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-xs bg-blue-50 text-[#1F77C5] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
            {processedList.length} Total
          </span>
        </div>
      </div>

      {processedList.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Tidak ada riwayat yang ditemukan.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid gap-3 md:hidden">
            {processedList.map((ot) => (
              <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-semibold text-slate-500">
                        {new Date(ot.request_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {isWeekendDay(ot.request_date) ? (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Weekend</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded">Weekday</span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">
                      {ot.duration_hours} Jam
                    </p>
                  </div>
                  {renderStatus(ot.status)}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-700">Alasan: </span>{ot.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th 
                      onClick={() => handleSort("date")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/4"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Tanggal</span>
                        <SortIcon col="date" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("duration")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/6"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Durasi</span>
                        <SortIcon col="duration" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("status")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-1/6"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Status</span>
                        <SortIcon col="status" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("reason")} 
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors w-5/12"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Alasan</span>
                        <SortIcon col="reason" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedList.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div className="flex items-center space-x-2">
                          <span>{new Date(ot.request_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          {isWeekendDay(ot.request_date) ? (
                            <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                              Weekend
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">
                              Weekday
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-amber-600 font-semibold">
                          {ot.duration_hours} Jam
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renderStatus(ot.status)}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px]" title={ot.reason}>
                        {ot.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <div>
                Total <strong>{processedList.length}</strong> data riwayat lembur ditampilkan
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
