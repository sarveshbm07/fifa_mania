import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import ImageMorph from './ImageMorph'
import { Trophy, Medal, Target } from 'lucide-react'
import { isAdmin } from '@/lib/admins'

export const revalidate = 0 // Always fetch fresh data so points update instantly after scoring
export const dynamic = 'force-dynamic' // Bypass all caches

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile for score
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (isAdmin(user.email)) {
    redirect('/admin')
  }

  // Calculate Rank
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, points')
    .order('points', { ascending: false })

  let rank = '-'
  if (allUsers) {
    const userIndex = allUsers.findIndex(p => p.id === user.id)
    if (userIndex !== -1) {
      rank = `#${userIndex + 1}`
    }
  }

  // Fetch both 'upcoming' and 'active' matches with their published questions
  const { data: upcomingMatchesRaw } = await supabase
    .from('matches')
    .select(`
      *,
      questions (*)
    `)
    .in('status', ['upcoming', 'active'])
    .order('match_date', { ascending: true })

  const upcomingMatches = upcomingMatchesRaw?.map(match => ({
    ...match,
    questions: match.questions?.filter((q: any) => q.is_published) || []
  })) || []

  // Fetch User's existing predictions for these matches to not show them again
  const { data: userPredictions } = await supabase
    .from('predictions')
    .select('question_id')
    .eq('user_id', user.id)

  const predictedQuestionIds = new Set(userPredictions?.map(p => p.question_id) || [])

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative min-h-[80vh] p-8 rounded-[3rem] bg-[#FFF1D5] border-4 border-white shadow-2xl">
      
      {/* Decorative Vector Background Animations */}
      <ImageMorph />
      <div className="absolute top-1/2 left-1/4 -z-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 -z-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_6s_infinite]"></div>


      {/* Header section with custom gradient */}
      <div className="bg-gradient-to-r from-[#9FB3DF] via-[#9EC6F3] to-[#BDDDE4] rounded-3xl p-8 text-[#1e293b] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full -mr-20 -mt-20 transform group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {profile?.display_name || profile?.roll_number || 'Predictor'}!</h1>
          <p className="font-bold text-[#1e293b]/80 text-lg">Roll Number: {profile?.roll_number || 'Not Registered'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 flex items-center space-x-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-[#9FB3DF]/20 flex items-center justify-center rotate-3 transition-transform hover:rotate-12">
            <Trophy className="text-[#9FB3DF] w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-4xl font-black text-[#9FB3DF]">{profile?.points || 0}</p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 flex items-center space-x-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-[#9EC6F3]/20 flex items-center justify-center -rotate-3 transition-transform hover:-rotate-12">
            <Medal className="text-[#9EC6F3] w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Current Rank</p>
            <p className="text-4xl font-black text-[#9EC6F3]">{rank}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 flex items-center space-x-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-[#BDDDE4]/20 flex items-center justify-center rotate-3 transition-transform hover:rotate-12">
            <Target className="text-[#BDDDE4] w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Predictions Made</p>
            <p className="text-4xl font-black text-[#BDDDE4]">{predictedQuestionIds.size}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Upcoming Matches & Predictions</h2>
          <div className="hidden sm:block px-4 py-1.5 bg-[#9FB3DF]/20 text-[#9FB3DF] rounded-full text-sm font-bold shadow-sm border border-[#9FB3DF]/30">
            {upcomingMatches?.length || 0} Matches
          </div>
        </div>
        
        <DashboardClient 
          initialMatches={upcomingMatches || []} 
          predictedQuestionIds={predictedQuestionIds} 
          userId={user.id}
        />
      </div>
    </div>
  )
}
