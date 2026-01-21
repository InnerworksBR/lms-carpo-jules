import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import Cookies from 'js-cookie'
import { api } from '../lib/axios'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STUDENT'
}

interface AuthContextType {
  user: User | null
  signIn: (token: string, user: User) => void
  signOut: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const token = Cookies.get('lms-token')

      if (token) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          Cookies.remove('lms-token')
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    loadUser()
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
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
