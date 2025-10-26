import { useParams } from 'react-router-dom'
import { useAssessment, useSaveAssessment, useSubmitAssessment } from '../hooks/useAssessments'
import { useState } from 'react'

function SectionEditor({ section, onChange }){
  const updateQuestion = (idx, q) => {
    const questions = section.questions.slice()
    questions[idx] = q
    onChange({ ...section, questions })
  }
  const addQuestion = () => {
    const q = { id: crypto.randomUUID(), type: 'shortText', label: 'New question', required: false }
    onChange({ ...section, questions: [...section.questions, q] })
  }
  return (
    <div className="space-y-2">
      <input className="border rounded px-2 py-1 w-full" value={section.title} onChange={e => onChange({ ...section, title: e.target.value })} />
      <div className="space-y-2">
        {section.questions.map((q,i)=> (
          <div key={q.id} className="border rounded p-2">
            <div className="flex gap-2">
              <select className="border rounded px-2 py-1" value={q.type} onChange={e=>updateQuestion(i,{...q, type:e.target.value})}>
                <option value="shortText">Short Text</option>
                <option value="longText">Long Text</option>
                <option value="singleChoice">Single Choice</option>
                <option value="multiChoice">Multi Choice</option>
                <option value="numeric">Numeric</option>
                <option value="file">File (stub)</option>
              </select>
              <input className="border rounded px-2 py-1 flex-1" value={q.label} onChange={e=>updateQuestion(i,{...q,label:e.target.value})} />
              <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={!!q.required} onChange={e=>updateQuestion(i,{...q,required:e.target.checked})} />Required</label>
            </div>
            {(q.type==='singleChoice' || q.type==='multiChoice') && (
              <input className="mt-2 border rounded px-2 py-1 w-full" placeholder="Comma-separated options" value={(q.options||[]).join(', ')} onChange={e=>updateQuestion(i,{...q, options: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
            )}
            {q.type==='numeric' && (
              <div className="mt-2 flex gap-2">
                <input className="border rounded px-2 py-1 w-24" type="number" placeholder="min" value={q.min??''} onChange={e=>updateQuestion(i,{...q, min: e.target.value===''?undefined:Number(e.target.value)})} />
                <input className="border rounded px-2 py-1 w-24" type="number" placeholder="max" value={q.max??''} onChange={e=>updateQuestion(i,{...q, max: e.target.value===''?undefined:Number(e.target.value)})} />
              </div>
            )}
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

export default function AssessmentBuilder(){
  const { jobId } = useParams()
  const { data } = useAssessment(jobId)
  const save = useSaveAssessment()
  const submit = useSubmitAssessment()
  const assessment = data || { jobId, sections: [] }

  const updateSection = (idx, sec) => {
    const next = { ...assessment, sections: assessment.sections.slice() }
    next.sections[idx] = sec
    save.mutate({ jobId, data: next })
  }
  const addSection = () => {
    const next = { ...assessment, sections: [...(assessment.sections||[]), { id: crypto.randomUUID(), title: 'New section', questions: [] }] }
    save.mutate({ jobId, data: next })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Builder</div>
          <button onClick={addSection} className="px-2 py-1 border rounded">+ Add section</button>
        </div>
        {(assessment.sections||[]).map((s,i)=> (
          <div key={s.id} className="border rounded p-3 bg-white">
            <SectionEditor section={s} onChange={sec => updateSection(i, sec)} />
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
