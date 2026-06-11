'use server'

import { createClient } from '@/utils/supabase/server'
import { fetchWorldCupFixtures } from '@/utils/football-api'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/admins'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', isAuthorized: false }
  
  if (!isAdmin(user.email)) return { error: 'Not authorized', isAuthorized: false }
  return { isAuthorized: true, user }
}

export async function syncFixtures() {
  const supabase = await createClient()
  
  // Verify Admin
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  const fixtures = await fetchWorldCupFixtures()
  if (!fixtures || fixtures.length === 0) return { error: 'No fixtures found from API' }

  let count = 0
  for (const f of fixtures) {
    const statusShort = f.fixture.status.short
    let status = 'upcoming'
    if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(statusShort)) status = 'active'
    if (['FT', 'AET', 'PEN'].includes(statusShort)) status = 'completed'

    const { error } = await supabase
      .from('matches')
      .upsert({
        team1: f.teams.home.name,
        team2: f.teams.away.name,
        match_date: f.fixture.date,
        status: status,
        result_entered: false
      }, { onConflict: 'team1,team2,match_date' }) // Upsert based on match uniqueness
      
    if (!error) count++
  }

  revalidatePath('/admin')
  return { success: `Synced ${count} fixtures successfully` }
}

export async function createMatch(team1: string, team2: string, matchDate: string) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  const { error } = await supabase
    .from('matches')
    .insert({
      team1: team1.trim(),
      team2: team2.trim(),
      match_date: matchDate,
      status: 'upcoming',
      result_entered: false
    })

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: 'Match created successfully.' }
}

export async function deleteMatch(matchId: string) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  // Delete associated predictions first
  const { data: questions } = await supabase.from('questions').select('id').eq('match_id', matchId)
  if (questions) {
    for (const q of questions) {
      await supabase.from('predictions').delete().eq('question_id', q.id)
    }
  }

  // Delete questions
  await supabase.from('questions').delete().eq('match_id', matchId)

  // Delete match
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: 'Match and its questions deleted successfully.' }
}

export async function createQuestion(
  matchId: string, 
  questionText: string, 
  options: string[] | null, 
  pointsValue: number, 
  closesAt: string
) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  if (!questionText || !questionText.trim()) return { error: 'Question text is required.' }
  if (!matchId) return { error: 'A match must be selected.' }
  if (!closesAt) return { error: 'Closing date is required.' }

  const { error } = await supabase
    .from('questions')
    .insert({
      match_id: matchId,
      question_text: questionText.trim(),
      options: options && options.length > 0 ? options : [],
      points_value: pointsValue,
      closes_at: closesAt,
      is_published: false,
      is_closed: false
    })

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: 'Question created successfully.' }
}

export async function publishQuestions(matchId: string) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  // Enforce workflow: Check if the PREVIOUS match's result has been entered before publishing new questions.
  const { data: allMatches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  if (matchesError || !allMatches) {
    return { error: 'Failed to retrieve matches for workflow verification.' }
  }

  const currentMatchIndex = allMatches.findIndex(m => m.id === matchId)
  if (currentMatchIndex > 0) {
    // Check previous matches
    for (let i = 0; i < currentMatchIndex; i++) {
      const prevMatch = allMatches[i]
      
      // Check if previous match has any questions
      const { data: qCount } = await supabase
        .from('questions')
        .select('id')
        .eq('match_id', prevMatch.id)
        .eq('is_published', true)
        .limit(1)

      if (qCount && qCount.length > 0 && !prevMatch.result_entered) {
        return { 
          error: `Enter result for the previous match (${prevMatch.team1} vs ${prevMatch.team2}) before publishing new questions.` 
        }
      }
    }
  }

  // Publish all questions for this match
  const { error } = await supabase
    .from('questions')
    .update({ is_published: true })
    .eq('match_id', matchId)

  if (error) return { error: error.message }

  // Update match status to active if it was upcoming
  await supabase
    .from('matches')
    .update({ status: 'active' })
    .eq('id', matchId)
    .eq('status', 'upcoming')
  
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: 'Questions published successfully!' }
}

export async function closeQuestion(questionId: string) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  const { error } = await supabase
    .from('questions')
    .update({ is_closed: true })
    .eq('id', questionId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: 'Question closed successfully.' }
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  // Delete predictions first
  await supabase.from('predictions').delete().eq('question_id', questionId)

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: 'Question deleted successfully.' }
}

