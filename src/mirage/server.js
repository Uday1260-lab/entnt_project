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
        await randomDelay()
        const { jobId } = request.params
        const a = await db.assessments.where('jobId').equals(jobId).first()
        return a || { jobId, sections: [] }
      })

      this.put('/assessments/:jobId', async (_, request) => {
        await randomDelay()
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
        const submission = { id: crypto.randomUUID(), jobId, candidateId: body.candidateId, at: Date.now(), answers: body.answers }
        await db.submissions.add(submission)
        // rudimentary scoring: if options contain 'Yes' and answer is 'Yes' count as correct, otherwise neutral
        let attempted = 0, correct = 0, incorrect = 0, skipped = 0
        const a = await db.assessments.where('jobId').equals(jobId).first()
        const allQs = (a?.sections||[]).flatMap(s => s.questions||[])
        for (const q of allQs) {
          const v = body.answers?.[q.id]
          if (v==='' || v===undefined || (Array.isArray(v)&&v.length===0)) { skipped++; continue }
          attempted++
          if (q.type==='singleChoice' && q.options?.includes('Yes')) {
            if (v==='Yes') correct++; else incorrect++
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
          await db.applications.put(app)
        }
        return { ok: true, id: submission.id, attempted, correct, incorrect, skipped }
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
        const app = { id: crypto.randomUUID(), jobId: body.jobId, candidateId: id, appliedAt: Date.now(), stage: 'applied' }
        await db.applications.add(app)
        return app
      })
      this.get('/applications', async (_, request) => {
        await randomDelay()
        const qp = Object.fromEntries(new URLSearchParams(request.queryParams))
        let items = await db.applications.toArray()
        if (qp.candidateId) items = items.filter(a => a.candidateId === qp.candidateId)
        if (qp.jobId) items = items.filter(a => a.jobId === qp.jobId)
        return { items }
      })
      this.patch('/applications/:id', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const updates = JSON.parse(request.requestBody || '{}')
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
