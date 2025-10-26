import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/shared/Layout.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetails from './pages/JobDetails.jsx'
import Candidates from './pages/Candidates.jsx'
import CandidateProfile from './pages/CandidateProfile.jsx'
import Pipeline from './pages/Pipeline.jsx'
import AssessmentBuilder from './pages/AssessmentBuilder.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />
        <Route path="/jobs/:jobId/assessment" element={<AssessmentBuilder />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="*" element={<div className="p-6">Not Found</div>} />
      </Routes>
    </Layout>
  )
}
