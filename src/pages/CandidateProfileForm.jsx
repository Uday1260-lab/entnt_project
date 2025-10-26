import { useEffect, useState } from 'react'

export default function CandidateProfileForm(){
  const [form, setForm] = useState({ name: '', education: '', experience: '' })
  const [imageFile, setImageFile] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const res = await fetch('/candidate/profile')
      if (res.ok) {
        const p = await res.json()
        setForm({ name: p.name||'', education: p.education||'', experience: p.experience||'' })
      }
      setLoading(false)
    })()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // required fields
    if (!form.name.trim() || !imageFile || !resumeFile || !form.education.trim() || !form.experience.trim()) {
      setError('All fields are required');
      return
    }

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const [imageB64, resumeB64] = await Promise.all([
      fileToDataUrl(imageFile),
      fileToDataUrl(resumeFile),
    ])

  const payload = { name: form.name, education: form.education, experience: form.experience, imageB64, resumeB64 }

    const res = await fetch('/candidate/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) { setError('Failed to save profile'); return }
    // After completion, redirect to jobs page
    window.location.assign('/jobs')
  }

  if (loading) return null

  return (
    <div className="max-w-xl mx-auto bg-white border rounded p-4 mt-8">
      <h1 className="text-xl font-semibold mb-4">Complete your Profile</h1>
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Full name (required)</label>
          <input value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Your full name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Profile image (required)</label>
          <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0]||null)} className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Resume (any format, required)</label>
          <input type="file" onChange={e=>setResumeFile(e.target.files?.[0]||null)} className="w-full" />
        </div>
        
        <textarea value={form.education} onChange={e=>setForm(f=>({ ...f, education: e.target.value }))} rows={3} placeholder="Education details" className="w-full border rounded px-3 py-2" />
        <textarea value={form.experience} onChange={e=>setForm(f=>({ ...f, experience: e.target.value }))} rows={3} placeholder="Prior work experience" className="w-full border rounded px-3 py-2" />
        <button className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Save and Continue</button>
      </form>
    </div>
  )
}
