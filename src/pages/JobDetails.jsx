import { Link, useNavigate, useParams } from 'react-router-dom'
import { useJobsList, useUpdateJob } from '../hooks/useJobs'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useMemo, useState } from 'react'

export default function JobDetails(){
  const { jobId } = useParams()
  const { user } = useAuth()
  // Fetch a small page and find by id (simple for placeholder). In real app, add GET /jobs/:id
  const { data } = useJobsList({ page: 1, pageSize: 1000 })
  const job = data?.items?.find(j => j.id === jobId)
  const [applications, setApplications] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [profilesMap, setProfilesMap] = useState({})
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', salary: '', startDate: '', endDate: '', assessmentDate: '', assessmentDuration: 45 })
  const [errMsg, setErrMsg] = useState('')
  const updateJob = useUpdateJob()

  const toLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const HH = pad(d.getHours())
    const MM = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
  }

  useEffect(() => {
    if (job && editing) {
      setForm({
        title: job.title || '',
        slug: job.slug || '',
        description: job.description || '',
        salary: job.salary != null ? String(job.salary) : '',
        startDate: toLocalInput(job.startDate),
        endDate: toLocalInput(job.endDate),
        assessmentDate: toLocalInput(job.assessmentDate),
        assessmentDuration: job.assessmentDuration != null ? job.assessmentDuration : 45,
      })
    }
  }, [job, editing])
  useEffect(() => {
    (async()=>{
      const res = await fetch(`/applications?jobId=${jobId}`)
      if (res.ok) { const d = await res.json(); setApplications(d.items||[]) }
    })()
  }, [jobId])
  useEffect(() => {
    (async()=>{
      const ids = Array.from(new Set(applications.filter(a=>!a.candidateEmail).map(a => a.candidateId)))
      const entries = await Promise.all(ids.map(async id => {
        const r = await fetch(`/users/${id}`)
        if (!r.ok) return [id, null]
        const u = await r.json()
        return [id, u]
      }))
      setUsersMap(Object.fromEntries(entries))
    })()
  }, [applications])
  useEffect(() => {
    (async()=>{
      const ids = Array.from(new Set(applications.filter(a=>!a.candidateName).map(a => a.candidateId)))
      const entries = await Promise.all(ids.map(async id => {
        const r = await fetch(`/candidate/profile/${id}`)
        if (!r.ok) return [id, null]
        const p = await r.json()
        return [id, p]
      }))
      setProfilesMap(Object.fromEntries(entries))
    })()
  }, [applications])
  if (!job) return <div>Loading…</div>
  const now = Date.now()
  const canEdit = (user?.role === 'admin' || user?.role === 'hr-team') && (!job.startDate || new Date(job.startDate).getTime() > now)
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
          {canEdit && !editing && (
            <button onClick={()=>{ setErrMsg(''); setEditing(true) }} className="inline-block px-3 py-2 border rounded">Edit Details</button>
          )}
          {editing && canEdit && (
            <EditJobForm
              form={form}
              setForm={setForm}
              onCancel={()=>setEditing(false)}
              onSave={async ()=>{
                setErrMsg('')
                try {
                  await updateJob.mutateAsync({ id: job.id, updates: {
                    title: form.title,
                    slug: (form.slug || form.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''),
                    description: form.description,
                    salary: form.salary ? Number(form.salary) : null,
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                    assessmentDate: form.assessmentDate || null,
                    assessmentDuration: form.assessmentDuration ? Number(form.assessmentDuration) : null,
                  } })
                  setEditing(false)
                } catch (e) {
                  setErrMsg(e.message || 'Update failed')
                }
              }}
              saving={updateJob.isLoading}
              error={errMsg}
            />
          )}
          <Link to={`/jobs/${job.id}/assessment`} className="inline-block px-3 py-2 bg-indigo-600 text-white rounded">Create/Edit Assessment</Link>
          <div className="bg-white border rounded p-3">
            <div className="font-medium mb-2">Applicants</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Stage</th>
                    <th className="p-2 w-56">Change stage</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(a => {
                    const u = usersMap[a.candidateId]
                    const p = profilesMap[a.candidateId]
                    const email = a.candidateEmail || u?.email || '-'
                    const displayName = a.candidateName || p?.name || (email!=='-' ? email.split('@')[0].split(/[._-]+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ') : a.candidateId)
                    const row = (
                      <tr key={a.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/applications/${a.id}`)}>
                        <td className="p-2">{displayName}</td>
                        <td className="p-2">{email}</td>
                        <td className="p-2 capitalize">{a.stage}</td>
                        <td className="p-2" onClick={(e)=>e.stopPropagation()}>
                          <StageSelector app={a} onUpdated={(next)=>{
                            setApplications(prev => prev.map(x => x.id===a.id ? { ...x, stage: next } : x))
                          }} />
                        </td>
                      </tr>
                    )
                    return row
                  })}
                </tbody>
              </table>
            </div>
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

const stages = ['applied','screen','tech','offer','hired','rejected']
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
      // no-op
    } finally { setSaving(false) }
  }
  return (
    <select value={app.stage} onChange={(e)=>onChange(e.target.value)} className="border rounded px-2 py-1" disabled={saving}>
      {stages.map(s => (
        <option key={s} value={s} disabled={stages.indexOf(s) < stages.indexOf(app.stage)}>{s}</option>
      ))}
    </select>
  )
}

function EditJobForm({ form, setForm, onCancel, onSave, saving, error }){
  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="bg-white border rounded p-3 space-y-3">
      <div className="font-medium">Edit Job Details</div>
      {error && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm">Title</label>
          <input value={form.title} onChange={e=>onChange('title', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Slug</label>
          <input value={form.slug} onChange={e=>onChange('slug', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Description</label>
          <textarea rows={4} value={form.description} onChange={e=>onChange('description', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Salary</label>
          <input type="number" value={form.salary} onChange={e=>onChange('salary', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Assessment duration (mins)</label>
          <input type="number" value={form.assessmentDuration} onChange={e=>onChange('assessmentDuration', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Start date to apply</label>
          <input type="datetime-local" value={form.startDate} onChange={e=>onChange('startDate', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Last date to apply</label>
          <input type="datetime-local" value={form.endDate} onChange={e=>onChange('endDate', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Assessment date/time</label>
          <input type="datetime-local" value={form.assessmentDate} onChange={e=>onChange('assessmentDate', e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={onSave} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Save</button>
        <button disabled={saving} onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
      </div>
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
