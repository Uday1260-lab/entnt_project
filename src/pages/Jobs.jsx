import { useMemo, useState } from 'react'
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useJobsList, useReorderJob, useUpdateJob } from '../hooks/useJobs'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import Pagination from '../components/shared/Pagination'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CandidateJobs from './CandidateJobs.jsx'

export default function Jobs(){
  const { user } = useAuth()
  if (user?.role === 'candidate') {
    // Render the candidate-specific jobs view (previously My Jobs) directly on /jobs
    return <CandidateJobs />
  }
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, isLoading, isError, error } = useJobsList({ search, status, page, pageSize, sort: 'order:asc' })
  const updateJob = useUpdateJob()
  const reorder = useReorderJob()

  const onArchiveToggle = async (job) => {
    console.log('Archive toggle clicked for:', job.id, job.status)
    try { 
      const result = await updateJob.mutateAsync({ id: job.id, updates: { status: job.status === 'active' ? 'archived' : 'active' } })
      console.log('Archive toggle result:', result)
    }
    catch (e) { 
      console.error('Archive toggle error:', e)
      alert(e.message) 
    }
  }

  const onReorder = async (fromAbs, toAbs, jobId) => {
    if (!data) return
    if (fromAbs === toAbs) return
    try { await reorder.mutateAsync({ id: jobId, fromOrder: fromAbs, toOrder: toAbs }) }
    catch (e) { alert('Reorder failed, rolled back.') }
  }

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm">Search</label>
          <input value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} className="border rounded px-2 py-1" placeholder="title/slug/tag" />
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="border rounded px-2 py-1">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {user?.role !== 'candidate' && (
          <Link to="/add-job" className="ml-auto px-3 py-2 bg-indigo-600 text-white rounded">New Job</Link>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded border bg-white">
          <DndContext collisionDetection={closestCenter} onDragEnd={(event)=>{
            const activeId = event.active.id
            const overId = event.over?.id
            if (!overId || activeId===overId) return
            const fromIdx = items.findIndex(j => j.id===activeId)
            const toIdx = items.findIndex(j => j.id===overId)
            if (fromIdx===-1 || toIdx===-1) return
            const fromAbs = (page-1)*pageSize + fromIdx + 1
            const toAbs = (page-1)*pageSize + toIdx + 1
            onReorder(fromAbs, toAbs, activeId)
          }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2 w-16">Order</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Tags</th>
                  <th className="p-2 w-40">Actions</th>
                </tr>
              </thead>
              <SortableContext items={items.map(j=>j.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.length > 0 ? (
                    items.map(job => (
                      <DraggableRow key={job.id} id={job.id}>
                        <td className="p-2">{job.order}</td>
                        <td className="p-2"><Link className="text-indigo-600" to={`/jobs/${job.id}`}>{job.title}</Link></td>
                        <td className="p-2">{job.status}</td>
                        <td className="p-2">{(job.tags||[]).join(', ')}</td>
                        <td className="p-2 flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              onArchiveToggle(job)
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {job.status==='active'?'Archive':'Unarchive'}
                          </button>
                        </td>
                      </DraggableRow>
                    ))
                  ) : (
                    <tr><td className="p-3 text-sm text-gray-500 text-center" colSpan={5}>No entry</td></tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}

        <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">Total: {total}</div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}

function DraggableRow({ id, children }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  
  // Clone children and add drag listeners only to non-action cells
  const childrenArray = Array.isArray(children) ? children : [children]
  const modifiedChildren = childrenArray.map((child, index) => {
    // Last cell is actions - don't add drag listeners
    if (index === childrenArray.length - 1) {
      return child
    }
    // Add drag listeners to other cells
    return <td key={index} {...attributes} {...listeners} className={child.props.className}>{child.props.children}</td>
  })
  
  return (
    <tr ref={setNodeRef} style={style} className={`border-t ${isDragging?'ring-2 ring-indigo-400':''}`}>
      {modifiedChildren}
    </tr>
  )
}
