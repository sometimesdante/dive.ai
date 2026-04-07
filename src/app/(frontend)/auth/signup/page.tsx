import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SignUpForm from './SignUpForm'

export default async function SignUpPage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return <SignUpForm />
}
