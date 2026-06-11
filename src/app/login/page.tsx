'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const [rollNumber, setRollNumber] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isValidRoll, setIsValidRoll] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorMsg(error)
    }
  }, [searchParams])

  const handleRollChange = (val: string) => {
    setRollNumber(val)
    const normalized = val.trim()
    if (!normalized) {
      setIsValidRoll(false)
      setErrorMsg('')
      return
    }

    // Regex check: prefix sct/lsct
    const regex = /^(sct|lsct).*/i
    if (!regex.test(normalized)) {
      setIsValidRoll(false)
      setErrorMsg('Only SCT/LSCT students are allowed to register. Roll number must start with SCT or LSCT.')
    } else {
      setIsValidRoll(true)
      setErrorMsg('')
    }
  }

  const handleGoogleLogin = async (isAdminFlow: boolean = false) => {
    if (!isAdminFlow && !isValidRoll) return
    setIsLoading(true)
    setErrorMsg('')
    try {
      if (isAdminFlow) {
        localStorage.setItem('temp_admin_login', 'true')
        localStorage.removeItem('temp_roll_number')
      } else {
        localStorage.setItem('temp_roll_number', rollNumber.trim().toUpperCase())
        localStorage.setItem('temp_admin_login', 'false')
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setErrorMsg(error.message)
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to FIFA MANIA</h2>
        <p className="text-gray-500 mb-8 font-medium">Please verify your SCT credentials to join the match predictions.</p>
        
        <div className="space-y-4 text-left">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Enter your SCT Roll Number</label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => handleRollChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder-gray-400 uppercase font-semibold"
              placeholder="e.g. SCT24EC115"
              required
            />
          </div>

          <button
            onClick={() => handleGoogleLogin(false)}
            disabled={!isValidRoll || isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-sky-300 rounded-xl shadow-sm bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#FFFFFF"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#FFFFFF"
                fillOpacity="0.85"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FFFFFF"
                fillOpacity="0.7"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#FFFFFF"
                fillOpacity="0.9"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Verify & Continue with Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            onClick={() => handleGoogleLogin(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 font-bold text-gray-700 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in as Administrator
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-pulse font-bold text-gray-500">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
