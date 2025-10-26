import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/shared/Layout.jsx'
import RequireAuth from './components/shared/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CandidateProfileForm from './pages/CandidateProfileForm.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AddNewJob from './pages/AddNewJob.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetails from './pages/JobDetails.jsx'
import Candidates from './pages/Candidates.jsx'
import CandidateProfile from './pages/CandidateProfile.jsx'
import Pipeline from './pages/Pipeline.jsx'
import AssessmentBuilder from './pages/AssessmentBuilder.jsx'
import CandidateJobs from './pages/CandidateJobs.jsx'
import ApplicationDetails from './pages/ApplicationDetails.jsx'
import { useAuth } from './context/AuthContext.jsx'

function Root() {
  const { user } = useAuth()
  return user ? <Navigate to="/jobs" replace /> : <Login />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/candidate/profile" element={<RequireAuth roles={['candidate']}><CandidateProfileForm /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth roles={['admin','hr-team']}><AdminDashboard /></RequireAuth>} />
        <Route path="/add-job" element={<RequireAuth roles={['admin','hr-team']}><AddNewJob /></RequireAuth>} />
        <Route path="/jobs" element={<RequireAuth><Jobs /></RequireAuth>} />
        <Route path="/candidate/jobs" element={<RequireAuth roles={['candidate']}><CandidateJobs /></RequireAuth>} />
        <Route path="/jobs/:jobId" element={<RequireAuth><JobDetails /></RequireAuth>} />
        <Route path="/jobs/:jobId/assessment" element={<RequireAuth><AssessmentBuilder /></RequireAuth>} />
        <Route path="/candidates" element={<RequireAuth roles={['admin','hr-team']}><Candidates /></RequireAuth>} />
        <Route path="/candidates/:id" element={<RequireAuth roles={['admin','hr-team']}><CandidateProfile /></RequireAuth>} />
  <Route path="/applications/:appId" element={<RequireAuth roles={['admin','hr-team']}><ApplicationDetails /></RequireAuth>} />
        <Route path="/pipeline" element={<RequireAuth roles={['admin','hr-team']}><Pipeline /></RequireAuth>} />
        <Route path="*" element={<div className="p-6">Not Found</div>} />
      </Routes>
    </Layout>
  )
}
