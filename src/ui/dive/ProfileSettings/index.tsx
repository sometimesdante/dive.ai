'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/ui/dive/Topbar'
import TextInput from '@/ui/base/TextInput'
import { updateProfile } from '@/app/(dive)/profile/actions'

type Profile = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
}

export default function ProfileSettings({ profile }: { profile: Profile | null }) {
  const router  = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await updateProfile(new FormData(e.currentTarget))
    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <h1 className="font-semibold text-sm">Profile</h1>
      </Topbar>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
            <p className="text-sm text-gray-700">{profile?.email ?? '—'}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
            <TextInput id="name" name="name" defaultValue={profile?.name ?? ''} placeholder="Your name" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
            <TextInput id="phone" name="phone" defaultValue={profile?.phone ?? ''} placeholder="Phone number" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</label>
            <TextInput id="address" name="address" defaultValue={profile?.address ?? ''} placeholder="Address" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#00C49A] text-white text-sm font-medium rounded hover:bg-[#00a882] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
