import { fetchWorldCupFixtures, fetchWorldCupStandings } from '@/utils/football-api'
import FixturesClient from './FixturesClient'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/admins'

export const revalidate = 60 // Revalidate every 60 seconds

export default async function FixturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userIsAdmin = user ? isAdmin(user.email) : false

  const fixtures = await fetchWorldCupFixtures()
  const standings = await fetchWorldCupStandings()

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">FIFA World Cup 2026</h1>
        <p className="text-gray-400">Live scores, match schedules, and group standings.</p>
      </div>

      <FixturesClient fixtures={fixtures || []} standings={standings || []} isAdmin={userIsAdmin} />
    </div>
  )
}
