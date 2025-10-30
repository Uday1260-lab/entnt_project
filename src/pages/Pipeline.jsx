import { useMemo, useState } from 'react'
import { useCandidatesList, useUpdateCandidate } from '../hooks/useCandidates'
import Pagination from '../components/shared/Pagination'

const stages = ['applied','screen','tech','offer','hired','rejected']

export default function Pipeline(){
  // Pull all candidates; we will paginate client-side per stage tab
  const { data } = useCandidatesList({ page: 1, pageSize: 2000 })
  const update = useUpdateCandidate()
  const [tab, setTab] = useState('applied')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 10

  const items = data?.items || []
  const stageItems = useMemo(() => {
    const filtered = items.filter(c => c.stage === tab)
    if (!searchQuery.trim()) return filtered
    const q = searchQuery.toLowerCase()
    return filtered.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q)
    )
  }, [items, tab, searchQuery])
  const start = (page - 1) * pageSize
  const pageItems = stageItems.slice(start, start + pageSize)

  const onStageChange = async (id, currentStage, nextStage) => {
    if (nextStage === currentStage) return
    // Prevent backward move on client as well
    const idx = stages.indexOf(currentStage)
    const toIdx = stages.indexOf(nextStage)
    if (idx !== -1 && toIdx !== -1 && toIdx < idx) return
    try { await update.mutateAsync({ id, updates: { stage: nextStage } }) }
    catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-white border rounded p-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white rounded-t overflow-x-auto">
        {stages.map(s => (
          <button key={s} onClick={()=>{ setTab(s); setPage(1) }} className={`px-4 py-2 -mb-px border-b-2 capitalize ${tab===s ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white border rounded">
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
            {pageItems.length>0 ? (
              pageItems.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2 capitalize">{c.stage}</td>
                  <td className="p-2">
                    <select value={c.stage} onChange={(e)=>onStageChange(c.id, c.stage, e.target.value)} className="border rounded px-2 py-1">
                      {stages.map(s => (
                        <option key={s} value={s} disabled={stages.indexOf(s) < stages.indexOf(c.stage)}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-3 text-sm text-gray-500 text-center" colSpan={4}>No entry</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Pagination page={page} pageSize={pageSize} total={stageItems.length} onPageChange={setPage} />
      </div>
    </div>
  )
}
