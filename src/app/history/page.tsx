import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { isAdmin } from '@/lib/admins'

export const revalidate = 0 // Always fetch fresh data so history updates instantly
export const dynamic = 'force-dynamic' // Bypass all caches

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (isAdmin(user.email)) {
    redirect('/admin')
  }

  // Fetch user's predictions with related question and match details
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id,
      answer,
      is_correct,
      points_earned,
      created_at,
      questions (
        question_text,
        is_closed,
        closes_at,
        matches (
          team1,
          team2
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!predictions || predictions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">No Predictions Yet</h2>
        <p className="text-gray-500">Head over to the dashboard to make your first prediction!</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Prediction History</h1>
          <p className="text-gray-500 mt-2">Review your past predictions and earned points.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Match</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Question</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Your Answer</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {predictions.map((pred: any) => {
              const question = pred.questions
              const match = question?.matches
              
              return (
                <tr key={pred.id} className="hover:bg-sky-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{match?.team1} vs {match?.team2}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {question?.question_text}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {pred.answer}
                  </td>
                  <td className="px-6 py-4">
                    {pred.is_correct === true && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Correct
                      </span>
                    )}
                    {pred.is_correct === false && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <XCircle className="w-4 h-4 mr-1" />
                        Incorrect
                      </span>
                    )}
                    {pred.is_correct === null && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-black text-lg ${pred.points_earned > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      +{pred.points_earned || 0}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
