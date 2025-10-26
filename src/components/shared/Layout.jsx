import Navbar from './Navbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Layout({ children }){
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {user && <Navbar />}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
