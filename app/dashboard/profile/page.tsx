// app/dashboard/profile/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileSettings from '@/components/profile/profile-settings'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/dodo-types'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as unknown as Profile | null

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and job application preferences
          </p>
        </div>
        <Link
          href="/subscription"
          className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <CreditCard className="w-5 h-5" />
          Subscription
        </Link>
      </div>

      <ProfileSettings profile={profile} user={user} />
    </div>
  )
}