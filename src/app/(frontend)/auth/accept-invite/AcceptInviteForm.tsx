'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/ui/base/Button'
import TextInput from '@/ui/base/TextInput'
import { loginAndAcceptInvite, signupAndAcceptInvite } from '../actions'

export default function AcceptInviteForm({
  token,
  inviteEmail,
}: {
  token: string
  inviteEmail: string
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.target as HTMLFormElement)
    const action = mode === 'login' ? loginAndAcceptInvite : signupAndAcceptInvite
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
        <input type="hidden" name="token" value={token} />
        {mode === 'signup' && (
          <TextInput name="name" type="text" placeholder="Name" />
        )}
        <TextInput name="email" type="email" placeholder="Email" defaultValue={inviteEmail} />
        <TextInput name="password" type="password" placeholder="Password" />
        <Button type="submit" disabled={loading}>
          {loading ? 'Joining…' : mode === 'login' ? 'Log in and join' : 'Create account and join'}
        </Button>
      </form>

      <p>
        {mode === 'login' ? (
          <>
            New to Dive?{' '}
            <button className="underline" onClick={() => setMode('signup')}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button className="underline" onClick={() => setMode('login')}>
              Log in
            </button>
          </>
        )}
      </p>

      {error && (
        <div className="fixed bottom-10 right-10 bg-[#f2f2f2] flex items-center gap-3 px-6 py-3 shadow-lg z-50">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <X size={12} />
          </button>
        </div>
      )}
    </>
  )
}
