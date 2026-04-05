import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import Smooth from '@/components/Smooth'
import Sidebar from '@/ui/dive/Sidebar'
import { createClient } from '@/utils/supabase/server'

export default async function DiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <Smooth>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          userName={user?.user_metadata?.name}
          userEmail={user?.email}
        />
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
      </div>
    </Smooth>
  )
}
