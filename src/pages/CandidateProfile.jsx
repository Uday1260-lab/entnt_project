import { useParams } from 'react-router-dom'
import { useCandidateTimeline, useCandidatesList } from '../hooks/useCandidates'

export default function CandidateProfile(){
  const { id } = useParams()
  const { data: pageData } = useCandidatesList({ page: 1, pageSize: 1000 })
  const cand = pageData?.items?.find(c => c.id === id)
  const { data } = useCandidateTimeline(id)
  return (
    <div className="space-y-4">
      {!cand ? <div>Loading…</div> : (
        <div className="bg-white border rounded p-4">
          <div className="text-xl font-semibold">{cand.name}</div>
          <div className="text-sm text-gray-500">{cand.email}</div>
          <div className="mt-2 text-xs inline-block px-2 py-1 rounded bg-gray-100">{cand.stage}</div>
        </div>
      )}
      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Timeline</div>
        <ol className="space-y-2">
          {(data?.items||[]).map(ev => (
            <li key={ev.id} className="text-sm text-gray-700">{new Date(ev.at).toLocaleString()} — {ev.event}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
