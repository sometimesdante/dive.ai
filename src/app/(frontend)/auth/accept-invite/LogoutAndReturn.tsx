'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '../actions'

export default function LogoutAndReturn() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const returnUrl    = `${pathname}?${searchParams.toString()}`

  async function handleLogout() {
    await logout()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center bg-[#242424] h-8 rounded text-[#d3d3d3] text-sm cursor-pointer w-full"
    >
      Log out
    </button>
  )
}
