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
        const { search = '', status = '', page = '1', pageSize = '10', sort = 'order:asc' } = Object.fromEntries(new URLSearchParams(request.queryParams))
        const [sortField, sortDir] = sort.split(':')
        const ps = parseInt(pageSize, 10)
        const p = parseInt(page, 10)

        let jobs = await db.jobs.toArray()
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
        const job = { id: crypto.randomUUID(), status: 'active', tags: [], order, ...body }
        await db.jobs.add(job)
        return job
      })

      this.patch('/jobs/:id', async (_, request) => {
        await randomDelay()
        await maybeFail({ write: true })
        const { id } = request.params
        const updates = JSON.parse(request.requestBody || '{}')
        await db.jobs.update(id, updates)
        const job = await db.jobs.get(id)
        return job
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
        return { ok: true, id: submission.id }
      })
    },
  })

  // Seed DB if empty
  seedAll()

  return server
}
