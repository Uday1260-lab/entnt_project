import Dexie from 'dexie'

export const db = new Dexie('talentflow')

// v1: initial stores
db.version(1).stores({
  jobs: 'id, slug, status, order',
  candidates: 'id, email, stage, jobId',
  timelines: 'id, candidateId, at',
  assessments: 'jobId',
  submissions: 'id, jobId, candidateId, at',
})

// v2: auth/users, profiles, applications, and extended jobs
db.version(2).stores({
  jobs: 'id, slug, status, order, startDate, endDate, assessmentDate',
  candidates: 'id, email, stage, jobId',
  timelines: 'id, candidateId, at',
  assessments: 'jobId',
  submissions: 'id, jobId, candidateId, at',
  users: 'id, email, role',
  candidateProfiles: 'candidateId, completedAt',
  applications: 'id, jobId, candidateId, appliedAt, stage',
}).upgrade(async (tx) => {
  // Ensure existing jobs have required new fields
  const jobs = await tx.table('jobs').toArray()
  for (const j of jobs) {
    if (!('startDate' in j)) {
      j.startDate = null
      j.endDate = null
      j.assessmentDate = null
      j.assessmentDuration = null
    }
    await tx.table('jobs').put(j)
  }
})

// v3: add compound indexes for uniqueness constraints
db.version(3).stores({
  jobs: 'id, slug, status, order, startDate, endDate, assessmentDate',
  candidates: 'id, email, stage, jobId',
  timelines: 'id, candidateId, at',
  assessments: 'jobId',
  submissions: 'id, jobId, candidateId, at, [jobId+candidateId]',
  users: 'id, email, role',
  candidateProfiles: 'candidateId, completedAt',
  applications: 'id, jobId, candidateId, appliedAt, stage, [jobId+candidateId]',
})

export async function resetDb(){
  await db.delete()
  await db.open()
}
