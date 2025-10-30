import { createServer, Response } from 'miragejs'
import { db } from '../persistence/db'
import { seedAll } from './seeds'
import { randomDelay, maybeFail } from './utils'

export function makeServer({ environment = 'development' } = {}) {
  const server = createServer({
    environment,
    routes() {
      this.timing = 0 // we'll control latency manually
      this.namespace = ''
      const stageOrder = ['applied','screen','tech','offer','hired','rejected']

      // Jobs
      this.get('/jobs', async (schema, request) => {
        await randomDelay()
        const { search = '', status = '', page = '1', pageSize = '10', sort = 'order:asc', audience = '' } = Object.fromEntries(new URLSearchParams(request.queryParams))
        const [sortField, sortDir] = sort.split(':')
        const ps = parseInt(pageSize, 10)
        const p = parseInt(page, 10)

        let jobs = await db.jobs.toArray()
        // Candidate audience: hide jobs past last apply date from "new" listings; we'll filter in UI too for clarity
        if (audience === 'candidate') {
          const now = Date.now()
          jobs = jobs.filter(j => !j.endDate || new Date(j.endDate).getTime() >= now)
        }
        if (search) {
          const q = search.toLowerCase()
          jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.slug.includes(q) || (j.tags||[]).some(t => t.toLowerCase().includes(q)))
        }
        if (status) {
          jobs = jobs.filter(j => j.status === status)
        }
        jobs.sort((a,b) => {
          const av = a[sortField]
          const bv = b[sortField]
          if (av < bv) return sortDir === 'asc' ? -1 : 1
          if (av > bv) return sortDir === 'asc' ? 1 : -1
          return 0
        })
        const total = jobs.length
        const start = (p - 1) * ps
        const items = jobs.slice(start, start + ps)
        return { items, total, page: p, pageSize: ps }
      })

      this.post('/jobs', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const body = JSON.parse(request.requestBody || '{}')
        const existingSlug = await db.jobs.where('slug').equals(body.slug).first()
        if (!body.title || !body.slug || existingSlug) {
          return new Response(400, {}, { message: 'Validation failed: title and unique slug required' })
        }
        const order = (await db.jobs.count()) + 1
        const job = { id: crypto.randomUUID(), status: 'active', tags: [], order, description: body.description||'', salary: body.salary||null, attachments: body.attachments||[], startDate: body.startDate||null, endDate: body.endDate||null, assessmentDate: body.assessmentDate||null, assessmentDuration: body.assessmentDuration||null, ...body }
        await db.jobs.add(job)
        return job
      })

      this.patch('/jobs/:id', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const updates = JSON.parse(request.requestBody || '{}')
        // If updating scheduling fields after startDate passed, reject
        const job = await db.jobs.get(id)
        const now = Date.now()
        if (job?.startDate && new Date(job.startDate).getTime() <= now) {
          const forbiddenKeys = ['title','description','salary','attachments','startDate','endDate','assessmentDate','assessmentDuration']
          if (Object.keys(updates).some(k => forbiddenKeys.includes(k))) {
            return new Response(400, {}, { message: 'Job details locked after start date' })
          }
        }
        await db.jobs.update(id, updates)
        const updated = await db.jobs.get(id)
        return updated
      })

      this.patch('/jobs/:id/reorder', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true, rate: 0.1 })
        const { id } = request.params
        const { fromOrder, toOrder } = JSON.parse(request.requestBody || '{}')
        if (typeof fromOrder !== 'number' || typeof toOrder !== 'number') {
          return new Response(400, {}, { message: 'fromOrder and toOrder required' })
        }
        const jobs = await db.jobs.orderBy('order').toArray()
        const moved = jobs.find(j => j.id === id)
        if (!moved) return new Response(404)
        // Reorder
        const without = jobs.filter(j => j.id !== id)
        without.splice(toOrder - 1, 0, moved)
        await db.transaction('rw', db.jobs, async () => {
          for (let i = 0; i < without.length; i++) {
            without[i].order = i + 1
            await db.jobs.put(without[i])
          }
        })
        return { success: true }
      })

      // Candidates
      this.get('/candidates', async (_, request) => {
        await randomDelay()
        const { search = '', stage = '', page = '1', pageSize = '50' } = Object.fromEntries(new URLSearchParams(request.queryParams))
        const ps = parseInt(pageSize, 10)
        const p = parseInt(page, 10)
        let items = await db.candidates.toArray()
        if (search) {
          const q = search.toLowerCase()
          items = items.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        }
        if (stage) items = items.filter(c => c.stage === stage)
        const total = items.length
        const start = (p - 1) * ps
        const pageItems = items.slice(start, start + ps)
        return { items: pageItems, total, page: p, pageSize: ps }
      })

      // Fetch single candidate
      this.get('/candidates/:id', async (_, request) => {
        await randomDelay()
        const { id } = request.params
        const cand = await db.candidates.get(id)
        if (!cand) return new Response(404)
        return cand
      })

      this.post('/candidates', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const body = JSON.parse(request.requestBody || '{}')
        const candidate = { id: crypto.randomUUID(), stage: 'applied', ...body }
        await db.candidates.add(candidate)
        await db.timelines.add({ id: crypto.randomUUID(), candidateId: candidate.id, at: Date.now(), event: 'applied' })
        return candidate
      })

      this.patch('/candidates/:id', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const updates = JSON.parse(request.requestBody || '{}')
        if (updates.stage) {
          const cand = await db.candidates.get(id)
          const fromIdx = stageOrder.indexOf(cand?.stage)
          const toIdx = stageOrder.indexOf(updates.stage)
          if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx) {
            return new Response(400, {}, { message: 'Stage cannot move backward' })
          }
        }
        await db.candidates.update(id, updates)
        if (updates.stage) {
          await db.timelines.add({ id: crypto.randomUUID(), candidateId: id, at: Date.now(), event: `stage:${updates.stage}` })
        }
        const cand = await db.candidates.get(id)
        return cand
      })

      this.get('/candidates/:id/timeline', async (_, request) => {
        await randomDelay()
        const { id } = request.params
        const items = await db.timelines.where('candidateId').equals(id).sortBy('at')
        return { items }
      })

      // Assessments
      this.get('/assessments/:jobId', async (_, request) => {
        const { jobId } = request.params
        const a = await db.assessments.where('jobId').equals(jobId).first()
        return a || { jobId, sections: [] }
      })

      this.put('/assessments/:jobId', async (_, request) => {
        await maybeFail({ write: true })
        const { jobId } = request.params
        const body = JSON.parse(request.requestBody || '{}')
        await db.assessments.put({ jobId, ...body })
        return { ok: true }
      })

      this.post('/assessments/:jobId/submit', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { jobId } = request.params
        const body = JSON.parse(request.requestBody || '{}')
        
        // Check if already submitted
        const existingSubmission = await db.submissions.where('[jobId+candidateId]').equals([jobId, body.candidateId]).first().catch(()=>null)
        if (existingSubmission) {
          return new Response(400, {}, { message: 'Assessment already submitted for this job' })
        }
        
        const submission = { id: crypto.randomUUID(), jobId, candidateId: body.candidateId, at: Date.now(), answers: body.answers }
        await db.submissions.add(submission)
        // scoring: prefer stored answer key when provided (for questions with marks), else fallback heuristic
        let attempted = 0, correct = 0, incorrect = 0, skipped = 0, marks = 0
        const a = await db.assessments.where('jobId').equals(jobId).first()
        const allQs = (a?.sections||[]).flatMap(s => s.questions||[])
        for (const q of allQs) {
          const v = body.answers?.[q.id]
          if (v==='' || v===undefined || (Array.isArray(v)&&v.length===0)) { skipped++; continue }
          attempted++
          let isCorrect = false
          const markable = !!q.hasMarks && (q.type==='singleChoice' || q.type==='multiChoice' || q.type==='numeric')
          // Use explicit answer key when available for marked questions of allowed types
          if (markable) {
            if (q.type==='singleChoice' && q.correctOption!=null) {
              isCorrect = (v === q.correctOption)
            } else if (q.type==='multiChoice' && Array.isArray(q.correctOptions)) {
              const arr = Array.isArray(v) ? v.slice().sort() : []
              const corr = q.correctOptions.slice().sort()
              isCorrect = (arr.length===corr.length && arr.every((x,idx)=>x===corr[idx]))
            } else if (q.type==='numeric' && q.correctValue!=null) {
              isCorrect = (v === q.correctValue)
            }
          }
          // Fallback heuristic when no explicit answer key was provided
          if (!isCorrect && !markable) {
            if (q.type==='singleChoice' && q.options?.includes('Yes')) {
              isCorrect = (v==='Yes')
            }
          }
          if (isCorrect) correct++; else incorrect++
          if (markable) {
            const c = (q.marksCorrect ?? 1)
            const ic = (q.marksIncorrect ?? 0)
            marks += isCorrect ? c : ic
          }
        }
        // store in applications if exists
        const app = await db.applications.where('[jobId+candidateId]').equals([jobId, body.candidateId]).first().catch(()=>null)
        if (app) {
          app.assessmentScore = correct
          app.attempted = attempted
          app.correct = correct
          app.incorrect = incorrect
          app.skipped = skipped
          app.marks = marks
          await db.applications.put(app)
        }
        return { ok: true, id: submission.id, attempted, correct, incorrect, skipped, marks }
      })

      // Get submission details for HR/admin
      this.get('/submissions/:submissionId', async (_, request) => {
        await randomDelay()
        const { submissionId } = request.params
        const sub = await db.submissions.get(submissionId)
        if (!sub) return new Response(404)
        return sub
      })

      // Get submission by job and candidate
      this.get('/submissions/by-job-candidate/:jobId/:candidateId', async (_, request) => {
        await randomDelay()
        const { jobId, candidateId } = request.params
        const sub = await db.submissions.where('[jobId+candidateId]').equals([jobId, candidateId]).first().catch(()=>null)
        if (!sub) return new Response(404)
        return sub
      })

      // Admin maintenance: reset jobs/candidates data and reseed
      this.post('/admin/reset-data', async () => {
        await randomDelay()
        await db.jobs.clear()
        await db.candidates.clear()
        await db.timelines.clear()
        await db.assessments.clear()
        await db.submissions.clear()
        await db.applications.clear().catch(()=>{})
        // Do not clear users or candidateProfiles
        await seedAll()
        return { ok: true }
      })

      // Admin maintenance: factory reset EVERYTHING and reseed (including users)
      this.post('/admin/factory-reset', async () => {
        await randomDelay()
        // Clear session
        localStorage.removeItem('sessionUserId')
        // Drop database entirely and reopen with schema, then reseed
        await db.delete()
        await db.open()
        await seedAll()
        return { ok: true }
      })

      // Auth
      this.post('/auth/register', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const body = JSON.parse(request.requestBody || '{}')
        const exists = await db.users.where('email').equals((body.email||'').toLowerCase()).first()
        if (exists) return new Response(400, {}, { message: 'Email already registered' })
        const user = { id: crypto.randomUUID(), email: (body.email||'').toLowerCase(), role: 'candidate', phone: body.phone||'', address: body.address||'', postalCode: body.postalCode||'', password: body.password }
        await db.users.add(user)
        // create empty profile
        await db.candidateProfiles.put({ candidateId: user.id })
        localStorage.setItem('sessionUserId', user.id)
        return { id: user.id, email: user.email, role: user.role }
      })

      this.post('/auth/login', async (_, request) => {
        await randomDelay()
        const body = JSON.parse(request.requestBody || '{}')
        const user = await db.users.where('email').equals((body.email||'').toLowerCase()).first()
        if (!user || user.password !== body.password) return new Response(401, {}, { message: 'Invalid credentials' })
        localStorage.setItem('sessionUserId', user.id)
        return { id: user.id, email: user.email, role: user.role }
      })

      this.post('/auth/logout', async () => {
        await randomDelay()
        localStorage.removeItem('sessionUserId')
        return { ok: true }
      })

      this.get('/me', async () => {
        await randomDelay(50,150)
        const id = localStorage.getItem('sessionUserId')
        if (!id) return new Response(401)
        const u = await db.users.get(id)
        if (!u) return new Response(401)
        return { id: u.id, email: u.email, role: u.role }
      })

      // Users (admin-only in UI)
      this.get('/users', async () => {
        await randomDelay()
        const list = await db.users.toArray()
        return { items: list }
      })
      // Admin create user without logging in
      this.post('/admin/users', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const body = JSON.parse(request.requestBody || '{}')
        const email = (body.email||'').toLowerCase().trim()
        const role = body.role
        const password = body.password || 'changeme'
        if (!email || !['admin','hr-team'].includes(role)) return new Response(400, {}, { message: 'Email and role (admin|hr-team) required' })
        const exists = await db.users.where('email').equals(email).first()
        if (exists) return new Response(400, {}, { message: 'Email already exists' })
        const u = { id: crypto.randomUUID(), email, role, password, phone: '', address: '', postalCode: '' }
        await db.users.add(u)
        // Also create empty profile for completeness
        await db.candidateProfiles.put({ candidateId: u.id }).catch(()=>{})
        return { id: u.id, email: u.email, role: u.role }
      })
      this.get('/users/:id', async (_, request) => {
        await randomDelay()
        const { id } = request.params
        const u = await db.users.get(id)
        if (!u) return new Response(404)
        return { id: u.id, email: u.email, role: u.role, phone: u.phone||'', address: u.address||'', postalCode: u.postalCode||'' }
      })

      this.patch('/users/:id/role', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const { role } = JSON.parse(request.requestBody || '{}')
        if (!['admin','hr-team','candidate'].includes(role)) return new Response(400)
        await db.users.update(id, { role })
        const u = await db.users.get(id)
        return { id: u.id, email: u.email, role: u.role }
      })

      // Candidate profile
      this.get('/candidate/profile', async () => {
        await randomDelay()
        const id = localStorage.getItem('sessionUserId')
        if (!id) return new Response(401)
        const p = await db.candidateProfiles.where('candidateId').equals(id).first()
        return p || { candidateId: id }
      })
      this.get('/candidate/profile/:id', async (_, request) => {
        await randomDelay()
        const { id } = request.params
        const p = await db.candidateProfiles.where('candidateId').equals(id).first()
        return p || { candidateId: id }
      })
      this.put('/candidate/profile', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const id = localStorage.getItem('sessionUserId')
        if (!id) return new Response(401)
        const body = JSON.parse(request.requestBody || '{}')
        const profile = { candidateId: id, ...body, completedAt: Date.now() }
        await db.candidateProfiles.put(profile)
        return profile
      })

      // Applications
      this.post('/applications', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const id = localStorage.getItem('sessionUserId')
        if (!id) return new Response(401)
        const body = JSON.parse(request.requestBody || '{}')
        // window to apply
        const job = await db.jobs.get(body.jobId)
        const now = Date.now()
        if (job?.startDate && new Date(job.startDate).getTime() > now) return new Response(400, {}, { message: 'Applications not open yet' })
        if (job?.endDate && new Date(job.endDate).getTime() < now) return new Response(400, {}, { message: 'Applications closed' })
        const existing = await db.applications.where('[jobId+candidateId]').equals([body.jobId, id]).first().catch(()=>null)
        if (existing) return existing
        const user = await db.users.get(id).catch(()=>null)
        const profile = await db.candidateProfiles.where('candidateId').equals(id).first().catch(()=>null)
        const email = user?.email || ''
        let candidateName = ''
        if (profile?.name) {
          candidateName = profile.name
        } else if (email) {
          const local = email.split('@')[0]
          candidateName = local.split(/[._-]+/).map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ')
        }
        const app = { id: crypto.randomUUID(), jobId: body.jobId, candidateId: id, candidateEmail: email, candidateName, appliedAt: Date.now(), stage: 'applied' }
        await db.applications.add(app)
        return app
      })
      this.get('/applications', async (_, request) => {
        await randomDelay()
        const qp = Object.fromEntries(new URLSearchParams(request.queryParams))
        let items = await db.applications.toArray()
        if (qp.candidateId) items = items.filter(a => a.candidateId === qp.candidateId)
        if (qp.jobId) items = items.filter(a => a.jobId === qp.jobId)
        
        // Auto-reject candidates who didn't take assessment after deadline
        const now = Date.now()
        const updatedItems = []
        for (const app of items) {
          // Skip if already rejected or if no assessment data
          if (app.stage === 'rejected') {
            updatedItems.push(app)
            continue
          }
          
          // Get job details to check assessment deadline
          const job = await db.jobs.get(app.jobId)
          if (job?.assessmentDate && job?.assessmentDuration) {
            const assessmentStart = new Date(job.assessmentDate).getTime()
            const assessmentEnd = assessmentStart + (job.assessmentDuration * 60 * 1000)
            
            // Check if assessment window has closed
            if (now > assessmentEnd) {
              // Check if candidate has submitted assessment
              const submission = await db.submissions.where('[jobId+candidateId]').equals([app.jobId, app.candidateId]).first().catch(()=>null)
              
              // If no submission and assessment is closed, auto-reject
              if (!submission && app.stage === 'applied') {
                app.stage = 'rejected'
                app.assessmentScore = 0
                app.attempted = 0
                app.correct = 0
                app.incorrect = 0
                app.skipped = 0
                app.marks = 0
                await db.applications.put(app)
              }
            }
          }
          updatedItems.push(app)
        }
        
        return { items: updatedItems }
      })
      this.get('/applications/:id', async (_, request) => {
        await randomDelay()
        const { id } = request.params
        const app = await db.applications.get(id)
        if (!app) return new Response(404)
        
        // Auto-reject if assessment deadline passed and not submitted
        if (app.stage !== 'rejected') {
          const now = Date.now()
          const job = await db.jobs.get(app.jobId)
          if (job?.assessmentDate && job?.assessmentDuration) {
            const assessmentStart = new Date(job.assessmentDate).getTime()
            const assessmentEnd = assessmentStart + (job.assessmentDuration * 60 * 1000)
            
            if (now > assessmentEnd) {
              const submission = await db.submissions.where('[jobId+candidateId]').equals([app.jobId, app.candidateId]).first().catch(()=>null)
              
              if (!submission && app.stage === 'applied') {
                app.stage = 'rejected'
                app.assessmentScore = 0
                app.attempted = 0
                app.correct = 0
                app.incorrect = 0
                app.skipped = 0
                app.marks = 0
                await db.applications.put(app)
              }
            }
          }
        }
        
        return app
      })
      this.patch('/applications/:id', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const updates = JSON.parse(request.requestBody || '{}')
        if (updates.stage) {
          const stageOrder = ['applied','screen','tech','offer','hired','rejected']
          const app = await db.applications.get(id)
          const fromIdx = stageOrder.indexOf(app?.stage)
          const toIdx = stageOrder.indexOf(updates.stage)
          
          // Special case: Allow candidates to accept (hired) or reject from "offer" stage
          if (app?.stage === 'offer' && (updates.stage === 'hired' || updates.stage === 'rejected')) {
            // This is allowed - candidate responding to offer
          } else if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx) {
            // Normal backward movement prevention
            return new Response(400, {}, { message: 'Stage cannot move backward' })
          }
        }
        await db.applications.update(id, updates)
        const app = await db.applications.get(id)
        return app
      })
    },
  })

  // Seed DB if empty
  seedAll()

  return server
}
