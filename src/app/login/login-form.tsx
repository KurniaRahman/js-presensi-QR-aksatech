"use client"

import { useState } from "react"
import { loginAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowRight 
} from "lucide-react"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    try {
      const res = await loginAction(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        // Biarkan loading tetap true karena sedang proses transisi redirect ke dashboard
        throw err
      }
      setError("Gagal terhubung ke server. Periksa koneksi Anda.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {/* Input Email / Username */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F77C5] transition-colors pointer-events-none">
            <Mail className="w-5 h-5" />
          </div>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Phone or Email address" 
            required 
            autoComplete="email"
            className="rounded-full pl-12 pr-6 py-6 border-slate-300 bg-white/80 focus:bg-white focus:border-[#1F77C5] focus:ring-2 focus:ring-[#1F77C5]/20 text-slate-800 placeholder:text-slate-400 text-sm sm:text-base shadow-xs transition-all"
          />
        </div>

        {/* Input Password dengan Toggle Show/Hide */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F77C5] transition-colors pointer-events-none">
            <Lock className="w-5 h-5" />
          </div>
          <Input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            required 
            autoComplete="current-password"
            className="rounded-full pl-12 pr-12 py-6 border-slate-300 bg-white/80 focus:bg-white focus:border-[#1F77C5] focus:ring-2 focus:ring-[#1F77C5]/20 text-slate-800 placeholder:text-slate-400 text-sm sm:text-base shadow-xs transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Error Alert Box */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* Submit Button (Full-width on mobile, compact on desktop) */}
      <div className="pt-1">
        <Button 
          type="submit" 
          className="w-full md:w-[150px] rounded-full bg-[#1F77C5] hover:bg-[#155b99] active:scale-[0.98] py-6 text-base font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
