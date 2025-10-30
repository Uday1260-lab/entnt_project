import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const stages = ['applied','screen','tech','offer','hired','rejected']

export default function ApplicationDetails(){
  const { appId } = useParams()
  const [app, setApp] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async()=>{
      setLoading(true)
      const r = await fetch(`/applications/${appId}`)
      if (!r.ok) { setLoading(false); return }
      const a = await r.json()
      setApp(a)
      if (!a.candidateEmail) {
        const rc = await fetch(`/users/${a.candidateId}`)
        if (rc.ok) setUser(await rc.json())
      }
      // Fetch profile for education/experience/photo/resume
      const rp = await fetch(`/candidate/profile/${a.candidateId}`)
      if (rp.ok) setProfile(await rp.json())
      
      // Fetch submission and assessment if available
      const rs = await fetch(`/submissions/by-job-candidate/${a.jobId}/${a.candidateId}`)
      if (rs.ok) {
        const sub = await rs.json()
        setSubmission(sub)
        
        // Fetch assessment to get questions
        const ra = await fetch(`/assessments/${a.jobId}`)
        if (ra.ok) {
          setAssessment(await ra.json())
        }
      }
      
      setLoading(false)
    })()
  }, [appId])

  if (loading) return <div className="p-4">Loading…</div>
  if (!app) return <div className="p-4">Application not found</div>

  const perf = renderPerformance(app)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Applicant</div>
        <Link to={`/jobs/${app.jobId}`} className="text-indigo-600 text-sm">Back to job</Link>
      </div>
      <div className="bg-white border rounded p-4">
  <div className="flex gap-4 items-start">
          {profile?.imageB64 ? (
            <img src={profile.imageB64} alt="Profile" className="h-20 w-20 rounded object-cover border" />
          ) : (
            <div className="h-20 w-20 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs border">No Photo</div>
          )}
          <div className="flex-1">
            <div className="text-lg font-medium">
              {profile?.name || app.candidateName || (app.candidateEmail ? app.candidateEmail.split('@')[0].split(/[._-]+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ') : app.candidateId)}
            </div>
            <div className="text-sm text-gray-600">{app.candidateEmail || user?.email || '-'}</div>
            <div className="mt-1 text-sm text-gray-700">{user?.address ? user.address : <span className="text-gray-500">No address</span>}{user?.postalCode ? `, ${user.postalCode}` : ''}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs inline-block px-2 py-1 rounded bg-gray-100 capitalize">Stage: {app.stage}</span>
              <StageSelector app={app} onUpdated={(next)=> setApp(prev => ({ ...prev, stage: next }))} />
              {app.stage === 'hired' && (
                <span className="text-xs inline-block px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                  ✓ Offer Accepted
                </span>
              )}
              {app.stage === 'rejected' && (
                <span className="text-xs inline-block px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                  ✗ Offer Declined
                </span>
              )}
            </div>
          </div>
          <div>
            {profile?.resumeB64 ? (
              <a href={profile.resumeB64} target="_blank" rel="noopener noreferrer" download="resume"
                 className="text-indigo-600 text-sm underline">View resume</a>
            ) : (
              <span className="text-sm text-gray-500">No resume</span>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Assessment performance</div>
        {perf}
      </div>
      
      {submission && assessment && (
        <SubmissionDetails submission={submission} assessment={assessment} />
      )}
      
      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-1">Education</div>
            <div>{profile?.education || <span className="text-gray-500">Not provided</span>}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Work experience</div>
            <div>{profile?.experience || <span className="text-gray-500">Not provided</span>}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StageSelector({ app, onUpdated }){
  const [saving, setSaving] = useState(false)
  const onChange = async (next) => {
    if (next === app.stage) return
    const idx = stages.indexOf(app.stage)
    const toIdx = stages.indexOf(next)
    if (idx !== -1 && toIdx !== -1 && toIdx < idx) return
    setSaving(true)
    try {
      const res = await fetch(`/applications/${app.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: next }) })
      if (!res.ok) throw new Error('Failed to update')
      onUpdated(next)
    } catch {
      // ignore error for now
    } finally { setSaving(false) }
  }
  return (
    <select value={app.stage} onChange={(e)=>onChange(e.target.value)} className="border rounded px-2 py-1 text-xs" disabled={saving}>
      {stages.map(s => (
        <option key={s} value={s} disabled={stages.indexOf(s) < stages.indexOf(app.stage)}>{s}</option>
      ))}
    </select>
  )
}

function renderPerformance(app){
  // Check if assessment has been attempted (any of these fields should be present after submission)
  const hasAssessmentData = app.attempted !== undefined || app.correct !== undefined || app.marks !== undefined
  
  if (!hasAssessmentData) {
    return <div className="text-sm text-gray-600">Pending assessment</div>
  }
  if ((app.attempted === 0) && (app.skipped > 0)) {
    return <div className="text-sm text-red-600">Assessment skipped</div>
  }
  return (
    <div className="text-sm space-y-1">
      <div>Attempted: {app.attempted ?? 0}</div>
      <div>Correct: {app.correct ?? 0}</div>
      <div>Incorrect: {app.incorrect ?? 0}</div>
      <div>Skipped: {app.skipped ?? 0}</div>
      {app.marks != null && (
        <div className="font-semibold text-indigo-600 mt-2 text-base">
          Total Marks: {app.marks}
        </div>
      )}
    </div>
  )
}

function SubmissionDetails({ submission, assessment }) {
  const allQuestions = []
  for (const section of assessment.sections || []) {
    for (const question of section.questions || []) {
      allQuestions.push({ ...question, sectionTitle: section.title })
    }
  }

  const formatAnswer = (question, answer) => {
    if (answer === undefined || answer === null || answer === '') return <span className="text-gray-400 italic">Not answered</span>
    
    if (question.type === 'multiChoice') {
      return Array.isArray(answer) ? answer.join(', ') : String(answer)
    }
    
    return String(answer)
  }

  const formatCorrectAnswer = (question) => {
    if (!question.hasMarks) return <span className="text-gray-400">N/A</span>
    
    if (question.type === 'singleChoice' && question.correctOption) {
      return question.correctOption
    }
    
    if (question.type === 'multiChoice' && question.correctOptions) {
      return Array.isArray(question.correctOptions) ? question.correctOptions.join(', ') : String(question.correctOptions)
    }
    
    if (question.type === 'numeric' && question.correctValue !== undefined) {
      return String(question.correctValue)
    }
    
    return <span className="text-gray-400">Not set</span>
  }

  const isCorrect = (question, answer) => {
    if (!question.hasMarks || answer === undefined || answer === null || answer === '') return null
    
    if (question.type === 'singleChoice') {
      return answer === question.correctOption
    }
    
    if (question.type === 'multiChoice') {
      if (!Array.isArray(question.correctOptions) || !Array.isArray(answer)) return null
      const sorted1 = [...question.correctOptions].sort()
      const sorted2 = [...answer].sort()
      return JSON.stringify(sorted1) === JSON.stringify(sorted2)
    }
    
    if (question.type === 'numeric') {
      return Number(answer) === Number(question.correctValue)
    }
    
    return null
  }

  const getMarksAwarded = (question, answer) => {
    if (!question.hasMarks) return null
    
    const correct = isCorrect(question, answer)
    if (correct === null) return null
    
    return correct ? (question.marksCorrect || 1) : (question.marksIncorrect || 0)
  }

  return (
    <div className="bg-white border rounded p-4">
      <div className="font-medium mb-3">Assessment Submission Details</div>
      <div className="text-xs text-gray-500 mb-3">
        Submitted at: {new Date(submission.at).toLocaleString()}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-2 font-medium">Section</th>
              <th className="text-left p-2 font-medium">Question</th>
              <th className="text-left p-2 font-medium">Candidate Answer</th>
              <th className="text-left p-2 font-medium">Correct Answer</th>
              <th className="text-left p-2 font-medium">Status</th>
              <th className="text-left p-2 font-medium">Marks</th>
            </tr>
          </thead>
          <tbody>
            {allQuestions.map((q, idx) => {
              const answer = submission.answers?.[q.id]
              const correct = isCorrect(q, answer)
              const marksAwarded = getMarksAwarded(q, answer)
              
              return (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-600">{q.sectionTitle}</td>
                  <td className="p-2">{q.label}</td>
                  <td className="p-2">{formatAnswer(q, answer)}</td>
                  <td className="p-2">{formatCorrectAnswer(q)}</td>
                  <td className="p-2">
                    {correct === null ? (
                      <span className="text-gray-400">-</span>
                    ) : correct ? (
                      <span className="text-green-600 font-medium">✓ Correct</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Incorrect</span>
                    )}
                  </td>
                  <td className="p-2">
                    {marksAwarded !== null ? (
                      <span className={marksAwarded > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                        {marksAwarded > 0 ? '+' : ''}{marksAwarded}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 border-t-2 border-indigo-200">
              <td colSpan="5" className="p-3 text-right font-semibold">Total Marks Obtained:</td>
              <td className="p-3">
                <span className="text-lg font-bold text-indigo-600">
                  {allQuestions.reduce((sum, q) => {
                    const answer = submission.answers?.[q.id]
                    const marks = getMarksAwarded(q, answer)
                    return sum + (marks || 0)
                  }, 0)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
