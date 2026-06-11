'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { CheckCircle2, Lock, Send, Clock } from 'lucide-react'

export default function DashboardClient({ initialMatches, predictedQuestionIds, userId }: { initialMatches: any[], predictedQuestionIds: Set<string>, userId: string }) {
  const [matches] = useState(initialMatches)
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(predictedQuestionIds)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleSubmitPrediction = async (e: React.FormEvent<HTMLFormElement>, questionId: string) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const answer = (formData.get('answer') as string || '').trim()

    if (!answer) return

    setLoadingIds(prev => new Set(prev).add(questionId))

    try {
      const { error } = await supabase
        .from('predictions')
        .insert({
          user_id: userId,
          question_id: questionId,
          answer: answer,
          submitted_at: new Date().toISOString()
        })

      if (error) throw error

      setSubmittedIds(prev => new Set(prev).add(questionId))
    } catch (error) {
      console.error('Error submitting prediction:', error)
      alert('Failed to submit prediction. Please try again.')
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  if (matches.length === 0 || matches.every(m => !m.questions || m.questions.length === 0)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg font-medium">No upcoming matches at the moment. Check back later!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {matches.map((match) => {
        if (!match.questions || match.questions.length === 0) return null

        return (
          <div key={match.id} className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden">
            {/* Match Header */}
            <div className="bg-gradient-to-r from-[#9FB3DF]/30 via-[#9EC6F3]/30 to-[#BDDDE4]/30 px-6 py-4 border-b border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center border border-white/80 shadow-sm font-bold text-[#1e293b] text-xs">
                    {match.team1 ? match.team1.substring(0, 3).toUpperCase() : 'T1'}
                  </div>
                </div>
                <div className="text-center">
                  <span className="font-extrabold text-[#1e293b] text-lg">{match.team1 || 'TBD'}</span>
                </div>
                <div className="px-3 py-1 bg-[#9FB3DF]/20 rounded-full font-black text-[#1e293b]/60 text-sm">VS</div>
                <div className="text-center">
                  <span className="font-extrabold text-[#1e293b] text-lg">{match.team2 || 'TBD'}</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center border border-white/80 shadow-sm font-bold text-[#1e293b] text-xs">
                    {match.team2 ? match.team2.substring(0, 3).toUpperCase() : 'T2'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-[#1e293b]/60 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(match.match_date), 'PPp')}</span>
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y divide-white/40 px-6 py-2">
              <h4 className="text-xs font-bold text-[#1e293b]/50 uppercase tracking-widest py-3">Prediction Questions</h4>
              {match.questions.map((question: any) => {
                const isSubmitted = submittedIds.has(question.id)
                const isExpired = new Date(question.closes_at) < new Date()
                const isClosed = question.is_closed || isExpired

                return (
                  <form
                    key={question.id}
                    onSubmit={(e) => handleSubmitPrediction(e, question.id)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1e293b] text-sm leading-snug">{question.question_text}</p>
                      <p className={`text-xs mt-1 font-medium ${isClosed ? 'text-red-500' : 'text-sky-600'}`}>
                        {isClosed
                          ? '🔒 Predictions Closed'
                          : `⏰ Closes: ${format(new Date(question.closes_at), 'PPp')}`}
                      </p>
                      {question.points_value && (
                        <p className="text-xs text-amber-600 font-bold mt-0.5">🏆 {question.points_value} pts</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSubmitted ? (
                        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2 text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submitted ✓</span>
                        </div>
                      ) : isClosed ? (
                        <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 text-sm font-bold">
                          <Lock className="w-4 h-4" />
                          <span>Closed</span>
                        </div>
                      ) : (
                        <>
                          {!question.options || question.options.length === 0 ? (
                            <input
                              type="text"
                              name="answer"
                              placeholder="Your prediction..."
                              required
                              className="bg-white border border-[#9FB3DF]/40 text-[#1e293b] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#9FB3DF] focus:border-[#9FB3DF] focus:outline-none shadow-sm min-w-[180px]"
                            />
                          ) : (
                            <select
                              name="answer"
                              required
                              className="bg-white border border-[#9FB3DF]/40 text-[#1e293b] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#9FB3DF] focus:border-[#9FB3DF] cursor-pointer shadow-sm"
                            >
                              <option value="">Select option...</option>
                              {question.options?.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          <button
                            type="submit"
                            disabled={loadingIds.has(question.id)}
                            className="flex items-center space-x-1.5 bg-[#9FB3DF] hover:bg-[#8fa3cf] text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{loadingIds.has(question.id) ? 'Submitting...' : 'Submit'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
