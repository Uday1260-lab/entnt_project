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
    const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!res.ok) throw new Error((await res.json()).message || 'Login failed')
    const u = await res.json()
    setUser(u)
    return u
  }
  const register = async (data) => {
    const res = await fetch('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error((await res.json()).message || 'Register failed')
    const u = await res.json()
    setUser(u)
    return u
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
