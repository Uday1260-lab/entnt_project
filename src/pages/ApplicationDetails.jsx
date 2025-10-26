import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const stages = ['applied','screen','tech','offer','hired','rejected']

export default function ApplicationDetails(){
  const { appId } = useParams()
  const [app, setApp] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
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
  if (app.attempted == null && app.correct == null && app.skipped == null) {
    return <div className="text-sm text-gray-600">Pending assessment</div>
  }
  if ((app.attempted === 0) && (app.skipped > 0)) {
    return <div className="text-sm text-red-600">Assessment skipped</div>
  }
  return (
    <div className="text-sm">
      <div>Attempted: {app.attempted ?? 0}</div>
      <div>Correct: {app.correct ?? 0}</div>
      <div>Incorrect: {app.incorrect ?? 0}</div>
      {app.marks != null && <div>Marks: {app.marks}</div>}
    </div>
  )
}
