import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useCandidatesList, useUpdateCandidate } from '../hooks/useCandidates'

const stages = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700', icon: '📝' },
  { id: 'screen', label: 'Screening', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700', icon: '👀' },
  { id: 'tech', label: 'Technical', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700', icon: '💻' },
  { id: 'offer', label: 'Offer', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-700', icon: '📄' },
  { id: 'hired', label: 'Hired', color: 'bg-green-100 border-green-300', textColor: 'text-green-700', icon: '✅' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-300', textColor: 'text-red-700', icon: '❌' },
]

function CandidateCard({ candidate, isDragging }) {
  return (
    <div 
      className={`bg-white rounded-lg border-2 p-3 mb-2 cursor-move transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2 scale-95' : 'hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{candidate.name}</h4>
          <p className="text-sm text-gray-500 truncate">{candidate.email}</p>
        </div>
        <div className="ml-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {candidate.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      </div>
      
      {candidate.email && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">📧 {candidate.email.split('@')[1]}</span>
        </div>
      )}
    </div>
  )
}

function StageColumn({ stage, candidates, searchQuery }) {
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates
    const q = searchQuery.toLowerCase()
    return candidates.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q)
    )
  }, [candidates, searchQuery])

  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className={`rounded-t-lg border-2 ${stage.color} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stage.icon}</span>
            <h3 className={`font-bold text-lg ${stage.textColor}`}>{stage.label}</h3>
          </div>
          <span className={`${stage.textColor} font-semibold bg-white px-2 py-1 rounded-full text-sm`}>
            {filteredCandidates.length}
          </span>
        </div>
      </div>
      
      <div 
        className={`border-2 border-t-0 ${stage.color} rounded-b-lg p-3 bg-gray-50 min-h-[600px] max-h-[calc(100vh-250px)] overflow-y-auto`}
        data-stage={stage.id}
      >
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map(candidate => (
            <div key={candidate.id} data-candidate-id={candidate.id}>
              <CandidateCard candidate={candidate} />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No candidates</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pipeline(){
  const { data } = useCandidatesList({ page: 1, pageSize: 2000 })
  const update = useUpdateCandidate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const items = data?.items || []
  
  const candidatesByStage = useMemo(() => {
    const grouped = {}
    stages.forEach(stage => {
      grouped[stage.id] = items.filter(c => c.stage === stage.id)
    })
    return grouped
  }, [items])

  const activeCandidate = useMemo(() => {
    if (!activeId) return null
    return items.find(c => c.id === activeId)
  }, [activeId, items])

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const candidateId = active.id
    const candidate = items.find(c => c.id === candidateId)
    if (!candidate) return

    // Find the stage column that was dropped on
    let targetStage = over.data?.current?.stage || over.id
    
    // If dropped on another candidate, get that candidate's stage
    if (!targetStage) {
      const overElement = document.querySelector(`[data-candidate-id="${over.id}"]`)
      if (overElement) {
        const stageColumn = overElement.closest('[data-stage]')
        targetStage = stageColumn?.dataset?.stage
      }
    }

    if (!targetStage || targetStage === candidate.stage) return

    // Prevent backward moves
    const currentIdx = stages.findIndex(s => s.id === candidate.stage)
    const targetIdx = stages.findIndex(s => s.id === targetStage)
    if (targetIdx < currentIdx) return

    // Update candidate stage
    update.mutateAsync({ 
      id: candidateId, 
      updates: { stage: targetStage } 
    }).catch(() => {})
  }

  function handleDragOver(event) {
    const { over } = event
    if (!over) return

    // Handle dropping over stage column
    const stageColumn = document.querySelector(`[data-stage]`)
    if (stageColumn && over.id.includes) {
      // Stage hover logic can be added here
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Candidate Pipeline</h1>
            <p className="text-indigo-100">Drag and drop candidates to move them through stages</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{items.length}</div>
            <div className="text-sm text-indigo-100">Total Candidates</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              candidates={candidatesByStage[stage.id] || []}
              searchQuery={searchQuery}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard candidate={activeCandidate} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How to use</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Drag candidate cards to move them between stages</li>
              <li>• Candidates can only move forward (no backward moves)</li>
              <li>• Use the search bar to filter candidates</li>
              <li>• Each column shows the count of candidates in that stage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
