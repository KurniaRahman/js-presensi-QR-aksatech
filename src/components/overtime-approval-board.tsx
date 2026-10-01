"use client"

import { useState } from "react"
import { updateOvertimeStatus } from "@/actions/overtime"
import { Check, X, Clock, AlertCircle } from "lucide-react"

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

export function OvertimeApprovalBoard({ overtimes }: { overtimes: OvertimeWithUser[] }) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING')

  const pendingList = overtimes.filter(o => o.status === 'PENDING')
  const historyList = overtimes.filter(o => o.status !== 'PENDING')

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setIsLoading(id)
    await updateOvertimeStatus(id, status)
    setIsLoading(null)
  }

  const displayList = activeTab === 'PENDING' ? pendingList : historyList

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PENDING' ? 'border-[#1F77C5] text-[#1F77C5]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Menunggu Persetujuan ({pendingList.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'HISTORY' ? 'border-[#1F77C5] text-[#1F77C5]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Riwayat ({historyList.length})
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Tidak ada data untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayList.map((ot) => (
            <div key={ot.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800">{ot.user.full_name}</h3>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm text-slate-500">
                    {new Date(ot.request_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-medium">
                    <Clock className="w-4 h-4" />
                    <span>{ot.duration_hours} Jam</span>
                  </div>
                  {ot.status === 'APPROVED' && (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium">
                      Disetujui
                    </span>
                  )}
                  {ot.status === 'REJECTED' && (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md font-medium">
                      Ditolak
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold">Alasan:</span> {ot.reason}
                </p>
              </div>

              {ot.status === 'PENDING' && (
                <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleAction(ot.id, 'APPROVED')}
                    disabled={isLoading === ot.id}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui</span>
                  </button>
                  <button
                    onClick={() => handleAction(ot.id, 'REJECTED')}
                    disabled={isLoading === ot.id}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
