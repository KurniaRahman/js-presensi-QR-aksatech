"use client"

import { useState, useEffect } from "react"

export function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) return <div className="h-12 animate-pulse bg-gray-200 rounded-lg w-48 mx-auto"></div>

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </h2>
      <p className="text-xs text-slate-500 font-medium mt-0.5">
        {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
