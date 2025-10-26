import { useState } from 'react'
import { useCreateJob } from '../hooks/useJobs'

export default function AddNewJob(){
  const [form, setForm] = useState({ title: '', slug: '', description: '', salary: '', startDate: '', endDate: '', assessmentDate: '', assessmentDuration: 45 })
  const [files, setFiles] = useState([])
  const createJob = useCreateJob()
  const [error, setError] = useState('')

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title) { setError('Title is required'); return }
    const slug = (form.slug || form.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
    const toB64 = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file) })
    const attachments = await Promise.all((files||[]).map(async f => ({ id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, dataB64: await toB64(f) })))
    try {
      await createJob.mutateAsync({ ...form, slug, salary: form.salary?Number(form.salary):null, attachments })
      window.location.assign('/jobs')
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border rounded p-4">
      <h1 className="text-xl font-semibold mb-4">Add New Job</h1>
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={form.title} onChange={e=>onChange('title', e.target.value)} placeholder="Title" className="w-full border rounded px-3 py-2" />
        <input value={form.slug} onChange={e=>onChange('slug', e.target.value)} placeholder="Slug (optional)" className="w-full border rounded px-3 py-2" />
        <textarea value={form.description} onChange={e=>onChange('description', e.target.value)} rows={4} placeholder="Description" className="w-full border rounded px-3 py-2" />
        <input value={form.salary} onChange={e=>onChange('salary', e.target.value)} type="number" placeholder="Expected salary" className="w-full border rounded px-3 py-2" />
        <div>
          <label className="block text-sm">Attachments (PDF/Images)</label>
          <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} className="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Start date to apply</label>
            <input value={form.startDate} onChange={e=>onChange('startDate', e.target.value)} type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Last date to apply</label>
            <input value={form.endDate} onChange={e=>onChange('endDate', e.target.value)} type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Assessment date/time</label>
            <input value={form.assessmentDate} onChange={e=>onChange('assessmentDate', e.target.value)} type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Assessment duration (mins)</label>
            <input value={form.assessmentDuration} onChange={e=>onChange('assessmentDuration', e.target.value)} type="number" className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded">Create Job</button>
      </form>
    </div>
  )
}
