"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
}

export function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
              isActive ? "text-[#1F77C5]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive ? 'bg-[#1F77C5]/10' : ''}`}>
               {item.icon}
            </div>
            <span className={`text-[10px] whitespace-nowrap tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
