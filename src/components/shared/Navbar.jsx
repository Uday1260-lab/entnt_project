import { NavLink } from 'react-router-dom'

const linkCls = ({ isActive }) =>
  'px-3 py-2 rounded-md text-sm font-medium ' + (isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200')

export default function Navbar(){
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-2">
        <div className="font-semibold mr-4">TalentFlow</div>
        <NavLink to="/jobs" className={linkCls}>Jobs</NavLink>
        <NavLink to="/candidates" className={linkCls}>Candidates</NavLink>
        <NavLink to="/pipeline" className={linkCls}>Pipeline</NavLink>
      </div>
    </nav>
  )
}
