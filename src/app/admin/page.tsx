import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { isAdmin, HARDCODED_ADMINS } from '@/lib/admins'
import { getSystemLockStatus } from '@/lib/settings'
import { fetchWorldCupFixtures } from '@/utils/football-api'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const matchIdParam = typeof resolvedParams.matchId === 'string' ? resolvedParams.matchId : undefined
  const tabParam = typeof resolvedParams.tab === 'string' ? resolvedParams.tab : undefined

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  if (!isAdmin(user.email)) redirect('/dashboard')

  // Fetch lock status
  const isLocked = await getSystemLockStatus(supabase)

  // Fetch matches to manage questions
  const { data: matches } = await supabase
    .from('matches')
    .select('*, questions(*)')
    .order('match_date', { ascending: false })
    .limit(20)

  // Fetch users for user management
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('joined_at', { ascending: false })

  // Fetch all questions with match details
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*, matches(team1, team2)')
    .order('created_at', { ascending: false })

  // Fetch all predictions for stats
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')

  const apiFixtures = await fetchWorldCupFixtures() || []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 font-medium">Manage matches, prediction questions, and view stats.</p>
      </div>

      <AdminClient 
        initialMatches={matches || []} 
        apiFixtures={apiFixtures}
        users={users || []}
        admins={HARDCODED_ADMINS}
        allQuestions={allQuestions || []}
        predictions={predictions || []}
        initialLocked={isLocked}
        defaultSelectedMatchId={matchIdParam}
        defaultTab={tabParam as any}
      />
    </div>
  )
}
