'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { syncFixtures, createMatch, deleteMatch, createQuestion, publishQuestions, closeQuestion, deleteQuestion, scoreMatchQuestions, toggleLockStatusAction, getOrCreateMatchFromFixture, updateMatchTeams } from './actions'
import { RefreshCw, PlusCircle, Users, Database, LayoutDashboard, Trash2, Lock, Unlock, Award, Calendar, CheckSquare } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminClient({ 
  initialMatches, 
  apiFixtures = [],
  users, 
  admins, 
  allQuestions, 
  predictions,
  initialLocked,
  defaultSelectedMatchId = '',
  defaultTab = 'overview'
}: { 
  initialMatches: any[], 
  apiFixtures?: any[],
  users: any[], 
  admins: string[], 
  allQuestions: any[], 
  predictions: any[],
  initialLocked: boolean,
  defaultSelectedMatchId?: string,
  defaultTab?: 'overview' | 'matches' | 'users'
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'users'>(defaultTab)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(initialLocked)
  const [isTogglingLock, setIsTogglingLock] = useState(false)

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return 'No Date'
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return format(d, 'PPp')
    } catch (err) {
      return 'Invalid Date'
    }
  }

  const combinedMatchesForSelect = useMemo(() => {
    // 1. Database matches
    const list = initialMatches.map(m => {
      const t1 = m.team1 || 'Unknown Team 1'
      const t2 = m.team2 || 'Unknown Team 2'
      return {
        id: m.id,
        label: `${t1} vs ${t2} (${safeFormatDate(m.match_date)})`,
        match_date: m.match_date,
        isDb: true,
        original: m
      }
    })

    // 2. API fixtures that are not yet in the database matches
    apiFixtures.forEach(f => {
      if (!f || !f.fixture || !f.teams) return
      
      const matchDateUTC = f.fixture.date // UTC ISO string
      const team1 = f.teams.home?.name || 'Unknown Team 1'
      const team2 = f.teams.away?.name || 'Unknown Team 2'

      // Check if this fixture already exists in initialMatches
      const existsInDb = initialMatches.some(m => {
        const dbT1 = (m.team1 || '').trim().toLowerCase()
        const dbT2 = (m.team2 || '').trim().toLowerCase()
        const apiT1 = (team1 || '').trim().toLowerCase()
        const apiT2 = (team2 || '').trim().toLowerCase()
        
        const dbTime = m.match_date ? new Date(m.match_date).getTime() : 0
        const apiTime = matchDateUTC ? new Date(matchDateUTC).getTime() : 0
        
        return (
          dbT1 === apiT1 &&
          dbT2 === apiT2 &&
          dbTime === apiTime
        )
      })

      if (!existsInDb) {
        // Safe serialization using JSON to handle URLs with colons
        const apiId = JSON.stringify({
          type: 'api',
          team1,
          team2,
          match_date: matchDateUTC || ''
        })
        list.push({
          id: apiId,
          label: `[Fixture] ${team1} vs ${team2} (${safeFormatDate(matchDateUTC)})`,
          match_date: matchDateUTC,
          isDb: false,
          original: f
        })
      }
    })

    return list
  }, [initialMatches, apiFixtures])
  
  // Custom Match Form States
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [matchDate, setMatchDate] = useState('')

  // Question Creator Form States
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<'mcq' | 'text'>('mcq')
  const [options, setOptions] = useState(['', '', '', ''])
  const [selectedMatchId, setSelectedMatchId] = useState(defaultSelectedMatchId)
  const [closesAt, setClosesAt] = useState('')
  const [pointsValue, setPointsValue] = useState(10)

  // Unknown team name overrides
  const [unknownTeam1Name, setUnknownTeam1Name] = useState('')
  const [unknownTeam2Name, setUnknownTeam2Name] = useState('')

  // Scoring Form States
  const [scoringMatchId, setScoringMatchId] = useState<string | null>(null)
  const [scoreAnswers, setScoreAnswers] = useState<Record<string, string>>({})

  // Automatically update closesAt when selectedMatchId changes or is set initially
  useEffect(() => {
    if (selectedMatchId) {
      const match = combinedMatchesForSelect.find(m => m.id === selectedMatchId)
      if (match && match.match_date) {
        try {
          const date = new Date(match.match_date)
          const tzoffset = date.getTimezoneOffset() * 60000 
          const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16)
          setClosesAt(localISOTime)
        } catch (err) {
          console.error('Error formatting match time', err)
        }
      }
    }
  }, [selectedMatchId, combinedMatchesForSelect])

  // Calculate stats
  const totalParticipants = users.length
  
  const todayPredictionsCount = useMemo(() => {
    return predictions.filter(p => isToday(new Date(p.submitted_at || p.created_at))).length
  }, [predictions])

  const leaderboardData = useMemo(() => {
    return users
      .filter(u => {
        if (admins.includes(u.email?.toLowerCase())) return false
        if (u.roll_number?.toUpperCase().startsWith('ADMIN-')) return false
        const rollUpper = (u.roll_number || '').trim().toUpperCase()
        if (rollUpper === 'GUEST-4666' || rollUpper === 'SIYA') return false
        return true
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(u => ({
        name: u.roll_number,
        points: u.points
      }))
  }, [users, admins])

  const handleSync = async () => {
    setIsSyncing(true)
    const res = await syncFixtures()
    setIsSyncing(false)
    if (res.error) alert(res.error)
    else alert(res.success)
  }

  const handleToggleLock = async () => {
    if (!confirm(`Are you sure you want to ${isLocked ? 'UNLOCK' : 'FORCE LOCK'} the entire system?`)) return
    setIsTogglingLock(true)
    const res = await toggleLockStatusAction(!isLocked)
    setIsTogglingLock(false)
    if (res.error) {
      alert(res.error)
    } else {
      setIsLocked(!isLocked)
      alert(res.success)
    }
  }

  const handleCreateMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const res = await createMatch(team1, team2, matchDate)
    setIsLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      alert(res.success)
      setTeam1('')
      setTeam2('')
      setMatchDate('')
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This will also delete all questions and predictions for it.')) return
    setIsLoading(true)
    const res = await deleteMatch(matchId)
    setIsLoading(false)
    if (res.error) alert(res.error)
    else alert(res.success)
  }

  const handleCreateQuestionCentral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedMatchId) {
      alert('Please select a match.')
      setIsLoading(false)
      return
    }

    if (!closesAt) {
      alert('Please set a closing date and time.')
      setIsLoading(false)
      return
    }

    let filteredOptions: string[] | null = null
    if (questionType === 'mcq') {
      const cleaned = options.map(o => o.trim()).filter(Boolean)
      if (cleaned.length < 2) {
        alert('Please provide at least 2 options.')
        setIsLoading(false)
        return
      }
      filteredOptions = cleaned
    }

    let dbMatchId = selectedMatchId
    if (selectedMatchId.startsWith('{')) {
      try {
        const parsed = JSON.parse(selectedMatchId)
        if (parsed.type === 'api') {
          const resMatch = await getOrCreateMatchFromFixture({
            team1: parsed.team1,
            team2: parsed.team2,
            match_date: parsed.match_date
          })
          if (resMatch.error || !resMatch.matchId) {
            alert(resMatch.error || 'Failed to create match record.')
            setIsLoading(false)
            return
          }
          dbMatchId = resMatch.matchId
        }
      } catch (err) {
        console.error('Failed to parse selected match JSON', err)
        alert('Failed to parse selected match.')
        setIsLoading(false)
        return
      }
    }

    // If unknown team names were provided, update the match in the DB first
    if (hasAnyUnknownTeam && (unknownTeam1Name.trim() || unknownTeam2Name.trim())) {
      const updateRes = await updateMatchTeams(
        dbMatchId,
        hasUnknownTeam1 ? unknownTeam1Name.trim() : undefined,
        hasUnknownTeam2 ? unknownTeam2Name.trim() : undefined
      )
      if (updateRes.error) {
        alert(`Failed to update team names: ${updateRes.error}`)
        setIsLoading(false)
        return
      }
    }

    const utcClosesAt = new Date(closesAt).toISOString()
    const res = await createQuestion(dbMatchId, questionText, filteredOptions, pointsValue, utcClosesAt)
    setIsLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      alert(res.success)
      setQuestionText('')
      setOptions(['', '', '', ''])
      setQuestionType('mcq')
      setSelectedMatchId('')
      setClosesAt('')
      setPointsValue(10)
      setUnknownTeam1Name('')
      setUnknownTeam2Name('')
      router.refresh()
    }
  }

  const handlePublishQuestions = async (matchId: string) => {
    setIsLoading(true)
    const res = await publishQuestions(matchId)
    setIsLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      alert(res.success)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will also delete any student predictions made for it.')) return
    const res = await deleteQuestion(questionId)
    if (res.error) alert(res.error)
    else alert(res.success)
  }

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId)
    setUnknownTeam1Name('')
    setUnknownTeam2Name('')
    const match = combinedMatchesForSelect.find(m => m.id === matchId)
    if (match && match.match_date) {
      try {
        const date = new Date(match.match_date)
        const tzoffset = date.getTimezoneOffset() * 60000 
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16)
        setClosesAt(localISOTime)
      } catch (err) {
        console.error('Error formatting match time', err)
      }
    }
  }

  // Derive if the selected DB match has unknown/empty team names
  const selectedMatchData = combinedMatchesForSelect.find(m => m.id === selectedMatchId)
  const isDbMatch = selectedMatchData?.isDb === true
  const selectedOriginal = isDbMatch ? selectedMatchData?.original : null
  const hasUnknownTeam1 = isDbMatch && (!selectedOriginal?.team1 || selectedOriginal.team1.trim() === '')
  const hasUnknownTeam2 = isDbMatch && (!selectedOriginal?.team2 || selectedOriginal.team2.trim() === '')
  const hasAnyUnknownTeam = hasUnknownTeam1 || hasUnknownTeam2

  const handleOptionChange = (index: number, val: string) => {
    setOptions(prev => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  const handleStartScoring = (match: any) => {
    setScoringMatchId(match.id)
    const initialAnswers: Record<string, string> = {}
    match.questions?.forEach((q: any) => {
      initialAnswers[q.id] = q.correct_answer || ''
    })
    setScoreAnswers(initialAnswers)
  }

  const handleScoreChange = (questionId: string, value: string) => {
    setScoreAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoringMatchId) return

    const matchQuestions = allQuestions.filter(q => q.match_id === scoringMatchId)
    const answersList = matchQuestions.map(q => ({
      questionId: q.id,
      correctAnswer: scoreAnswers[q.id] || ''
    }))

    const incomplete = answersList.find(a => !a.correctAnswer)
    if (incomplete) {
      alert('Please select correct answers for all questions before submitting.')
      return
    }

    setIsLoading(true)
    const res = await scoreMatchQuestions(scoringMatchId, answersList)
    setIsLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      alert(res.success)
      setScoringMatchId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
            activeTab === 'matches' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Database className="w-5 h-5 mr-2" />
          Matches & Questions
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5 mr-2" />
          Players List
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* System Lock Banner/Controls */}
           <div className={`border rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
             isLocked 
               ? 'bg-red-50 border-red-200 text-red-900' 
               : 'bg-green-50 border-green-200 text-green-900'
           }`}>
             <div className="flex items-center space-x-4">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                 isLocked ? 'bg-red-100' : 'bg-green-100'
               }`}>
                 {isLocked ? (
                   <Lock className="w-6 h-6 text-red-600" />
                 ) : (
                   <Unlock className="w-6 h-6 text-green-600" />
                 )}
               </div>
               <div>
                 <h3 className="font-extrabold text-lg flex items-center">
                   System Status: {isLocked ? 'LOCKED' : 'ACTIVE'}
                 </h3>
                 <p className="text-sm opacity-80 font-medium">
                   {isLocked 
                     ? 'Standard players are currently blocked from logging in and viewing/making predictions.' 
                     : 'Standard players can log in, view matches, and submit predictions.'}
                 </p>
               </div>
             </div>
             <button
               onClick={handleToggleLock}
               disabled={isTogglingLock}
               className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer ${
                 isLocked 
                   ? 'bg-green-600 hover:bg-green-700 text-white' 
                   : 'bg-red-600 hover:bg-red-700 text-white'
               }`}
             >
               {isTogglingLock ? (
                 <span>Updating...</span>
               ) : (
                 <>
                   {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                   <span>{isLocked ? 'Unlock System' : 'Lock Logins & Predictions'}</span>
                 </>
               )}
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex items-center space-x-4">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <Users className="text-indigo-600 w-7 h-7" />
                 </div>
                 <div>
                   <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-1">Total Players</h3>
                   <p className="text-4xl font-black text-indigo-600">{totalParticipants}</p>
                 </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex items-center space-x-4">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <LayoutDashboard className="text-emerald-600 w-7 h-7" />
                 </div>
                 <div>
                   <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-1">Today's Predictions</h3>
                   <p className="text-4xl font-black text-emerald-600">{todayPredictionsCount}</p>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
             <h2 className="text-xl font-bold text-gray-900 mb-6">Top 10 Leaderboard (Roll Numbers)</h2>
             <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={leaderboardData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                   <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="points" fill="#818cf8" radius={[8, 8, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hardcoded Administrators</h2>
            <p className="text-gray-500 mb-6">These admin credentials are hardcoded directly in the source code file `lib/admins.ts` for security.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map(email => (
                <div key={email} className="bg-purple-50 border border-purple-100 rounded-xl p-3 font-semibold text-purple-700 shadow-sm">
                  {email}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Registered Players</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 font-semibold text-gray-600">Roll Number</th>
                    <th className="py-3 font-semibold text-gray-600">Email Address</th>
                    <th className="py-3 font-semibold text-gray-600">Points</th>
                    <th className="py-3 font-semibold text-gray-600 text-right">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-bold text-gray-900 uppercase">{u.roll_number}</td>
                      <td className="py-4 font-medium text-gray-500">{u.email}</td>
                      <td className="py-4 font-black text-indigo-600 text-lg">{u.points}</td>
                      <td className="py-4 text-right font-medium text-gray-400">
                        {format(new Date(u.joined_at), 'PPp')}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 italic">No players registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-xl">
            {/* Sync Matches */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center">
                  <RefreshCw className="text-emerald-600 w-6 h-6 mr-2" />
                  API Sync Fixtures
                </h3>
                <p className="text-gray-500 text-sm mb-4">Pull latest FIFA World Cup matches directly from the configured Football API into your local database.</p>
              </div>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Fixtures'}</span>
              </button>
            </div>
          </div>

          {/* Match Scoring modal / view overlay */}
          {scoringMatchId && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-amber-900 flex items-center">
                  <CheckSquare className="w-6 h-6 mr-2" />
                  Enter Results & Award Points
                </h3>
                <button 
                  onClick={() => setScoringMatchId(null)}
                  className="text-gray-500 hover:text-gray-700 font-bold text-sm bg-white border border-gray-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleSubmitScore} className="space-y-4">
                {allQuestions.filter(q => q.match_id === scoringMatchId).map(q => (
                  <div key={q.id} className="bg-white rounded-xl p-4 border border-amber-200">
                    <p className="font-bold text-gray-900 mb-2">{q.question_text}</p>
                    {!q.options || q.options.length === 0 ? (
                      <input
                        type="text"
                        value={scoreAnswers[q.id] || ''}
                        onChange={(e) => handleScoreChange(q.id, e.target.value)}
                        placeholder="Type correct answer..."
                        required
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none w-full"
                      />
                    ) : (
                      <select
                        value={scoreAnswers[q.id] || ''}
                        onChange={(e) => handleScoreChange(q.id, e.target.value)}
                        required
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none w-full cursor-pointer"
                      >
                        <option value="">Select correct option...</option>
                        {q.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
                
                {allQuestions.filter(q => q.match_id === scoringMatchId).length === 0 ? (
                  <p className="text-amber-800 italic text-center py-4">No questions were created for this match yet.</p>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'Calculating Points...' : 'Submit Answers & Calculate Points'}
                  </button>
                )}
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Question Form Column */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                <PlusCircle className="text-sky-600 w-6 h-6 mr-2" />
                Create Question
              </h3>
              <form onSubmit={handleCreateQuestionCentral} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Match</label>
                  <select 
                    value={selectedMatchId}
                    onChange={(e) => handleMatchSelect(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Choose a match...</option>
                    {combinedMatchesForSelect.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                 {/* Unknown team name inputs — shown only when selected DB match has empty team names */}
                 {hasAnyUnknownTeam && (
                   <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                     <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                       ⚠️ This match has unknown team name(s). Enter them below:
                     </p>
                     {hasUnknownTeam1 && (
                       <div>
                         <label className="block text-xs font-bold text-amber-800 mb-1">Home Team Name</label>
                         <input
                           type="text"
                           value={unknownTeam1Name}
                           onChange={(e) => setUnknownTeam1Name(e.target.value)}
                           placeholder="e.g. Brazil"
                           required
                           className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2 text-sm focus:border-amber-500 outline-none transition-all"
                         />
                       </div>
                     )}
                     {hasUnknownTeam2 && (
                       <div>
                         <label className="block text-xs font-bold text-amber-800 mb-1">Away Team Name</label>
                         <input
                           type="text"
                           value={unknownTeam2Name}
                           onChange={(e) => setUnknownTeam2Name(e.target.value)}
                           placeholder="e.g. Argentina"
                           required
                           className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2 text-sm focus:border-amber-500 outline-none transition-all"
                         />
                       </div>
                     )}
                     <p className="text-[11px] text-amber-600">These names will be saved to the match and shown on the dashboard.</p>
                   </div>
                 )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Question Type</label>
                  <select 
                    value={questionType}
                    onChange={(e) => {
                      setQuestionType(e.target.value as 'mcq' | 'text');
                    }}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="text">Text Input (Non-MCQ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
                  <input 
                    type="text" 
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g. Who will score the first goal?" 
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                  />
                </div>

                {questionType === 'mcq' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Options (at least 2)</label>
                    {options.map((opt, idx) => (
                      <input 
                        key={idx}
                        type="text" 
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`} 
                        required={idx < 2}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Points Value</label>
                  <input 
                    type="number"
                    value={pointsValue}
                    onChange={(e) => setPointsValue(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Closing Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer animate-pulse"
                >
                  {isLoading ? 'Creating...' : 'Create Question'}
                </button>
              </form>
            </div>

            {/* Questions/Matches Management List Column */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-gray-900">Matches & Questions Status</h3>
              <div className="space-y-4">
                {initialMatches.map((match: any) => {
                  const matchQuestions = allQuestions.filter(q => q.match_id === match.id)
                  
                  return (
                    <div key={match.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 uppercase">{match.team1} vs {match.team2}</h4>
                          <p className="text-xs text-gray-400 font-medium">
                            Match Date: {safeFormatDate(match.match_date)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                            match.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {match.status.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Match"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Display Questions for this match */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prediction Questions</p>
                        {matchQuestions.map((q: any) => {
                          const isExpired = new Date(q.closes_at) < new Date()
                          const isClosed = q.is_closed || isExpired

                          return (
                            <div key={q.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{q.question_text}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Closes: {safeFormatDate(q.closes_at)} | Value: {q.points_value || 10} Points
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    q.is_published ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {q.is_published ? 'PUBLISHED' : 'DRAFT'}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100/50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {!q.options || q.options.length === 0 ? (
                                <div className="text-xs text-gray-500 font-medium">
                                  Type: <span className="font-bold text-indigo-600">Text Input (Non-MCQ)</span>
                                  {q.correct_answer && (
                                    <span> | Correct Answer: <span className="font-bold text-emerald-600">{q.correct_answer}</span></span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                  {q.options?.map((opt: string) => (
                                    <span key={opt} className={`px-2 py-1 rounded border ${
                                      opt === q.correct_answer 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                        : 'bg-white border-gray-200 text-gray-600'
                                    }`}>
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {matchQuestions.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No questions added yet.</p>
                        )}
                      </div>

                      {/* Match action button footer */}
                      <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-gray-50">
                        {matchQuestions.length > 0 && matchQuestions.some(q => !q.is_published) && (
                          <button
                            onClick={() => handlePublishQuestions(match.id)}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Publish Questions
                          </button>
                        )}
                        {!match.result_entered && matchQuestions.length > 0 && (
                          <button
                            onClick={() => handleStartScoring(match)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Enter Match Results & Score
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
