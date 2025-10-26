import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobsList } from '../hooks/useJobs'

export default function CandidateJobs(){
  const { data } = useJobsList({ page: 1, pageSize: 1000, sort: 'order:asc' })
  const [apps, setApps] = useState([])
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
  return (
    <div className="space-y-6">
      <section>
        <div className="font-semibold mb-2">New Jobs</div>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-2">Title</th><th className="p-2">Apply until</th></tr></thead>
            <tbody>
              {newJobs.map(j => (
                <tr key={j.id} className="border-t"><td className="p-2"><Link className="text-indigo-600" to={`/jobs/${j.id}`}>{j.title}</Link></td><td className="p-2">{j.endDate || 'N/A'}</td></tr>
              ))}
              {newJobs.length===0 && <tr><td className="p-3 text-sm text-gray-500" colSpan={2}>No new jobs available.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="font-semibold mb-2">Applied Jobs</div>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-2">Title</th><th className="p-2">Stage</th><th className="p-2">Assessment</th></tr></thead>
            <tbody>
              {apps.map(a => {
                const j = items.find(x => x.id===a.jobId)
                if (!j) return null
                const perf = (a.correct!=null) ? `${a.correct}/${a.attempted}` : '—'
                return (
                  <tr key={a.id} className="border-t">
                    <td className="p-2"><Link className="text-indigo-600" to={`/jobs/${j.id}`}>{j.title}</Link></td>
                    <td className="p-2">{a.stage}</td>
                    <td className="p-2">{perf}</td>
                  </tr>
                )
              })}
              {apps.length===0 && <tr><td className="p-3 text-sm text-gray-500" colSpan={3}>You have not applied to any jobs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
