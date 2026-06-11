'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Calendar, History, Medal, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { isAdmin } from '@/lib/admins'

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const isAdminUser = isAdmin(user?.email)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Trophy, show: !!user && !isAdminUser },
    { name: 'Fixtures', href: '/fixtures', icon: Calendar, show: true },
    { name: 'History', href: '/history', icon: History, show: !!user && !isAdminUser },
    { name: 'Leaderboard', href: '/leaderboard', icon: Medal, show: true },
    { name: 'Prizes', href: '/prizes', icon: Trophy, show: true },
    { name: 'Admin', href: '/admin', icon: Settings, show: isAdminUser },
  ]

  return (
    <div className="fixed top-0 left-0 w-full z-50 pt-6 px-4 pointer-events-none">
      <nav className="w-full max-w-7xl mx-auto bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-gray-900 rounded-full pointer-events-auto transition-all duration-500 hover:bg-white/90">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <div className="flex items-center overflow-x-auto no-scrollbar">
            <Link href="/" className="flex-shrink-0 flex items-center mr-4">
              <span className="font-black text-xl lg:text-2xl tracking-tighter text-sky-600">FIFA MANIA</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-2">
              {navItems.filter(item => item.show).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      pathname === item.href
                        ? 'bg-sky-50 text-sky-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0 ml-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="hidden lg:block text-sm font-medium text-gray-600 truncate max-w-[200px]">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-full text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === item.href
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
            
            {user ? (
              <button
                onClick={() => {
                  handleSignOut()
                  setIsOpen(false)
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700 hover:text-red-300"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </div>
              </button>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-green-400 hover:bg-gray-700 hover:text-green-300"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      </nav>
    </div>
  )
}
