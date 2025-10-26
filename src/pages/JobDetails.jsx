import { Link, useParams } from 'react-router-dom'
import { useJobsList } from '../hooks/useJobs'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useMemo, useState } from 'react'

export default function JobDetails(){
  const { jobId } = useParams()
  const { user } = useAuth()
  // Fetch a small page and find by id (simple for placeholder). In real app, add GET /jobs/:id
  const { data } = useJobsList({ page: 1, pageSize: 1000 })
  const job = data?.items?.find(j => j.id === jobId)
  const [applications, setApplications] = useState([])
  useEffect(() => {
    (async()=>{
      const res = await fetch(`/applications?jobId=${jobId}`)
      if (res.ok) { const d = await res.json(); setApplications(d.items||[]) }
    })()
  }, [jobId])
  if (!job) return <div>Loading…</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <span className="text-xs px-2 py-1 rounded bg-gray-200">{job.status}</span>
      </div>
      <div className="prose"><p>{job.description}</p></div>
      <div className="text-sm">Apply window: {job.startDate || 'N/A'} → {job.endDate || 'N/A'}</div>
      <div className="text-sm">Assessment: {job.assessmentDate || 'TBD'} ({job.assessmentDuration || 0} mins)</div>

      {user?.role === 'candidate' ? (
        <CandidateJobActions job={job} />
      ) : (
        <div className="space-y-3">
          <Link to={`/jobs/${job.id}/assessment`} className="inline-block px-3 py-2 bg-indigo-600 text-white rounded">Create/Edit Assessment</Link>
          <div className="bg-white border rounded p-3">
            <div className="font-medium mb-2">Applicants</div>
            <ul className="list-disc pl-6 text-sm">
              {applications.map(a => (
                <li key={a.id}>Candidate {a.candidateId} — stage: {a.stage}{a.correct!=null && `, score: ${a.correct}/${a.attempted}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function CandidateJobActions({ job }){
  const [app, setApp] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    (async()=>{
      const meRes = await fetch('/me')
      if (!meRes.ok) return
      const me = await meRes.json()
      const res = await fetch(`/applications?jobId=${job.id}&candidateId=${me.id}`)
      if (res.ok) { const d = await res.json(); setApp(d.items?.[0]||null) }
    })()
  }, [job.id])
  const now = Date.now()
  const canApply = (!job.startDate || new Date(job.startDate).getTime() <= now) && (!job.endDate || new Date(job.endDate).getTime() >= now)
  const apply = async () => {
    setMessage('')
    const res = await fetch('/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id }) })
    const data = await res.json()
    if (!res.ok) { setMessage(data.message || 'Failed'); return }
    setApp(data)
  }
  return (
    <div className="space-y-2">
      {!app ? (
        <button disabled={!canApply} onClick={apply} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{canApply? 'Apply' : 'Applications Closed'}</button>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">Stage: <span className="px-2 py-1 bg-gray-100 rounded text-xs">{app.stage}</span></div>
          <AssessmentEntry job={job} />
        </div>
      )}
      {message && <div className="text-sm text-red-600">{message}</div>}
    </div>
  )
}

function AssessmentEntry({ job }){
  const [showGate, setShowGate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const start = () => {
    if (!name || !email) return alert('Please provide name and email to verify')
    // navigate to assessment builder runtime route (reuse existing builder page for now)
    window.location.assign(`/jobs/${job.id}/assessment`)
  }
  return (
    <div>
      {!showGate ? (
        <button onClick={()=>setShowGate(true)} className="px-3 py-2 border rounded">Take Assessment</button>
      ) : (
        <div className="p-3 border rounded bg-white space-y-2 max-w-sm">
          <div className="text-sm">Verify your identity to start</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full border rounded px-2 py-1" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" className="w-full border rounded px-2 py-1" />
          <button onClick={start} className="px-3 py-2 bg-indigo-600 text-white rounded w-full">Start Assessment</button>
        </div>
      )}
    </div>
  )
}
