import { useMemo } from 'react'
import { useCandidatesList, useUpdateCandidate } from '../hooks/useCandidates'
import { DndContext, useDroppable, useDraggable, closestCorners } from '@dnd-kit/core'

const stages = ['applied','screen','tech','offer','hired','rejected']

function Column({ id, children }){
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className="flex-1 bg-gray-50 border rounded p-2 min-h-[400px]">
      <div className="font-medium capitalize mb-2">{id}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Card({ candidate }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: candidate.id, data: candidate })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`p-2 rounded border bg-white shadow-sm ${isDragging?'ring-2 ring-indigo-400':''}`}>
      <div className="text-sm font-medium">{candidate.name}</div>
      <div className="text-xs text-gray-500">{candidate.email}</div>
    </div>
  )
}

export default function Pipeline(){
  // Pull all candidates into memory for a simple kanban (could be paginated/virtualized if needed)
  const { data } = useCandidatesList({ page: 1, pageSize: 2000 })
  const update = useUpdateCandidate()
  const grouped = useMemo(() => {
    const g = Object.fromEntries(stages.map(s => [s, []]))
    ;(data?.items||[]).forEach(c => g[c.stage]?.push(c))
    return g
  }, [data])

  return (
    <div className="grid grid-cols-3 gap-3">
      <DndContext collisionDetection={closestCorners} onDragEnd={async (event) => {
        const overId = event.over?.id
        const cand = event.active?.data?.current
        if (overId && cand && stages.includes(overId) && overId !== cand.stage) {
          try { await update.mutateAsync({ id: cand.id, updates: { stage: overId } }) }
          catch { /* ignore */ }
        }
      }}>
        {stages.map(s => (
          <Column key={s} id={s}>
            {(grouped[s]||[]).map(c => <Card key={c.id} candidate={c} />)}
          </Column>
        ))}
      </DndContext>
    </div>
  )
}
