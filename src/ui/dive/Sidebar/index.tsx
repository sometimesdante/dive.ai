'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Menu,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Ticket,
  Clock,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/timesheet', label: 'Timesheet', icon: Clock },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

type Props = {
  userName?: string | null
  userEmail?: string | null
}

export default function Sidebar({ userName, userEmail }: Props) {
  const [open, setOpen] = useState(true)
  const pathname = usePathname()
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className={`flex flex-col h-screen sticky top-0 border-r border-gray-100 transition-all duration-300 overflow-hidden shrink-0 ${open ? 'w-52' : 'w-14'}`}>

      {/* Header */}
      <div className="flex items-center justify-center px-3 py-4">
        {open ? (
          <div className="flex items-center justify-between w-full">
            <h4 className="ml-8 text-[#00C49A] font-bold">Dive!</h4>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">
              <Menu size={20} />
            </button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="text-[#00C49A] font-bold">
            <h5 className='text-[#00C49A] font-bold'>D!</h5>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-2 py-2 transition-colors ${active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Icon size={18} className="shrink-0" />
              {open && (
                <span className="transition-opacity duration-300 whitespace-nowrap">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      {open ? (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-4 border-t border-gray-100 hover:bg-gray-100 transition-colors w-full text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gray-300 shrink-0 overflow-hidden flex items-center justify-center font-semibold text-gray-600">
            {userName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="truncate">
            {userName ?? userEmail ?? 'User'}
          </span>
        </button>
      ) : (
        <div className="flex justify-center px-3 py-4 border-t border-gray-100">
          <button onClick={() => setOpen(true)} className="p-1 rounded hover:bg-gray-100">
            <Menu size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
