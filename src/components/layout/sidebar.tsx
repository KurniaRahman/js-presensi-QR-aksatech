"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, X, LogOut } from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ 
  navItems, 
  userName, 
  userRole = "Karyawan",
  hideMobile = false 
}: { 
  navItems: NavItem[]
  userName: string
  userRole?: string
  hideMobile?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const userInitials = userName
    ? userName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AK'

  const homeHref = userRole === 'Administrator' 
    ? "/admin" 
    : userRole === 'Guest (External)' 
      ? "/dashboard/drones" 
      : "/dashboard"

  return (
    <>
      {/* Mobile Top Bar */}
      {!hideMobile && (
        <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200/80 px-4 py-3 shadow-xs">
          <Link href={homeHref} className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Aksa Tech" 
              className="h-7 w-auto object-contain" 
            />
          </Link>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 rounded-xl text-slate-600 hover:text-[#1F77C5] hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {!hideMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Drawer Mobile */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 shadow-[2px_0_16px_-4px_rgba(15,23,42,0.06)] transform transition-transform duration-300 ease-in-out flex flex-col ${
          !hideMobile && isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 ${hideMobile ? 'hidden md:flex' : ''}`}
      >
        {/* Logo Area (Dominan Putih & Menyatu Alami) */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link 
            href={homeHref} 
            onClick={() => setIsOpen(false)}
            className="transition-transform hover:scale-[1.02] flex items-center justify-center flex-1"
          >
            <img 
              src="/logo.png" 
              alt="Aksa Tech - The Farthest Unmanned Technology" 
              className="h-9 w-auto object-contain" 
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 space-y-1.5 py-5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const isActive = item.href === '/admin' || item.href === '/dashboard'
              ? pathname === item.href
              : (pathname === item.href || pathname.startsWith(`${item.href}/`))
              
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-[#1F77C5] text-white font-semibold shadow-md shadow-blue-500/25 translate-x-1"
                    : "text-slate-600 hover:text-[#1F77C5] hover:bg-blue-50/70 hover:translate-x-0.5"
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-slate-400 group-hover:text-[#1F77C5]'}`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Card & Logout Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1F77C5] to-sky-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs flex-shrink-0 border border-blue-200">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-snug" title={userName}>
                  {userName}
                </p>
                <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-[#1F77C5] border border-blue-200/80 uppercase mt-0.5 tracking-wider">
                  {userRole}
                </span>
              </div>
            </div>

            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Keluar dari akun"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-200 flex-shrink-0 group"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
