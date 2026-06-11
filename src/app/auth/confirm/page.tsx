'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'
import { isAdmin } from '@/lib/admins'
import { getSystemLockStatus } from '@/lib/settings'

function AuthConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [statusText, setStatusText] = useState('Verifying your credentials...')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const checkAndRegisterUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }

        const isUserAdmin = isAdmin(user.email)

        const next = searchParams.get('next') ?? (isUserAdmin ? '/admin' : '/dashboard')

        // If system is locked and user is not admin, block sign in
        if (!isUserAdmin) {
          const isLocked = await getSystemLockStatus(supabase)
          if (isLocked) {
            setErrorMsg('Predictions are closed for today.')
            await supabase.auth.signOut()
            return
          }
        }

        // Check if user already exists in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (existingUser) {
          // User already exists, redirect to next
          setStatusText('Redirecting to dashboard...')
          router.replace(next)
          return
        }

        // New user! Get roll number from localStorage
        setStatusText(isUserAdmin ? 'Registering administrator account...' : 'Registering your SCT account...')
        let rollNumber = localStorage.getItem('temp_roll_number')
        if (isUserAdmin && !rollNumber) {
          rollNumber = `ADMIN-${user.email?.split('@')[0].toUpperCase() || 'USER'}`
        }

        if (!rollNumber) {
          setErrorMsg('Registration session expired. Please go back to login and re-enter your roll number.')
          await supabase.auth.signOut()
          return
        }

        // Insert new user record
        const tempFullName = localStorage.getItem('temp_full_name')
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            roll_number: rollNumber,
            display_name: tempFullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            points: 0
          })

        if (insertError) {
          console.error(insertError)
          setErrorMsg(insertError.message || 'Failed to create user profile. Please try again.')
          await supabase.auth.signOut()
          return
        }

        // Clean up
        localStorage.removeItem('temp_roll_number')
        localStorage.removeItem('temp_full_name')
        setStatusText('Registration successful! Redirecting...')
        router.replace(next)
      } catch (err: any) {
        console.error(err)
        setErrorMsg('An unexpected error occurred during confirmation.')
      }
    }

    checkAndRegisterUser()
  }, [supabase, router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl space-y-6">
        {errorMsg ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
            <p className="text-gray-500 font-medium">{errorMsg}</p>
            <button
              onClick={() => router.replace('/login')}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">Setting up your profile</h2>
            <p className="text-gray-500 font-medium">{statusText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">Setting up your profile</h2>
            <p className="text-gray-500 font-medium">Verifying your credentials...</p>
          </div>
        </div>
      </div>
    }>
      <AuthConfirmContent />
    </Suspense>
  )
}
