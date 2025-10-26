import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminDashboard(){
  const { user } = useAuth()
  const [users, setUsers] = useState([])

  useEffect(() => {
    (async()=>{
      const res = await fetch('/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.items||[])
      }
    })()
  }, [])

  const changeRole = async (id, role) => {
    const res = await fetch(`/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (res.ok) setUsers(u => u.map(x => x.id===id ? { ...x, role } : x))
  }

  const resetData = async () => {
    if (!confirm('This will delete all jobs, candidates, timelines, assessments, submissions and applications, then reseed. Continue?')) return
    const res = await fetch('/admin/reset-data', { method: 'POST' })
    if (res.ok) {
      alert('Data reset and reseeded.')
      window.location.assign('/jobs')
    } else {
      alert('Failed to reset data')
    }
  }

  const factoryReset = async () => {
    if (!confirm('FACTORY RESET will erase ALL data including users and profiles, clear your session, and reseed default admin/hr + demo data. Continue?')) return
    const res = await fetch('/admin/factory-reset', { method: 'POST' })
    if (res.ok) {
      alert('Factory reset complete. Please log in again with seeded credentials.')
      window.location.assign('/login')
    } else {
      alert('Failed to factory reset')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Admin/HR Dashboard</h1>
        <Link to="/add-job" className="px-3 py-2 bg-indigo-600 text-white rounded">Add Job</Link>
      </div>
      {user?.role==='admin' && (
        <div className="bg-white border rounded p-3">
          <div className="font-medium mb-2">Team Members</div>
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">Email</th><th className="text-left p-2">Role</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">
                    {u.role!=='admin' && <button onClick={()=>changeRole(u.id,'admin')} className="px-2 py-1 border rounded mr-2">Make Admin</button>}
                    {u.role!=='hr-team' && <button onClick={()=>changeRole(u.id,'hr-team')} className="px-2 py-1 border rounded">Make HR</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="bg-white border rounded p-3">
        <div className="font-medium mb-2">Quick links</div>
        <ul className="list-disc pl-6 text-sm">
          <li><Link className="text-indigo-600" to="/jobs">Jobs</Link></li>
          <li><Link className="text-indigo-600" to="/pipeline">Pipeline</Link></li>
        </ul>
        {user?.role==='admin' && (
          <div className="mt-3">
            <button onClick={resetData} className="px-3 py-2 border rounded">Reset Jobs & Candidates Data</button>
            <button onClick={factoryReset} className="ml-2 px-3 py-2 border rounded text-red-700 border-red-300">Factory Reset (Full)</button>
          </div>
        )}
      </div>
    </div>
  )
}
