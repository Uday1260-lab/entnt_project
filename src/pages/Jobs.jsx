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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Openings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and organize your job postings</p>
        </div>
        {user?.role !== 'candidate' && (
          <Link to="/add-job" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Job
          </Link>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input 
              value={search} 
              onChange={e=>{setSearch(e.target.value); setPage(1)}} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              placeholder="Search by title, slug, or tags..." 
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={status} 
              onChange={e=>{setStatus(e.target.value); setPage(1)}} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {!isLoading && !isError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Actions</th>
                  </tr>
                </thead>
                <SortableContext items={items.map(j=>j.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-200">
                    {items.length > 0 ? (
                      items.map(job => (
                        <DraggableRow key={job.id} id={job.id}>
                          <td className="px-4 py-3 text-sm text-gray-600 font-medium">#{job.order}</td>
                          <td className="px-4 py-3">
                            <Link className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors" to={`/jobs/${job.id}`}>
                              {job.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              job.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status === 'active' && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                              )}
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(job.tags||[]).length > 0 ? (
                                (job.tags||[]).map((tag, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">No tags</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                onArchiveToggle(job)
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                job.status === 'active'
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                            >
                              {job.status === 'active' ? (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                  Archive
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Unarchive
                                </>
                              )}
                            </button>
                          </td>
                        </DraggableRow>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-12 text-center" colSpan={5}>
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm font-medium">No jobs found</p>
                            <p className="text-xs mt-1">Try adjusting your filters or create a new job</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        </div>
      )}

      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{items.length}</span> of <span className="font-medium text-gray-900">{total}</span> jobs
        </div>
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
