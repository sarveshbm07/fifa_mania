import { createClient } from '@/utils/supabase/server'
import { Trophy, Medal, Crown } from 'lucide-react'
import { isAdmin } from '@/lib/admins'

export const revalidate = 0 // Always fetch fresh data for instant leaderboard updates
export const dynamic = 'force-dynamic' // Bypass all caches

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch all users ordered by points
  const { data: rawUsers } = await supabase
    .from('users')
    .select('id, roll_number, points, joined_at, email')
    .order('points', { ascending: false })

  const users = rawUsers?.filter(u => {
    // Exclude hardcoded admins
    if (isAdmin(u.email)) return false
    // Exclude ADMIN- prefixes
    if (u.roll_number?.toUpperCase().startsWith('ADMIN-')) return false
    // Exclude specific requested user accounts
    const rollUpper = (u.roll_number || '').trim().toUpperCase()
    if (rollUpper === 'GUEST-4666' || rollUpper === 'SIYA') return false
    return true
  }).slice(0, 100) || []

  if (!users || users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-32 bg-white/50 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-500 to-gray-800">No Participants Yet</h2>
        <p className="text-gray-500">Be the first to make a prediction and claim the top spot!</p>
      </div>
    )
  }

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-sky-200/50 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="text-center space-y-4 relative z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-500">
          Global Leaderboard
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
          Only the best predictors win prizes. Where do you stand?
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12 pb-8">
        {[top3[1], top3[0], top3[2]].map((profile, i) => {
          if (!profile) return <div key={i} className="hidden md:block"></div>
          
          const isFirst = profile.id === top3[0]?.id
          const isSecond = profile.id === top3[1]?.id
          const isThird = profile.id === top3[2]?.id
          
          let heightClass = isFirst ? 'h-72 md:h-80' : isSecond ? 'h-64 md:h-72' : 'h-56 md:h-64'
          let borderColors = isFirst ? 'from-yellow-400 to-amber-600' : isSecond ? 'from-gray-300 to-gray-500' : 'from-amber-600 to-amber-800'
          let glowColors = isFirst ? 'bg-yellow-100' : isSecond ? 'bg-gray-100' : 'bg-amber-100'
          let rankLabel = isFirst ? '1st Place' : isSecond ? '2nd Place' : '3rd Place'
          
          return (
            <div key={profile.id} className={`relative flex flex-col items-center justify-end ${isFirst ? 'order-1 md:order-2 z-10 scale-105' : isSecond ? 'order-2 md:order-1' : 'order-3 md:order-3'}`}>
              {isFirst && <Crown className="w-12 h-12 text-yellow-500 absolute -top-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse" />}
              
              <div className="relative mb-6">
                <div className={`absolute inset-0 rounded-full blur-md ${glowColors}`} />
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center font-black text-xl z-10 shadow-xl text-gray-900 bg-white`} style={{ backgroundImage: `linear-gradient(white, white), linear-gradient(to right, ${isFirst ? '#facc15, #d97706' : isSecond ? '#d1d5db, #6b7280' : '#d97706, #92400e'})`, backgroundOrigin: 'border-box', border: '4px solid transparent' }}>
                  {profile.roll_number.substring(0, 5).toUpperCase()}
                </div>
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-20 shadow-lg text-white bg-gradient-to-br ${borderColors}`}>
                  {isFirst ? '1' : isSecond ? '2' : '3'}
                </div>
              </div>

              <div className={`w-full ${heightClass} rounded-t-3xl relative overflow-hidden flex flex-col items-center pt-8 px-4 border border-gray-200 shadow-md`} style={{ background: `linear-gradient(to bottom, #ffffff, #f8fafc)` }}>
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${borderColors}`} />
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-b ${borderColors}`} />
                
                <h3 className="font-extrabold text-lg text-gray-900 truncate w-full text-center mb-1 relative z-10 uppercase">{profile.roll_number}</h3>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 relative z-10 bg-clip-text text-transparent bg-gradient-to-r ${borderColors}`}>{rankLabel}</p>
                <div className="mt-auto pb-8 text-center relative z-10">
                  <span className="text-4xl font-black text-gray-900 block">{profile.points}</span>
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Points</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rest of Leaderboard */}
      {rest.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 p-2 shadow-xl relative z-10">
          <div className="overflow-hidden rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-bold w-24 text-center rounded-tl-2xl">Rank</th>
                  <th className="px-6 py-4 font-bold">Roll Number</th>
                  <th className="px-6 py-4 font-bold text-right rounded-tr-2xl">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rest.map((profile, index) => (
                  <tr 
                    key={profile.id} 
                    className="hover:bg-sky-50 transition-colors group"
                  >
                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-gray-400 group-hover:text-sky-600 transition-colors w-8 inline-block">
                        {index + 4}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600 border border-gray-200 group-hover:border-sky-300 group-hover:bg-sky-100 transition-colors uppercase">
                          {profile.roll_number.substring(0, 3)}
                        </div>
                        <span className="font-bold text-lg text-gray-700 group-hover:text-sky-700 transition-colors uppercase">{profile.roll_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-baseline space-x-1">
                        <span className="text-2xl font-black font-mono text-gray-700 group-hover:text-sky-600 transition-colors">{profile.points}</span>
                        <span className="text-sm font-bold text-gray-400">pts</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
