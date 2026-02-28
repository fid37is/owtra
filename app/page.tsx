import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeHero from '@/components/home/Home-hero'
import PageLayout from '@/components/page-layout'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()

  // Only skip redirect for password recovery flow
  if (user && params.type !== 'recovery') {
    redirect('/dashboard')
  }

  return (
    <PageLayout>
      <HomeHero />
    </PageLayout>
  )
}