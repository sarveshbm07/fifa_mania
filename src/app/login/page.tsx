'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const [isSignUp, setIsSignUp] = useState(false)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  
  const [errorMsg, setErrorMsg] = useState('')
  const [isValidRoll, setIsValidRoll] = useState(true) // default true for Sign In
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
        if (!isValidRoll) {
          setErrorMsg('Invalid Roll Number')
          setIsLoading(false)
          return
        }
        
        // Save metadata to localStorage so /auth/confirm can use it
        localStorage.setItem('temp_roll_number', rollNumber.trim().toUpperCase())
        localStorage.setItem('temp_full_name', fullName.trim())
        
        const { error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) {
          setErrorMsg(error.message)
          setIsLoading(false)
        } else {
          // Redirect to confirm which handles database user creation
          router.push('/auth/confirm')
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          setErrorMsg(error.message)
          setIsLoading(false)
        } else {
          router.push('/auth/confirm')
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An error occurred')
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setErrorMsg('')
    setIsValidRoll(true)
    // Clear fields that don't apply
    if (!isSignUp) {
      // Switching TO Sign Up
      if (rollNumber) handleRollChange(rollNumber)
      else setIsValidRoll(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to FIFA MANIA</h2>
          <p className="text-gray-500 font-medium">
            {isSignUp ? "Register with your SCT credentials to join the predictions." : "Sign in to your account."}
          </p>
        </div>
        
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-left">
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SCT Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => handleRollChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder-gray-400 uppercase font-semibold"
                    placeholder="e.g. SCT24EC115"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                placeholder="e.g. user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={(isSignUp && !isValidRoll) || isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-sky-300 rounded-xl shadow-sm bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
            >
              {isLoading ? (
                "Processing..."
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-medium">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={toggleMode}
                className="ml-1 text-sky-600 hover:text-sky-500 font-bold outline-none"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
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
