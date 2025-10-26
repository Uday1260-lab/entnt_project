import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function Login(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/jobs', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded p-4 mt-8">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" />
        <button className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Login</button>
      </form>
      <div className="text-sm mt-3">No account? <Link to="/register" className="text-indigo-600">Register</Link></div>
    </div>
  )
}
