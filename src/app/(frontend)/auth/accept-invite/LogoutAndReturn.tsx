'use client'

import { logout } from '../actions'

export default function LogoutAndReturn() {
  return (
    <button
      onClick={() => logout()}
      className="flex items-center justify-center bg-[#242424] h-8 rounded text-[#d3d3d3] text-sm cursor-pointer w-full"
    >
      Log out
    </button>
  )
}
