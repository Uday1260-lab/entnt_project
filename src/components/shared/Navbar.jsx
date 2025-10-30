import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const linkCls = ({ isActive }) =>
  'px-3 py-2 rounded-lg text-sm font-medium transition-all ' + (isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'text-white/90 hover:bg-white/10 hover:text-white')

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  
  const bgGradient = user?.role === 'admin'
    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700'
    : user?.role === 'hr-team'
      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
      : user?.role === 'candidate'
        ? 'bg-gradient-to-r from-purple-600 to-purple-700'
        : 'bg-gradient-to-r from-gray-800 to-gray-900'
        
  const roleBadgeColor = user?.role === 'admin'
    ? 'bg-indigo-500/30 text-white border-white/20'
    : user?.role === 'hr-team'
      ? 'bg-emerald-500/30 text-white border-white/20'
      : user?.role === 'candidate'
        ? 'bg-purple-500/30 text-white border-white/20'
        : 'bg-gray-500/30 text-white border-white/20'
        
  return (
    <nav className={`${bgGradient} shadow-lg border-b border-white/10`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-bold text-xl text-white">TalentFlow</span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <NavLink to="/jobs" className={linkCls}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Jobs
                </span>
              </NavLink>
              {(user?.role==='admin' || user?.role==='hr-team') && (
                <NavLink to="/candidates" className={linkCls}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Candidates
                  </span>
                </NavLink>
              )}
              {user?.role==='admin' && (
                <NavLink to="/admin" className={linkCls}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                  </span>
                </NavLink>
              )}
            </div>
          </div>
          
          {/* Right Side - User Info and Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">
                  Login
                </NavLink>
                <NavLink to="/register" className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-all shadow-sm">
                  Register
                </NavLink>
              </>
            ) : (
              <>
                {user && (
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadgeColor}`}>
                      {user.role === 'hr-team' ? 'HR' : user.role}
                    </span>
                    <span className="text-white/90 text-sm">{user.email}</span>
                  </div>
                )}
                <button 
                  onClick={async()=>{ await logout(); nav('/login') }} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all border border-white/20"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
