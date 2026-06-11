'use client'

import { useState } from 'react'
import { CalendarClock, CheckCircle2, PlayCircle, Trophy, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import StandingsTable from '@/components/StandingsTable'
import { getOrCreateMatchFromFixture } from '@/app/admin/actions'
import { useRouter } from 'next/navigation'

export default function FixturesClient({ 
  fixtures, 
  standings, 
  isAdmin = false 
}: { 
  fixtures: any[]
  standings: any[]
  isAdmin?: boolean 
}) {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings'>('fixtures')
  const router = useRouter()
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null)

  // Group fixtures by status
  const upcoming = fixtures.filter((f: any) => f.fixture.status.short === 'NS')
  const live = fixtures.filter((f: any) => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.fixture.status.short))
  const completed = fixtures.filter((f: any) => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))

  const handleCreateQuestionForFixture = async (match: any) => {
    setLoadingMatchId(match.fixture.id)
    const res = await getOrCreateMatchFromFixture({
      team1: match.teams.home.name,
      team2: match.teams.away.name,
      match_date: match.fixture.date
    })
    setLoadingMatchId(null)

    if (res.error) {
      alert(res.error)
    } else if (res.matchId) {
      router.push(`/admin?matchId=${res.matchId}&tab=matches`)
    }
  }

  const renderMatchCard = (match: any, status: 'upcoming' | 'live' | 'completed') => (
    <div key={match.fixture.id} className="bg-white hover:bg-gray-50 transition-colors rounded-xl p-5 border border-gray-200 flex flex-col items-center justify-center shadow-sm hover:shadow-md group cursor-pointer relative overflow-hidden">
      
      {/* Date/Time or Status pill at the very top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center w-full">
        {status === 'upcoming' ? (
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{format(new Date(match.fixture.date), 'MMM d, HH:mm')}</span>
        ) : status === 'live' ? (
          <span className="text-[11px] font-bold text-red-600 uppercase flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse mr-1.5"></span>
            LIVE {match.fixture.status.elapsed}'
          </span>
        ) : (
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">FT</span>
        )}
      </div>

      <div className="flex items-center justify-between w-full mt-6 mb-3">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-[60px] h-[60px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center p-2.5 mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <span className="text-sm font-bold text-gray-900 text-center leading-tight h-8 flex items-center justify-center line-clamp-2">
            {match.teams.home.name}
          </span>
        </div>

        {/* Center VS or Score */}
        <div className="flex flex-col items-center justify-center px-2 w-[60px]">
          {status === 'upcoming' ? (
            <span className="text-gray-400 font-black text-sm italic tracking-widest mt-[-10px]">VS</span>
          ) : (
            <div className="text-2xl font-black text-gray-900 mt-[-10px] tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
              {match.goals.home ?? 0} - {match.goals.away ?? 0}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-[60px] h-[60px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center p-2.5 mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <span className="text-sm font-bold text-gray-900 text-center leading-tight h-8 flex items-center justify-center line-clamp-2">
            {match.teams.away.name}
          </span>
        </div>
      </div>

      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCreateQuestionForFixture(match)
          }}
          disabled={loadingMatchId === match.fixture.id}
          className="mt-3 w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer z-10"
        >
          {loadingMatchId === match.fixture.id ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              <span>Creating...</span>
            </>
          ) : (
            <span>Create Question</span>
          )}
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
              activeTab === 'fixtures' 
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Match Fixtures
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
              activeTab === 'standings' 
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Group Standings
          </button>
        </div>
      </div>

      {activeTab === 'fixtures' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {live.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <PlayCircle className="text-red-500 w-6 h-6" />
                <h2 className="text-2xl font-extrabold text-gray-900">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {live.map(match => renderMatchCard(match, 'live'))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <CalendarClock className="text-sky-500 w-6 h-6" />
                <h2 className="text-2xl font-extrabold text-gray-900">Upcoming Matches</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {upcoming.map(match => renderMatchCard(match, 'upcoming'))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <CheckCircle2 className="text-gray-400 w-6 h-6" />
                <h2 className="text-2xl font-extrabold text-gray-900">Completed Matches</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {completed.map(match => renderMatchCard(match, 'completed'))}
              </div>
            </section>
          )}

          {fixtures.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 font-medium text-lg">No fixtures available for the selected tournament.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StandingsTable standings={standings} />
        </div>
      )}
    </div>
  )
}

