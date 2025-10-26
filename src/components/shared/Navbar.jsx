import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const linkCls = ({ isActive }) =>
  'px-3 py-2 rounded-md text-sm font-medium ' + (isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200')

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const bgColor = user?.role === 'admin'
    ? 'turquoise'
    : user?.role === 'hr-team'
      ? 'olive'
      : user?.role === 'candidate'
        ? 'crimson'
        : 'white'
  return (
    <nav className="border-b border-gray-200" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-2">
        <div className="font-semibold mr-4">TalentFlow</div>
        <NavLink to="/jobs" className={linkCls}>Jobs</NavLink>
  {(user?.role==='admin' || user?.role==='hr-team') && <NavLink to="/candidates" className={linkCls}>Candidates</NavLink>}
  {/* Pipeline link intentionally hidden for all roles */}
        <div className="ml-auto flex items-center gap-2">
          {!user && <NavLink to="/login" className={linkCls}>Login</NavLink>}
          {!user && <NavLink to="/register" className={linkCls}>Register</NavLink>}
          {/* Candidate uses Jobs page now; no separate My Jobs link */}
          {user?.role==='admin' && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
          {user && <button onClick={async()=>{ await logout(); nav('/login') }} className="px-3 py-2 rounded-md text-sm bg-gray-100">Logout</button>}
        </div>
      </div>
    </nav>
  )
}
