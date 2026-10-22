"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export function DigitalClock({ 
  align = "center",
  className = ""
}: { 
  align?: "left" | "center" | "right"
  className?: string 
}) {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return (
      <div className={`h-12 animate-pulse bg-slate-200/70 rounded-xl w-48 ${align === 'center' ? 'mx-auto' : ''} ${className}`}></div>
    )
  }

  const alignClass = 
    align === "left" ? "text-left items-start" :
    align === "right" ? "text-right items-end" :
    "text-center items-center"

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#1F77C5] animate-pulse" />
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-slate-900">
          {time.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          <span className="text-xs font-bold text-[#1F77C5] ml-1.5 font-sans uppercase tracking-wider">WIB</span>
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
        {time.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
