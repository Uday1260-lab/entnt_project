import Dexie from 'dexie'

export const db = new Dexie('talentflow')

db.version(1).stores({
  jobs: 'id, slug, status, order',
  candidates: 'id, email, stage, jobId',
  timelines: 'id, candidateId, at',
  assessments: 'jobId',
  submissions: 'id, jobId, candidateId, at',
})

export async function resetDb(){
  await db.delete()
  await db.open()
}
