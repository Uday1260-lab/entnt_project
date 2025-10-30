import { useState } from 'react'
import { useCandidatesList } from '../hooks/useCandidates'
import { FixedSizeList as List } from 'react-window'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'

const stages = ['applied','screen','tech','offer','hired','rejected']

export default function Candidates(){
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 200 // paginate big chunks, then virtualize within page
  const { data, isLoading, isError, error } = useCandidatesList({ search, stage, page, pageSize })
  const items = data?.items || []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm">Search</label>
          <input value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} className="border rounded px-2 py-1" placeholder="name/email" />
        </div>
        <div>
          <label className="block text-sm">Stage</label>
          <select value={stage} onChange={e=>{setStage(e.target.value); setPage(1)}} className="border rounded px-2 py-1">
            <option value="">All</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {!isLoading && !isError && (
        <>
          {items.length > 0 ? (
            <div className="h-[520px] border rounded bg-white">
              <List height={520} itemCount={items.length} itemSize={56} width={'100%'}>
                {({ index, style }) => {
                  const c = items[index]
                  return (
                    <div style={style} className="px-3 border-b flex items-center justify-between">
                      <div>
                        <div className="font-medium"><Link className="text-indigo-600" to={`/candidates/${c.id}`}>{c.name}</Link></div>
                        <div className="text-sm text-gray-500">{c.email}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-gray-100">{c.stage}</div>
                    </div>
                  )
                }}
              </List>
            </div>
          ) : (
            <div className="border rounded bg-white p-8 text-center text-gray-500">
              No entry
            </div>
          )}
        </>
      )}
    </div>
  )
}
