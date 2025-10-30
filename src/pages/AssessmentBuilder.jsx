import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useSaveAssessment, useSubmitAssessment } from '../hooks/useAssessments'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useJobsList } from '../hooks/useJobs'

function SectionEditor({ section, onChange }){
  const allowedForMarks = ['singleChoice','multiChoice','numeric']
  const updateQuestion = (idx, q) => {
    const questions = section.questions.slice()
    questions[idx] = q
    onChange({ ...section, questions })
  }
  const deleteQuestion = (idx) => {
    const questions = section.questions.slice()
    questions.splice(idx, 1)
    onChange({ ...section, questions })
  }
  const addQuestion = () => {
    const q = { id: crypto.randomUUID(), type: 'shortText', label: 'New question', required: false, hasMarks: false, marksCorrect: 1, marksIncorrect: 0 }
    onChange({ ...section, questions: [...section.questions, q] })
  }
  return (
    <div className="space-y-2">
      <input className="border rounded px-2 py-1 w-full" value={section.title} onChange={e => onChange({ ...section, title: e.target.value })} />
      <div className="space-y-2">
        {section.questions.map((q,i)=> (
          <div key={q.id} className="border rounded p-2">
            <div className="flex gap-2 items-start">
              <select className="border rounded px-2 py-1" value={q.type} onChange={e=>{
                const nextType = e.target.value
                const disallowMarks = !allowedForMarks.includes(nextType)
                const cleaned = { ...q, type: nextType }
                if (disallowMarks) {
                  cleaned.hasMarks = false
                  delete cleaned.correctOption
                  delete cleaned.correctOptions
                  delete cleaned.correctValue
                }
                updateQuestion(i, cleaned)
              }}>
                <option value="shortText">Short Text</option>
                <option value="longText">Long Text</option>
                <option value="singleChoice">Single Choice</option>
                <option value="multiChoice">Multi Choice</option>
                <option value="numeric">Numeric</option>
                <option value="file">File (stub)</option>
              </select>
              <input className="border rounded px-2 py-1 flex-1" value={q.label} onChange={e=>updateQuestion(i,{...q,label:e.target.value})} />
              <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={!!q.required} onChange={e=>updateQuestion(i,{...q,required:e.target.checked})} />Required</label>
              <button type="button" onClick={()=>deleteQuestion(i)} className="ml-auto text-sm px-2 py-1 border rounded text-red-600">Delete</button>
            </div>
            {(q.type==='singleChoice' || q.type==='multiChoice') && (
              <input
                className="mt-2 border rounded px-2 py-1 w-full"
                placeholder="Comma-separated options"
                value={q.optionsText ?? (q.options||[]).join(', ')}
                onChange={e=>{
                  const text = e.target.value
                  const opts = text.split(',').map(s=>s.trim()).filter(Boolean)
                  // keep answer key consistent with options
                  let next = { ...q, optionsText: text, options: opts }
                  if (q.type==='singleChoice') {
                    if (next.correctOption && !opts.includes(next.correctOption)) next.correctOption = undefined
                  }
                  if (q.type==='multiChoice') {
                    const corr = Array.isArray(next.correctOptions) ? next.correctOptions.filter(o=>opts.includes(o)) : []
                    next.correctOptions = corr
                  }
                  updateQuestion(i, next)
                }}
              />
            )}
            {q.type==='numeric' && (
              <div className="mt-2 flex gap-2">
                <input className="border rounded px-2 py-1 w-24" type="number" placeholder="min" value={q.min??''} onChange={e=>updateQuestion(i,{...q, min: e.target.value===''?undefined:Number(e.target.value)})} />
                <input className="border rounded px-2 py-1 w-24" type="number" placeholder="max" value={q.max??''} onChange={e=>updateQuestion(i,{...q, max: e.target.value===''?undefined:Number(e.target.value)})} />
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-3 items-center">
              {allowedForMarks.includes(q.type) && (
                <label className="text-sm flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!q.hasMarks}
                    onChange={e=>{
                      const checked = e.target.checked
                      updateQuestion(i, { ...q, hasMarks: checked, marksCorrect: checked ? (q.marksCorrect ?? 1) : q.marksCorrect, marksIncorrect: checked ? (q.marksIncorrect ?? 0) : q.marksIncorrect })
                    }}
                  /> Has marks
                </label>
              )}
              {q.hasMarks && allowedForMarks.includes(q.type) && (
                <>
                  <label className="text-sm flex items-center gap-1">
                    Correct
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20 ml-1"
                      value={q.marksCorrect ?? 1}
                      onChange={e=>updateQuestion(i,{...q, marksCorrect: e.target.value===''?0:Number(e.target.value)})}
                    />
                  </label>
                  <label className="text-sm flex items-center gap-1">
                    Incorrect
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20 ml-1"
                      value={q.marksIncorrect ?? 0}
                      onChange={e=>updateQuestion(i,{...q, marksIncorrect: e.target.value===''?0:Number(e.target.value)})}
                    />
                  </label>
                  {(q.type==='singleChoice' && (q.options||[]).length>0) && (
                    <div className="w-full mt-1">
                      <div className="text-xs text-gray-600 mb-1">Select correct answer</div>
                      <div className="flex gap-3 flex-wrap">
                        {(q.options||[]).map(opt => (
                          <label key={opt} className="text-sm">
                            <input
                              type="radio"
                              name={`corr-${q.id}`}
                              checked={q.correctOption===opt}
                              onChange={()=>updateQuestion(i,{...q, correctOption: opt})}
                            /> {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {(q.type==='multiChoice' && (q.options||[]).length>0) && (
                    <div className="w-full mt-1">
                      <div className="text-xs text-gray-600 mb-1">Select all correct answers</div>
                      <div className="flex gap-3 flex-wrap">
                        {(q.options||[]).map(opt => {
                          const corr = Array.isArray(q.correctOptions) ? q.correctOptions : []
                          const checked = corr.includes(opt)
                          return (
                            <label key={opt} className="text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e)=>{
                                  const next = checked ? corr.filter(x=>x!==opt) : [...corr, opt]
                                  updateQuestion(i, { ...q, correctOptions: next })
                                }}
                              /> {opt}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {q.type==='numeric' && (
                    <label className="text-sm flex items-center gap-1 w-full">
                      Correct value
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-28 ml-1"
                        value={q.correctValue??''}
                        onChange={e=>updateQuestion(i,{...q, correctValue: e.target.value===''?undefined:Number(e.target.value)})}
                      />
                    </label>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="px-2 py-1 border rounded">+ Add question</button>
      </div>
    </div>
  )
}

function Preview({ assessment, onSubmitMock }){
  const [answers, setAnswers] = useState({})
  const set = (id, v) => setAnswers(a => ({ ...a, [id]: v }))

  const validate = () => {
    const errors = []
    for (const s of assessment.sections||[]) {
      for (const q of s.questions||[]) {
        const v = answers[q.id]
        if (q.required && (v===undefined || v==='' || (Array.isArray(v) && v.length===0))) errors.push(`${q.label} is required`)
        if (q.type==='numeric') {
          if (v!==undefined) {
            if (q.min!=null && v<q.min) errors.push(`${q.label} must be >= ${q.min}`)
            if (q.max!=null && v>q.max) errors.push(`${q.label} must be <= ${q.max}`)
          }
        }
        if ((q.type==='shortText' || q.type==='longText') && q.maxLength && v && v.length>q.maxLength) errors.push(`${q.label} exceeds max length`)
      }
    }
    return errors
  }

  const onSubmit = () => {
    const errs = validate()
    if (errs.length) { alert(errs.join('\n')); return }
    onSubmitMock(answers)
  }

  const renderField = (q) => {
    switch(q.type){
      case 'shortText': return <input className="border rounded px-2 py-1 w-full" value={answers[q.id]||''} onChange={e=>set(q.id,e.target.value)} />
      case 'longText': return <textarea className="border rounded px-2 py-1 w-full" rows={4} value={answers[q.id]||''} onChange={e=>set(q.id,e.target.value)} />
      case 'singleChoice': return (
        <div className="flex gap-3 flex-wrap">
          {(q.options||[]).map(opt => (
            <label key={opt} className="text-sm"><input type="radio" name={q.id} checked={answers[q.id]===opt} onChange={()=>set(q.id,opt)} /> {opt}</label>
          ))}
        </div>
      )
      case 'multiChoice': return (
        <div className="flex gap-3 flex-wrap">
          {(q.options||[]).map(opt => {
            const arr = Array.isArray(answers[q.id]) ? answers[q.id] : []
            const checked = arr.includes(opt)
            return <label key={opt} className="text-sm"><input type="checkbox" checked={checked} onChange={(e)=>{
              const next = checked ? arr.filter(x=>x!==opt) : [...arr,opt]
              set(q.id, next)
            }} /> {opt}</label>
          })}
        </div>
      )
      case 'numeric': return <input type="number" className="border rounded px-2 py-1 w-40" value={answers[q.id]??''} onChange={e=>set(q.id, e.target.value===''?undefined:Number(e.target.value))} />
      case 'file': return <div className="text-sm text-gray-500">File upload stub (not persisted)</div>
    }
  }

  return (
    <div className="space-y-4">
      {(assessment.sections||[]).map(sec => (
        <div key={sec.id} className="border rounded p-3 bg-white">
          <div className="font-medium mb-3">{sec.title}</div>
          <div className="space-y-3">
            {(sec.questions||[]).map(q => (
              <div key={q.id}>
                <div className="text-sm mb-1">{q.label}{q.required && <span className="text-red-600">*</span>}</div>
                {renderField(q)}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={onSubmit} className="px-3 py-2 bg-indigo-600 text-white rounded">Submit (mock)</button>
    </div>
  )
}

function CountdownTimer({ assessmentDate, durationMinutes }) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now()
      const startTime = new Date(assessmentDate).getTime()
      const endTime = startTime + (durationMinutes * 60 * 1000)
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      return remaining
    }

    // Set initial time
    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        alert('Time is up! Please submit your assessment.')
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [assessmentDate, durationMinutes])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isLowTime = timeLeft <= 300 // 5 minutes or less

  return (
    <div className={`px-3 py-2 rounded border ${isLowTime ? 'bg-red-50 border-red-300 text-red-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}>
      <div className="text-xs font-medium">Time Remaining</div>
      <div className="text-lg font-bold">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  )
}

export default function AssessmentBuilder(){
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data } = useAssessment(jobId)
  const save = useSaveAssessment()
  const submit = useSubmitAssessment()
  const assessment = data || { jobId, sections: [] }
  const { data: jobsData } = useJobsList({ page: 1, pageSize: 1000 })
  const job = jobsData?.items?.find(j => j.id===jobId)
  const now = Date.now()
  const builderLocked = user?.role!=='candidate' && job?.assessmentDate && new Date(job.assessmentDate).getTime() <= now
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [checkingSubmission, setCheckingSubmission] = useState(true)

  // Check if candidate has already submitted assessment
  useEffect(() => {
    if (user?.role === 'candidate' && user?.id && jobId) {
      (async () => {
        try {
          const res = await fetch(`/submissions/by-job-candidate/${jobId}/${user.id}`)
          setAlreadySubmitted(res.ok)
        } catch {
          setAlreadySubmitted(false)
        } finally {
          setCheckingSubmission(false)
        }
      })()
    } else {
      setCheckingSubmission(false)
    }
  }, [user?.role, user?.id, jobId])

  const updateSection = (idx, sec) => {
    const next = { ...assessment, sections: assessment.sections.slice() }
    next.sections[idx] = sec
    save.mutate({ jobId, data: next })
  }
  const addSection = () => {
    const next = { ...assessment, sections: [...(assessment.sections||[]), { id: crypto.randomUUID(), title: 'New section', questions: [] }] }
    save.mutate({ jobId, data: next })
  }

  if (user?.role === 'candidate') {
    if (checkingSubmission) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Checking submission status...</div>
        </div>
      )
    }

    if (alreadySubmitted) {
      return (
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-xl font-semibold text-yellow-800 mb-2">
              Assessment Already Submitted
            </div>
            <p className="text-yellow-700 mb-4">
              You have already completed this assessment. Each candidate can only submit once per job.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Return to Jobs
            </button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Assessment</div>
          {job?.assessmentDate && job?.assessmentDuration && (
            <CountdownTimer assessmentDate={job.assessmentDate} durationMinutes={job.assessmentDuration} />
          )}
        </div>
        <Preview assessment={assessment} onSubmitMock={async (answers)=> {
          try {
            const result = await submit.mutateAsync({ jobId, candidateId: user.id, answers })
            // Mark as submitted locally
            setAlreadySubmitted(true)
            alert(`Assessment submitted successfully!\n\nAttempted: ${result.attempted}\nCorrect: ${result.correct}\nIncorrect: ${result.incorrect}\nSkipped: ${result.skipped}${result.marks != null ? `\nTotal Marks: ${result.marks}` : ''}`)
            // Redirect to applied jobs page
            navigate('/jobs')
          } catch (error) {
            // Check if it's a duplicate submission error
            if (error.status === 400 || error.message?.toLowerCase().includes('already submitted')) {
              setAlreadySubmitted(true)
              alert('You have already submitted this assessment.')
            } else {
              alert('Failed to submit assessment. Please try again.')
            }
            console.error('Submission error:', error)
          }
        }} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Builder {builderLocked && <span className="text-xs text-red-600">(locked after assessment date)</span>}</div>
          {!builderLocked && <button onClick={addSection} className="px-2 py-1 border rounded">+ Add section</button>}
        </div>
        {(assessment.sections||[]).map((s,i)=> (
          <div key={s.id} className="border rounded p-3 bg-white">
            {!builderLocked ? (
              <SectionEditor section={s} onChange={sec => updateSection(i, sec)} />
            ) : (
              <div className="opacity-60 pointer-events-none">
                <SectionEditor section={s} onChange={()=>{}} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <div className="font-semibold mb-3">Live preview</div>
        <Preview assessment={assessment} onSubmitMock={(answers)=> submit.mutate({ jobId, candidateId: 'demo', answers })} />
      </div>
    </div>
  )
}
