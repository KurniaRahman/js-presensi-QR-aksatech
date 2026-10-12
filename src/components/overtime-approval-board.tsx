"use client"

import { useState, useMemo } from "react"
import { updateOvertimeStatus } from "@/actions/overtime"
import { Check, X, Clock, AlertCircle, Search, Filter, ChevronUp, ChevronDown, CheckCircle2, XCircle, Clock3 } from "lucide-react"
import { isWeekendDay } from "@/lib/attendance-utils"

type OvertimeWithUser = {
  id: string;
  user_id: string;
  request_date: Date;
  duration_hours: number;
  reason: string;
  status: string;
  created_at: Date;
  user: {
    full_name: string;
  };
}

type SortCol = "name" | "date" | "duration" | "status" | "reason"
type SortDir = "asc" | "desc"

export function OvertimeApprovalBoard({ overtimes }: { overtimes: OvertimeWithUser[] }) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sortCol, setSortCol] = useState<SortCol>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setIsLoading(id)
    await updateOvertimeStatus(id, status)
    setIsLoading(null)
  }

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  const processedList = useMemo(() => {
    let list = [...overtimes]

    // Filter Status
    if (statusFilter !== "ALL") {
      list = list.filter(o => o.status === statusFilter)
    }

    // Search
    if (searchQuery.trim() !== "") {
      const lowerQ = searchQuery.toLowerCase()
      list = list.filter(o => 
        o.user.full_name.toLowerCase().includes(lowerQ) ||
        o.reason.toLowerCase().includes(lowerQ)
      )
    }

    // Sort
    list.sort((a, b) => {
      let valA: any, valB: any

      switch (sortCol) {
        case "name":
          valA = a.user.full_name.toLowerCase()
          valB = b.user.full_name.toLowerCase()
          break
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
    if (sortCol !== col) return <ChevronUp className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />
    return sortDir === "asc" ? <ChevronUp className="w-4 h-4 text-[#1F77C5]" /> : <ChevronDown className="w-4 h-4 text-[#1F77C5]" />
  }

  const renderStatus = (status: string) => {
    if (status === 'PENDING') return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold whitespace-nowrap">
        <Clock3 className="w-3.5 h-3.5" />
        <span>MENUNGGU</span>
      </span>
    )
    if (status === 'APPROVED') return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>DISETUJUI</span>
      </span>
    )
    if (status === 'REJECTED') return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5" />
        <span>DITOLAK</span>
      </span>
    )
    return null
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari nama atau alasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5] focus:ring-1 focus:ring-[#1F77C5] transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F77C5] bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Hybrid Display: Table for MD+, Cards for Mobile */}
      {processedList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Tidak ada data yang cocok.</p>
          <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter status.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid gap-4 md:hidden">
            {processedList.map((ot) => (
              <div key={ot.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{ot.user.full_name}</h3>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <p className="text-xs text-slate-500">
                        {new Date(ot.request_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {isWeekendDay(ot.request_date) ? (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Weekend</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded">Weekday</span>
                      )}
                    </div>
                  </div>
                  {renderStatus(ot.status)}
                </div>
                
                <div className="flex items-center space-x-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-medium w-max text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{ot.duration_hours} Jam</span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                  <span className="font-semibold text-slate-700">Alasan:</span> <span className="text-slate-600">{ot.reason}</span>
                </div>

                {ot.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAction(ot.id, 'APPROVED')}
                      disabled={isLoading === ot.id}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui</span>
                    </button>
                    <button
                      onClick={() => handleAction(ot.id, 'REJECTED')}
                      disabled={isLoading === ot.id}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th onClick={() => handleSort("name")} className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span>Nama</span>
                        <SortIcon col="name" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("date")} className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span>Tanggal Lembur</span>
                        <SortIcon col="date" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("duration")} className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span>Durasi</span>
                        <SortIcon col="duration" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("status")} className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <SortIcon col="status" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("reason")} className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-colors max-w-[200px]">
                      <div className="flex items-center space-x-1">
                        <span>Alasan</span>
                        <SortIcon col="reason" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedList.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {ot.user.full_name}
                      </td>
                      <td className="px-4 py-3">
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
                        <span className="text-amber-600 font-medium">
                          {ot.duration_hours} Jam
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renderStatus(ot.status)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={ot.reason}>
                        {ot.reason}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ot.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleAction(ot.id, 'APPROVED')}
                              disabled={isLoading === ot.id}
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors disabled:opacity-50"
                              title="Setujui"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(ot.id, 'REJECTED')}
                              disabled={isLoading === ot.id}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                              title="Tolak"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
