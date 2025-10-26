import { db } from '../persistence/db'

const stages = ['applied','screen','tech','offer','hired','rejected']
const jobTags = ['Remote', 'Hybrid', 'Onsite', 'Full-time', 'Contract']

function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }

function slugify(str){
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

export async function seedAll(){
  const jobsCount = await db.jobs.count()
  if (jobsCount > 0) return

  // 25 jobs
  const jobs = []
  for (let i=1;i<=25;i++){
    const title = `Job ${i} - ${randomChoice(['Frontend','Backend','Fullstack','Data','DevOps'])} Engineer`
    jobs.push({
      id: crypto.randomUUID(),
      title,
      slug: slugify(title) + '-' + i,
      status: Math.random() < 0.2 ? 'archived' : 'active',
      tags: [randomChoice(jobTags)],
      order: i,
    })
  }
  await db.jobs.bulkAdd(jobs)

  // 1000 candidates
  const firstNames = ['Alex','Sam','Jordan','Taylor','Casey','Drew','Jamie','Morgan','Riley','Skyler']
  const lastNames = ['Smith','Johnson','Lee','Patel','Garcia','Brown','Davis','Martinez','Lopez','Wilson']
  const candidates = []
  for (let i=0;i<1000;i++){
    const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
    const email = name.toLowerCase().replace(/\s+/g,'.') + i + '@example.com'
    const job = randomChoice(jobs)
    const stage = randomChoice(stages)
    const id = crypto.randomUUID()
    candidates.push({ id, name, email, stage, jobId: job.id })
  }
  await db.candidates.bulkAdd(candidates)

  // timelines for initial stage
  const timeline = candidates.map(c => ({ id: crypto.randomUUID(), candidateId: c.id, at: Date.now(), event: `stage:${c.stage}` }))
  await db.timelines.bulkAdd(timeline)

  // 3 assessments with 10+ questions
  for (let i=0;i<3;i++){
    const job = jobs[i]
    const assessment = {
      jobId: job.id,
      sections: [
        {
          id: crypto.randomUUID(),
          title: 'Basics',
          questions: [
            { id: crypto.randomUUID(), type: 'shortText', label: 'Full name', required: true, maxLength: 80 },
            { id: crypto.randomUUID(), type: 'longText', label: 'Why do you want this role?', required: true, maxLength: 500 },
            { id: crypto.randomUUID(), type: 'singleChoice', label: 'Are you willing to relocate?', options: ['Yes','No'], required: true },
            { id: crypto.randomUUID(), type: 'multiChoice', label: 'Preferred stacks', options: ['React','Vue','Angular','Node','Python'] },
            { id: crypto.randomUUID(), type: 'numeric', label: 'Years of experience', min: 0, max: 40, required: true },
            { id: crypto.randomUUID(), type: 'file', label: 'Resume (upload stub)' },
            { id: crypto.randomUUID(), type: 'shortText', label: 'GitHub URL', maxLength: 200 },
            { id: crypto.randomUUID(), type: 'shortText', label: 'LinkedIn URL', maxLength: 200 },
            { id: crypto.randomUUID(), type: 'singleChoice', label: 'Open to contract?', options: ['Yes','No'] },
            { id: crypto.randomUUID(), type: 'shortText', label: 'Current location', maxLength: 120 },
          ],
        },
      ],
      conditions: [
        // Example: show last question only if relocate === 'Yes'
      ],
    }
    await db.assessments.put(assessment)
  }
}
