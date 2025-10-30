import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobsList } from '../hooks/useJobs'
import Pagination from '../components/shared/Pagination'

export default function CandidateJobs(){
  const { data } = useJobsList({ page: 1, pageSize: 1000, sort: 'order:asc', audience: 'candidate' })
  const [apps, setApps] = useState([])
  const [tab, setTab] = useState('new') // 'new' | 'applied'
  const [newPage, setNewPage] = useState(1)
  const [appliedPage, setAppliedPage] = useState(1)
  const pageSize = 10
  const [perfApp, setPerfApp] = useState(null) // application to show performance for
  useEffect(() => { (async()=>{ 
    const meRes = await fetch('/me'); if(!meRes.ok) { window.location.assign('/login'); return }
    const me = await meRes.json();
    const profRes = await fetch('/candidate/profile'); if(profRes.ok){ const p = await profRes.json(); if(!p.completedAt){ window.location.assign('/candidate/profile'); return } }
    const res = await fetch(`/applications?candidateId=${me.id}`); if(res.ok){ const d=await res.json(); setApps(d.items||[]) }
  })() }, [])
  const appliedIds = useMemo(()=> new Set(apps.map(a=>a.jobId)), [apps])
  const now = Date.now()
  const items = data?.items||[]
  const newJobs = items.filter(j => (!j.endDate || new Date(j.endDate).getTime() >= now) && !appliedIds.has(j.id))
  const appliedJobs = items.filter(j => appliedIds.has(j.id))
  const shortDate = (v) => {
    if (!v) return 'N/A'
    if (typeof v === 'string') {
      if (v.includes('T')) return v.split('T')[0]
      return v.length >= 10 ? v.slice(0,10) : v
    }
    try { return new Date(v).toISOString().slice(0,10) } catch { return String(v).slice(0,10) }
  }
  const newStart = (newPage-1) * pageSize
  const newPageItems = newJobs.slice(newStart, newStart + pageSize)
  const appliedStart = (appliedPage-1) * pageSize
  const appliedPageItems = apps.slice(appliedStart, appliedStart + pageSize)
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b bg-white rounded-t">
        <button onClick={()=>setTab('new')} className={`px-4 py-2 -mb-px border-b-2 ${tab==='new' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>New</button>
        <button onClick={()=>setTab('applied')} className={`px-4 py-2 -mb-px border-b-2 ${tab==='applied' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>Applied</button>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full text-sm">
          {tab==='new' ? (
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Salary</th>
                <th className="p-2">Apply start</th>
                <th className="p-2">Apply end</th>
              </tr>
            </thead>
          ) : (
            <thead className="bg-gray-50 text-left"><tr><th className="p-2">Title</th><th className="p-2">Stage</th><th className="p-2">Assessment</th><th className="p-2">Actions</th></tr></thead>
          )}
          <tbody>
            {tab==='new' ? (
              newPageItems.length>0 ? (
                newPageItems.map(j => (
                  <tr key={j.id} className="border-t">
                    <td className="p-2"><Link className="text-indigo-600" to={`/jobs/${j.id}`}>{j.title}</Link></td>
                    <td className="p-2">{j.salary!=null ? `$${Number(j.salary).toLocaleString()}` : 'N/A'}</td>
                    <td className="p-2">{shortDate(j.startDate)}</td>
                    <td className="p-2">{shortDate(j.endDate)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-3 text-sm text-gray-500 text-center" colSpan={4}>No entry</td></tr>
              )
            ) : (
              appliedPageItems.length>0 ? (
                appliedPageItems.map(a => {
                  const j = items.find(x => x.id===a.jobId)
                  if (!j) return null
                  const nowTs = Date.now()
                  const assessTs = j.assessmentDate ? new Date(j.assessmentDate).getTime() : null
                  const assessEndTs = assessTs!=null ? assessTs + ((j.assessmentDuration||0)*60*1000) : null
                  let assessmentCell
                  if (a.correct != null) {
                    assessmentCell = (
                      <button className="text-indigo-600 underline" onClick={()=>setPerfApp({ app: a, job: j })}>
                        Assessment taken
                      </button>
                    )
                  } else if (assessTs!=null && (assessEndTs!=null ? nowTs > assessEndTs : nowTs > assessTs)) {
                    assessmentCell = <span className="text-red-600">Disqualified, Assessment Not Taken</span>
                  } else if (assessTs!=null) {
                    assessmentCell = <span>on {shortDate(j.assessmentDate)}</span>
                  } else {
                    assessmentCell = <span>—</span>
                  }
                  
                  // Offer actions
                  let actionsCell
                  if (a.stage === 'offer') {
                    actionsCell = (
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            if (!confirm('Accept this job offer?')) return
                            try {
                              await fetch(`/applications/${a.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stage: 'hired' })
                              })
                              setApps(prev => prev.map(x => x.id === a.id ? { ...x, stage: 'hired' } : x))
                            } catch (error) {
                              alert('Failed to accept offer')
                            }
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={async () => {
                            if (!confirm('Reject this job offer?')) return
                            try {
                              await fetch(`/applications/${a.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stage: 'rejected' })
                              })
                              setApps(prev => prev.map(x => x.id === a.id ? { ...x, stage: 'rejected' } : x))
                            } catch (error) {
                              alert('Failed to reject offer')
                            }
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )
                  } else if (a.stage === 'hired') {
                    actionsCell = <span className="text-green-600 font-semibold">✓ Accepted</span>
                  } else if (a.stage === 'rejected') {
                    actionsCell = <span className="text-red-600">Rejected</span>
                  } else {
                    actionsCell = <span className="text-gray-400">—</span>
                  }
                  
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="p-2"><Link className="text-indigo-600" to={`/jobs/${j.id}`}>{j.title}</Link></td>
                      <td className="p-2 capitalize">{a.stage}</td>
                      <td className="p-2">{assessmentCell}</td>
                      <td className="p-2">{actionsCell}</td>
                    </tr>
                  )
                })
              ) : (
                <tr><td className="p-3 text-sm text-gray-500 text-center" colSpan={4}>No entry</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        {tab==='new' ? (
          <Pagination page={newPage} pageSize={pageSize} total={newJobs.length} onPageChange={setNewPage} />
        ) : (
          <Pagination page={appliedPage} pageSize={pageSize} total={apps.length} onPageChange={setAppliedPage} />
        )}
      </div>
      {perfApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Assessment Performance</div>
              <button onClick={()=>setPerfApp(null)} className="px-2 py-1 border rounded">Close</button>
            </div>
            <div className="text-sm text-gray-600 mb-3">{perfApp.job?.title || ''}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">Attempted<br/><span className="font-semibold">{perfApp.app.attempted ?? 0}</span></div>
              <div className="p-2 bg-gray-50 rounded">Correct<br/><span className="font-semibold">{perfApp.app.correct ?? 0}</span></div>
              <div className="p-2 bg-gray-50 rounded">Incorrect<br/><span className="font-semibold">{Math.max(0, (perfApp.app.attempted||0) - (perfApp.app.correct||0))}</span></div>
              <div className="p-2 bg-gray-50 rounded">Skipped<br/><span className="font-semibold">{perfApp.app.skipped ?? 0}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