export async function scoreMatchQuestions(matchId: string, questionAnswers: { questionId: string, correctAnswer: string }[]) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  // 1. Update questions.correct_answer for all questions in the match
  for (const qa of questionAnswers) {
    const { error: updateError } = await supabase
      .from('questions')
      .update({ correct_answer: (qa.correctAnswer || '').trim(), is_closed: true })
      .eq('id', qa.questionId)
    
    if (updateError) return { error: `Failed to update question: ${updateError.message}` }
  }

  // 2. Fetch all questions for this match
  const { data: questions, error: fetchQError } = await supabase
    .from('questions')
    .select('*')
    .eq('match_id', matchId)

  if (fetchQError || !questions) return { error: 'Failed to fetch match questions' }

  // 3. Score predictions using the exact calculatePoints logic
  for (const question of questions) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('question_id', question.id)
    
    if (!predictions) continue

    for (const prediction of predictions) {
      // Robust space, hyphen, accent, and case-insensitive comparison
      const normalize = (ans: string | null | undefined): string => {
        if (!ans) return ''
        return ans
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // strip diacritics
          .trim()
          .toLowerCase()
          .replace(/[\u2010-\u2015\:\/]/g, '-') // standardize dashes/colons/slashes to hyphen
          .replace(/\s*-\s*/g, '-')             // remove spacing around dashes
          .replace(/\s+/g, ' ')                 // collapse multiple spaces to a single space
      }

      const cleanPrediction = normalize(prediction.answer)
      const cleanCorrect = normalize(question.correct_answer)

      const isCorrect = cleanCorrect !== '' && cleanPrediction === cleanCorrect
      const pointsEarned = isCorrect ? (question.points_value || 10) : 0
      
      // Update prediction record
      await supabase
        .from('predictions')
        .update({
          is_correct: isCorrect,
          points_earned: pointsEarned
        })
        .eq('id', prediction.id)
      
      // Add to user's total points using RPC increment (bypasses RLS)
      if (isCorrect && pointsEarned > 0) {
        const { error: rpcError } = await supabase.rpc('increment_user_points', {
          user_id: prediction.user_id,
          points: pointsEarned
        })
        if (rpcError) {
          console.error(`Failed to increment points for user ${prediction.user_id}:`, rpcError)
        }
      }
    }
  }
  
  // 4. Mark match as completed
  const { error: updateMatchError } = await supabase
    .from('matches')
    .update({
      result_entered: true,
      status: 'completed'
    })
    .eq('id', matchId)

  if (updateMatchError) return { error: `Failed to update match: ${updateMatchError.message}` }

  // Purge the entire application cache (both server and client router cache)
  // This ensures that when the admin navigates to the leaderboard, they see the fresh data instantly
  revalidatePath('/', 'layout')
  
  return { success: 'Match scored successfully and points awarded!' }
}

import { getSystemLockStatus, setSystemLockStatus } from '@/lib/settings'

export async function getLockStatusAction() {
  const supabase = await createClient()
  return await getSystemLockStatus(supabase)
}

export async function toggleLockStatusAction(locked: boolean) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  const res = await setSystemLockStatus(supabase, locked)
  if (res.error) {
    return { error: res.error }
  }
  
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/login')
  return { success: `System ${locked ? 'locked' : 'unlocked'} successfully.` }
}

export async function getOrCreateMatchFromFixture(fixture: {
  team1: string
  team2: string
  match_date: string
}) {
  const supabase = await createClient()
  
  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  // Check if match already exists
  const { data: existingMatch } = await supabase
    .from('matches')
    .select('id')
    .eq('team1', fixture.team1.trim())
    .eq('team2', fixture.team2.trim())
    .eq('match_date', fixture.match_date)
    .maybeSingle()

  if (existingMatch) {
    return { matchId: existingMatch.id }
  }

  // Otherwise create it
  const { data: newMatch, error } = await supabase
    .from('matches')
    .insert({
      team1: fixture.team1.trim(),
      team2: fixture.team2.trim(),
      match_date: fixture.match_date,
      status: 'upcoming',
      result_entered: false
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { matchId: newMatch.id }
}

export async function updateMatchTeams(
  matchId: string,
  team1?: string,
  team2?: string
) {
  const supabase = await createClient()

  const adminVerify = await verifyAdmin()
  if (!adminVerify.isAuthorized) return { error: adminVerify.error }

  if (!matchId) return { error: 'Match ID is required.' }
  if (!team1 && !team2) return { error: 'At least one team name must be provided.' }

  const updates: Record<string, string> = {}
  if (team1 && team1.trim()) updates.team1 = team1.trim()
  if (team2 && team2.trim()) updates.team2 = team2.trim()

  const { error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/fixtures')
  return { success: 'Team names updated successfully.' }
}
