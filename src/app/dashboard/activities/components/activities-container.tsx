"use client"

import { useState } from "react"
import { TeamActivityView, TeamActivityItem, TeamMember } from "./team-activity-view"
import { ActivityLogView } from "./activity-log-view"
import { Users, ClipboardList } from "lucide-react"

interface ActivitiesContainerProps {
  userRole: "STAFF" | "PM" | "ADMIN" | "MAGANG"
  initialDate: string
  initialStartDate?: string
  initialEndDate?: string
  // For Personal View:
  initialPersonalLogs: any[]
  // For PM/Admin Team View:
  initialTeamLogs?: TeamActivityItem[]
  teamMembers?: TeamMember[]
}

export function ActivitiesContainer({
  userRole,
  initialDate,
  initialStartDate,
  initialEndDate,
  initialPersonalLogs,
  initialTeamLogs = [],
  teamMembers = [],
}: ActivitiesContainerProps) {
  const isSupervisor = userRole === "PM" || userRole === "ADMIN"
  const [activeTab, setActiveTab] = useState<"team" | "personal">(
    isSupervisor ? "team" : "personal"
  )

  if (!isSupervisor) {
    return (
      <ActivityLogView 
        initialLogs={initialPersonalLogs} 
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialDate={initialDate} 
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher for PM */}
      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs w-full sm:max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "team"
              ? "bg-[#1F77C5] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Aktivitas Tim</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "team" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {initialTeamLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "personal"
              ? "bg-[#1F77C5] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Log Pribadi Saya</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "personal" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {initialPersonalLogs.length}
          </span>
        </button>
      </div>

      {activeTab === "team" ? (
        <TeamActivityView
          initialLogs={initialTeamLogs}
          teamMembers={teamMembers}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          initialDate={initialDate}
        />
      ) : (
        <ActivityLogView 
          initialLogs={initialPersonalLogs} 
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          initialDate={initialDate} 
        />
      )}
    </div>
  )
}
