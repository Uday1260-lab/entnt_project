import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

async function getMe(){
  try {
    const res = await fetch('/me')
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then(u => { setUser(u); setLoading(false) })
  }, [])

  const login = async (email, password) => {
    try {
      const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json()
          throw new Error(errorData.message || 'Login failed')
        } else {
          throw new Error('Server error. Please check if the application is running correctly.')
        }
      }
      const u = await res.json()
      setUser(u)
      return u
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your connection.')
      }
      throw error
    }
  }
  const register = async (data) => {
    try {
      const res = await fetch('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json()
          throw new Error(errorData.message || 'Register failed')
        } else {
          throw new Error('Server error. Please check if the application is running correctly.')
        }
      }
      const u = await res.json()
      setUser(u)
      return u
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your connection.')
      }
      throw error
    }
  }
  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value = { user, loading, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}
