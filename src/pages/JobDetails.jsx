import { Link, useNavigate, useParams } from 'react-router-dom'
import { useJobsList, useUpdateJob } from '../hooks/useJobs'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

const stages = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700', icon: '📝' },
  { id: 'screen', label: 'Screening', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700', icon: '👀' },
  { id: 'tech', label: 'Technical', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700', icon: '💻' },
  { id: 'offer', label: 'Offer', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-700', icon: '📄' },
  { id: 'hired', label: 'Hired', color: 'bg-green-100 border-green-300', textColor: 'text-green-700', icon: '✅' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-300', textColor: 'text-red-700', icon: '❌' },
]

function ApplicantCard({ applicant, usersMap, profilesMap, isDragging, onClick }) {
  const u = usersMap[applicant.candidateId]
  const p = profilesMap[applicant.candidateId]
  const email = applicant.candidateEmail || u?.email || '-'
  const displayName = applicant.candidateName || p?.name || (email!=='-' ? email.split('@')[0].split(/[._-]+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ') : applicant.candidateId)

  return (
    <div 
      className={`bg-white rounded-lg border-2 p-3 mb-2 cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2 scale-95' : 'hover:border-indigo-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{displayName}</h4>
          <p className="text-sm text-gray-500 truncate">{email}</p>
        </div>
        <div className="ml-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {email !== '-' ? `📧 ${email.split('@')[1]}` : '📧 No email'}
        </span>
        {applicant.marks != null ? (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {applicant.marks} pts
          </span>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            Pending
          </span>
        )}
      </div>
    </div>
  )
}

function StageColumn({ stage, applicants, usersMap, profilesMap, onCardClick }) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className={`rounded-t-lg border-2 ${stage.color} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stage.icon}</span>
            <h3 className={`font-bold text-lg ${stage.textColor}`}>{stage.label}</h3>
          </div>
          <span className={`${stage.textColor} font-semibold bg-white px-2 py-1 rounded-full text-sm`}>
            {applicants.length}
          </span>
        </div>
      </div>
      
      <div 
        className={`border-2 border-t-0 ${stage.color} rounded-b-lg p-3 bg-gray-50 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto`}
        data-stage={stage.id}
      >
        {applicants.length > 0 ? (
          applicants.map(applicant => (
            <div key={applicant.id} data-applicant-id={applicant.id}>
              <ApplicantCard 
                applicant={applicant} 
                usersMap={usersMap}
                profilesMap={profilesMap}
                onClick={() => onCardClick(applicant.id)}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No applicants</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobDetails(){
  const { jobId } = useParams()
  const { user } = useAuth()
  const { data } = useJobsList({ page: 1, pageSize: 1000 })
  const job = data?.items?.find(j => j.id === jobId)
  const [applications, setApplications] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [profilesMap, setProfilesMap] = useState({})
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'table'
  const [activeId, setActiveId] = useState(null)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', salary: '', startDate: '', endDate: '', assessmentDate: '', assessmentDuration: 45 })
  const [errMsg, setErrMsg] = useState('')
  const updateJob = useUpdateJob()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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

  const applicantsByStage = useMemo(() => {
    const grouped = {}
    stages.forEach(stage => {
      grouped[stage.id] = applications.filter(a => a.stage === stage.id)
    })
    return grouped
  }, [applications])

  const activeApplicant = useMemo(() => {
    if (!activeId) return null
    return applications.find(a => a.id === activeId)
  }, [activeId, applications])

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const applicantId = active.id
    const applicant = applications.find(a => a.id === applicantId)
    if (!applicant) return

    let targetStage = over.data?.current?.stage || over.id
    
    if (!targetStage) {
      const overElement = document.querySelector(`[data-applicant-id="${over.id}"]`)
      if (overElement) {
        const stageColumn = overElement.closest('[data-stage]')
        targetStage = stageColumn?.dataset?.stage
      }
    }

    if (!targetStage || targetStage === applicant.stage) return

    const currentIdx = stages.findIndex(s => s.id === applicant.stage)
    const targetIdx = stages.findIndex(s => s.id === targetStage)
    if (targetIdx < currentIdx) return

    updateStage(applicantId, targetStage)
  }

  async function updateStage(applicantId, newStage) {
    const oldStage = applications.find(a => a.id === applicantId)?.stage
    
    // Optimistic update
    setApplications(prev => prev.map(a => 
      a.id === applicantId ? { ...a, stage: newStage } : a
    ))

    try {
      const res = await fetch(`/applications/${applicantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      })
      if (!res.ok) throw new Error('Failed to update')
    } catch {
      // Revert on error
      setApplications(prev => prev.map(a => 
        a.id === applicantId ? { ...a, stage: oldStage } : a
      ))
    }
  }

  if (!job) return <div>Loading…</div>
  
  const now = Date.now()
  const canEdit = (user?.role === 'admin' || user?.role === 'hr-team') && (!job.startDate || new Date(job.startDate).getTime() > now)
  
  return (
    <div className="space-y-4">
      {/* Job Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                job.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-gray-400 text-gray-900'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-indigo-100">{job.description}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{applications.length}</div>
            <div className="text-sm text-indigo-100">Total Applicants</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-indigo-200 text-xs mb-1">📅 Application Window</div>
            <div className="font-semibold">
              {job.startDate ? new Date(job.startDate).toLocaleString() : 'N/A'} → {job.endDate ? new Date(job.endDate).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-indigo-200 text-xs mb-1">📝 Assessment</div>
            <div className="font-semibold">
              {job.assessmentDate ? new Date(job.assessmentDate).toLocaleString() : 'TBD'} ({job.assessmentDuration || 0} mins)
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-indigo-200 text-xs mb-1">💰 Salary</div>
            <div className="font-semibold">
              ${job.salary ? job.salary.toLocaleString() : 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'candidate' ? (
        <CandidateJobActions job={job} />
      ) : (
        <div className="space-y-3">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {canEdit && !editing && (
              <button 
                onClick={()=>{ setErrMsg(''); setEditing(true) }} 
                className="px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                ✏️ Edit Details
              </button>
            )}
            <Link 
              to={`/jobs/${job.id}/assessment`} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              📝 Create/Edit Assessment
            </Link>
            
            {/* View Toggle */}
            <div className="ml-auto flex bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📋 Table
              </button>
            </div>
          </div>

          {/* Edit Form */}
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

          {/* Applicants Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">📋 Applicants</h2>
            
            {viewMode === 'kanban' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {stages.map(stage => (
                    <StageColumn
                      key={stage.id}
                      stage={stage}
                      applicants={applicantsByStage[stage.id] || []}
                      usersMap={usersMap}
                      profilesMap={profilesMap}
                      onCardClick={(id) => navigate(`/applications/${id}`)}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {activeApplicant ? (
                    <ApplicantCard 
                      applicant={activeApplicant} 
                      usersMap={usersMap}
                      profilesMap={profilesMap}
                      isDragging 
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left border-b-2 border-gray-300">
                      <tr>
                        <th className="p-3 font-bold">Name</th>
                        <th className="p-3 font-bold">Email</th>
                        <th className="p-3 font-bold">Stage</th>
                        <th className="p-3 font-bold">Marks</th>
                        <th className="p-3 font-bold w-56">Change stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.length > 0 ? (
                        applications.map(a => {
                          const u = usersMap[a.candidateId]
                          const p = profilesMap[a.candidateId]
                          const email = a.candidateEmail || u?.email || '-'
                          const displayName = a.candidateName || p?.name || (email!=='-' ? email.split('@')[0].split(/[._-]+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ') : a.candidateId)
                          return (
                            <tr key={a.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/applications/${a.id}`)}>
                              <td className="p-3">{displayName}</td>
                              <td className="p-3">{email}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold capitalize">
                                  {a.stage}
                                </span>
                              </td>
                              <td className="p-3">
                                {a.marks != null ? (
                                  <span className="font-semibold text-indigo-600">{a.marks}</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">Pending</span>
                                )}
                              </td>
                              <td className="p-3" onClick={(e)=>e.stopPropagation()}>
                                <StageSelector app={a} onUpdated={(next)=>{
                                  setApplications(prev => prev.map(x => x.id===a.id ? { ...x, stage: next } : x))
                                }} />
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr><td className="p-8 text-center text-gray-500" colSpan={5}>
                          <div className="text-4xl mb-2">📭</div>
                          <div>No applicants yet</div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instructions */}
            {viewMode === 'kanban' && applications.length > 0 && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">How to use Kanban board</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Drag applicant cards to move them between stages</li>
                      <li>• Applicants can only move forward (no backward moves)</li>
                      <li>• Click on any card to view detailed application</li>
                      <li>• Switch to table view for traditional list format</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
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
  const startTime = job.startDate ? new Date(job.startDate).getTime() : null
  const endTime = job.endDate ? new Date(job.endDate).getTime() : null
  
  let canApply = false
  let buttonText = 'Apply'
  
  if (startTime && now < startTime) {
    canApply = false
    buttonText = 'Opens Soon'
  } else if (endTime && now > endTime) {
    canApply = false
    buttonText = 'Applications Closed'
  } else {
    canApply = true
    buttonText = 'Apply'
  }
  
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
        <button disabled={!canApply} onClick={apply} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{buttonText}</button>
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

function StageSelector({ app, onUpdated }){
  const [saving, setSaving] = useState(false)
  const onChange = async (next) => {
    if (next === app.stage) return
    const stageIds = stages.map(s => s.id)
    const idx = stageIds.indexOf(app.stage)
    const toIdx = stageIds.indexOf(next)
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
        <option key={s.id} value={s.id} disabled={stages.map(st => st.id).indexOf(s.id) < stages.map(st => st.id).indexOf(app.stage)}>{s.label}</option>
      ))}
    </select>
  )
}

function EditJobForm({ form, setForm, onCancel, onSave, saving, error }){
  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="font-bold text-lg text-gray-900">✏️ Edit Job Details</div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg text-sm font-semibold">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
          <input value={form.title} onChange={e=>onChange('title', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
          <input value={form.slug} onChange={e=>onChange('slug', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={e=>onChange('description', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
          <input type="number" value={form.salary} onChange={e=>onChange('salary', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment duration (mins)</label>
          <input type="number" value={form.assessmentDuration} onChange={e=>onChange('assessmentDuration', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Start date to apply</label>
          <input type="datetime-local" value={form.startDate} onChange={e=>onChange('startDate', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Last date to apply</label>
          <input type="datetime-local" value={form.endDate} onChange={e=>onChange('endDate', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment date/time</label>
          <input type="datetime-local" value={form.assessmentDate} onChange={e=>onChange('assessmentDate', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={onSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">💾 Save</button>
        <button disabled={saving} onClick={onCancel} className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">❌ Cancel</button>
      </div>
    </div>
  )
}

function AssessmentEntry({ job }){
  const [showGate, setShowGate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const now = Date.now()
  const startMs = job?.assessmentDate ? new Date(job.assessmentDate).getTime() : null
  const durationMs = (job?.assessmentDuration ?? 0) * 60_000
  const endMs = startMs!=null ? startMs + durationMs : null
  const inWindow = startMs!=null && durationMs>0 && now >= startMs && now <= endMs

  const start = () => {
    if (!inWindow) return
    if (!name || !email) return alert('Please provide name and email to verify')
    window.location.assign(`/jobs/${job.id}/assessment`)
  }
  return (
    <div className="space-y-2">
      {!showGate ? (
        <button
          onClick={()=> inWindow && setShowGate(true)}
          disabled={!inWindow}
          className="px-3 py-2 border rounded disabled:opacity-50"
          title={inWindow ? undefined : 'Assessment is only available during the scheduled window'}
        >
          Take Assessment
        </button>
      ) : (
        <div className="p-3 border rounded bg-white space-y-2 max-w-sm">
          {!inWindow && (
            <div className="text-sm text-red-600">Assessment window is closed. Please return during the scheduled time.</div>
          )}
          <div className="text-sm">Verify your identity to start</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full border rounded px-2 py-1" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" className="w-full border rounded px-2 py-1" />
          <button onClick={start} disabled={!inWindow} className="px-3 py-2 bg-indigo-600 text-white rounded w-full disabled:opacity-50">Start Assessment</button>
        </div>
      )}
      {startMs!=null && durationMs>0 && (
        <div className="text-xs text-gray-600">
          Assessment window: {new Date(startMs).toISOString()} → {new Date(endMs).toISOString()}
        </div>
      )}
    </div>
  )
}
