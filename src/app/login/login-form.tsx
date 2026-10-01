"use client"

import { useState } from "react"
import { loginAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    try {
      const res = await loginAction(formData)
      if (res?.error) {
        setError(res.error)
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      setError("Gagal terhubung ke server. Periksa koneksi Anda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Phone or Email address" 
            required 
            className="rounded-full px-6 py-6 border-gray-300 bg-transparent placeholder:text-gray-300"
          />
        </div>
        <div>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Password" 
            required 
            className="rounded-full px-6 py-6 border-gray-300 bg-transparent placeholder:text-gray-300"
          />
        </div>
      </div>
      
      {error && (
        <div className="text-sm font-medium text-red-500 ml-4">
          {error}
        </div>
      )}

      <div>
        <Button 
          type="submit" 
          className="rounded-full bg-[#1F77C5] hover:bg-[#155b99] px-10 py-6 text-lg font-medium shadow-md w-[140px]"
          disabled={loading}
        >
          {loading ? "..." : "Log In"}
        </Button>
      </div>
    </form>
  )
}
