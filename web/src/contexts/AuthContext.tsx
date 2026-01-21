import { createContext, type ReactNode, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { api } from '../lib/api.js'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STUDENT'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (token: string, user: User) => void
  signOut: () => void
  loading: boolean
}

export const AuthContext = createContext({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    const token = Cookies.get('lms-token')

    if (token) {
      api.get('/auth/me')
        .then(response => {
          setUser(response.data)
        })
        .catch(() => {
          signOut()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  function signIn(token: string, user: User) {
    Cookies.set('lms-token', token, { expires: 7 })
    setUser(user)
  }

  function signOut() {
    Cookies.remove('lms-token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
