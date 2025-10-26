import { Link, useParams } from 'react-router-dom'
import { useJobsList } from '../hooks/useJobs'

export default function JobDetails(){
  const { jobId } = useParams()
  // Fetch a small page and find by id (simple for placeholder). In real app, add GET /jobs/:id
  const { data } = useJobsList({ page: 1, pageSize: 1000 })
  const job = data?.items?.find(j => j.id === jobId)
  if (!job) return <div>Loading…</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <span className="text-xs px-2 py-1 rounded bg-gray-200">{job.status}</span>
      </div>
      <div>Slug: <code>{job.slug}</code></div>
      <div>Tags: {(job.tags||[]).join(', ')}</div>
      <Link to={`/jobs/${job.id}/assessment`} className="inline-block px-3 py-2 bg-indigo-600 text-white rounded">Open Assessment Builder</Link>
    </div>
  )
}
