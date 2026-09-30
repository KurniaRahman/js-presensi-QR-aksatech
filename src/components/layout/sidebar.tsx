"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, X, LogOut, Hexagon } from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ navItems, userName }: { navItems: NavItem[], userName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#1F77C5] text-white p-4">
        <div className="flex items-center gap-2">
          <Hexagon className="h-6 w-6" />
          <span className="font-bold text-lg tracking-wide">AKSA TECH</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 focus:outline-none">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1F77C5] text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        {/* Logo Area */}
        <div className="hidden md:flex items-center gap-2 p-6">
          <Hexagon className="h-8 w-8 text-white" />
          <span className="font-bold text-2xl tracking-wide uppercase">Aksa Tech</span>
        </div>
        <div className="px-6 py-2 md:hidden">
          {/* Spacer for mobile to not overlap close button if any, though mobile has topbar */}
          <h2 className="text-sm text-blue-200 uppercase tracking-widest font-semibold">Menu</h2>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            // Exact match for dashboard to prevent it from always being active in sub-routes
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : (pathname === item.href || pathname.startsWith(`${item.href}/`))
              
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? "bg-white text-[#1F77C5] font-semibold shadow-sm"
                    : "text-blue-100 hover:bg-[#155b99] hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-[#155b99]">
          <div className="flex flex-col gap-4">
            <div className="px-4 py-2">
              <p className="text-sm text-blue-200">Masuk sebagai:</p>
              <p className="font-semibold truncate">{userName}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3 w-full text-left bg-red-600 text-white hover:bg-red-700 hover:text-white rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
