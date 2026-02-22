import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeHero from '@/components/home/Home-hero'
import PageLayout from '@/components/page-layout'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <PageLayout>
      <HomeHero />
    </PageLayout>
  )
}