import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', phone: '', address: '', postalCode: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const nav = useNavigate()

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    try {
      await register({ email: form.email, phone: form.phone, address: form.address, postalCode: form.postalCode, password: form.password })
      nav('/candidate/profile', { replace: true })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded p-4 mt-8">
      <h1 className="text-xl font-semibold mb-4">Register (Candidates only)</h1>
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={form.email} onChange={e=>onChange('email', e.target.value)} type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" />
        <input value={form.phone} onChange={e=>onChange('phone', e.target.value)} required placeholder="Phone" className="w-full border rounded px-3 py-2" />
        <input value={form.address} onChange={e=>onChange('address', e.target.value)} required placeholder="Address" className="w-full border rounded px-3 py-2" />
        <input value={form.postalCode} onChange={e=>onChange('postalCode', e.target.value)} required placeholder="Postal Code" className="w-full border rounded px-3 py-2" />
        <input value={form.password} onChange={e=>onChange('password', e.target.value)} type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" />
        <input value={form.confirm} onChange={e=>onChange('confirm', e.target.value)} type="password" required placeholder="Confirm Password" className="w-full border rounded px-3 py-2" />
        <button className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Register</button>
      </form>
    </div>
  )
}
