import { db } from '../persistence/db'

const stages = ['applied','screen','tech','offer','hired','rejected']
const jobTags = ['Remote', 'Hybrid', 'Onsite', 'Full-time', 'Contract']

function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }

function slugify(str){
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

export async function seedAll(){
  // Ensure default users exist (idempotent upsert by email)
  const defaultUsers = [
    { email: 'admin1234@talentflow.com', role: 'admin', password: 'admin1234' },
    { email: 'admin@talentflow.test', role: 'admin', password: 'admin123' },
    { email: 'hr1@talentflow.test', role: 'hr-team', password: 'hr12345' },
    { email: 'hr2@talentflow.test', role: 'hr-team', password: 'hr12345' },
  ]
  for (const u of defaultUsers) {
    const existing = await db.users.where('email').equals(u.email).first().catch(()=>null)
    if (!existing) {
      await db.users.add({ id: crypto.randomUUID(), ...u }).catch(()=>{})
    }
  }

  const jobsCount = await db.jobs.count()
  if (jobsCount > 0) return

  // 25 jobs
  const jobs = []
  for (let i=1;i<=25;i++){
    const title = `Job ${i} - ${randomChoice([
  // Original List
  'Frontend', 'Backend', 'Fullstack', 'Data', 'DevOps',
  // Infrastructure & Cloud
  'Cloud', 'Infrastructure', 'SRE', 'Platform',
  // Data & AI
  'AI', 'Machine Learning', 'ML', 'Data Science', 'Analytics', 'BI',
  // Specialized Development
  'Mobile', 'iOS', 'Android', 'Embedded', 'Game', 'Graphics',
  // Security
  'Security', 'Infosec', 'AppSec', 'Cybersecurity',
  // Other Key Roles
  'QA', 'Test', 'UX', 'UI', 'Product', 'Systems', 'Solution', 'Blockchain'
  ])} Engineer`
    jobs.push({
      id: crypto.randomUUID(),
      title,
      slug: slugify(title) + '-' + i,
      status: Math.random() < 0.2 ? 'archived' : 'active',
      tags: [randomChoice(jobTags)],
      order: i,
      description: 'We are seeking talented engineers to join our team.',
      salary: 80000 + Math.floor(Math.random()*70000),
      attachments: [],
      startDate: new Date(Date.now() + 1*24*60*60*1000).toISOString(),
      endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      assessmentDate: new Date(Date.now() + 9*24*60*60*1000).toISOString(),
      assessmentDuration: 45,
    })
  }
  await db.jobs.bulkAdd(jobs)

  // 1000 candidates
  const firstNames = [
  // Original List
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Jamie', 'Morgan', 'Riley', 'Skyler',
  // Additional Male
  'Noah', 'Liam', 'Ethan', 'James', 'Benjamin', 'Lucas', 'Mason', 'Jacob', 'Daniel', 'Henry',
  // Additional Female
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  // Additional Gender-Neutral
  'Avery', 'Rowan', 'Quinn', 'Finley', 'Sawyer', 'Parker', 'Blake', 'Hayden', 'Reese', 'Emery'
  ];
  const lastNames = [
  // Original List
  'Smith', 'Johnson', 'Lee', 'Patel', 'Garcia', 'Brown', 'Davis', 'Martinez', 'Lopez', 'Wilson',
  // Additional Common
  'Jones', 'Miller', 'Moore', 'Thompson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Clark',
  // Additional Culturally Diverse
  'Nguyen', 'Kim', 'Silva', 'Rossi', 'Müller', 'Dubois', 'Ivanov', 'Sato', 'Cohen', 'Khan'
  ];
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

  // candidateProfiles placeholders for seeded candidates (not required, but helps);
  await db.candidateProfiles.bulkAdd(candidates.slice(0,10).map(c => ({ candidateId: c.id, completedAt: Date.now() }))).catch(()=>{})

  // DSA Assessment for first 3 jobs
  for (let i=0;i<3;i++){
    const job = jobs[i]
    const assessment = {
      jobId: job.id,
      sections: [
        {
          id: crypto.randomUUID(),
          title: 'Section A: Multiple Choice Questions (MCQs)',
          questions: [
            { id: crypto.randomUUID(), type: 'singleChoice', label: '1. What is the worst-case time complexity of inserting an element into a balanced Binary Search Tree (BST) with n nodes?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'O(log n)' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '2. Which of the following sorting algorithms typically has the worst-case time complexity of O(n²)?', options: ['Merge Sort', 'Heap Sort', 'Quick Sort', 'Bubble Sort'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Bubble Sort' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '3. In the context of a hash table, what does the term "load factor" represent?', options: ['The number of buckets in the table', 'The ratio of the number of elements to the number of buckets', 'The time taken to compute the hash function', 'The number of collisions that have occurred'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'The ratio of the number of elements to the number of buckets' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '4. Which data structure is most efficient for implementing a First-In-First-Out (FIFO) policy?', options: ['Stack', 'Queue', 'Array', 'Tree'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Queue' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '5. The process of visiting all nodes in a tree in the order: root, left subtree, right subtree, is known as:', options: ['In-order Traversal', 'Pre-order Traversal', 'Post-order Traversal', 'Level-order Traversal'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Pre-order Traversal' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '6. Which graph traversal algorithm uses a queue data structure?', options: ['Depth-First Search (DFS)', 'Breadth-First Search (BFS)', 'Dijkstra\'s Algorithm', 'Topological Sort'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Breadth-First Search (BFS)' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '7. In a min-heap, the element at the root is always:', options: ['The largest element', 'The median element', 'The smallest element', 'There is no specific order'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'The smallest element' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '8. What is the space complexity of the recursive Fibonacci function without memoization?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(2^n)'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'O(n)' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '9. A graph where each edge has a numerical weight assigned to it is called a:', options: ['Weighted Graph', 'Directed Graph', 'Connected Graph', 'Complete Graph'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Weighted Graph' },
            { id: crypto.randomUUID(), type: 'singleChoice', label: '10. Which of the following is NOT a stable sorting algorithm?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Heap Sort'], required: true, hasMarks: true, marksCorrect: 2, marksIncorrect: -0.5, correctOption: 'Heap Sort' },
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Section B: Multiple Select Questions (MSQs)',
          questions: [
            { id: crypto.randomUUID(), type: 'multiChoice', label: '11. Which of the following data structures can be used to implement a priority queue? (Select all that apply)', options: ['Linked List', 'Stack', 'Heap', 'Balanced BST'], required: true, hasMarks: true, marksCorrect: 4, marksIncorrect: 0, correctOptions: ['Heap', 'Balanced BST'] },
            { id: crypto.randomUUID(), type: 'multiChoice', label: '12. Which of the following statements about Dynamic Programming are true? (Select all that apply)', options: ['It is mainly used to solve problems with overlapping subproblems', 'It always has a better time complexity than a recursive solution', 'It uses memoization or tabulation to store results of subproblems', 'It is applicable to all problems solved by divide and conquer'], required: true, hasMarks: true, marksCorrect: 4, marksIncorrect: 0, correctOptions: ['It is mainly used to solve problems with overlapping subproblems', 'It uses memoization or tabulation to store results of subproblems'] },
            { id: crypto.randomUUID(), type: 'multiChoice', label: '13. For an undirected graph, which of the following are always true? (Select all that apply)', options: ['The sum of degrees of all vertices is even', 'The number of vertices of odd degree is even', 'It must be connected', 'It can contain cycles'], required: true, hasMarks: true, marksCorrect: 4, marksIncorrect: 0, correctOptions: ['The sum of degrees of all vertices is even', 'The number of vertices of odd degree is even', 'It can contain cycles'] },
            { id: crypto.randomUUID(), type: 'multiChoice', label: '14. Which operations have an O(1) time complexity in the worst case for a doubly linked list with a pointer to both the head and the tail? (Select all that apply)', options: ['Insertion at the beginning', 'Deletion from the end', 'Searching for an element', 'Insertion at the end'], required: true, hasMarks: true, marksCorrect: 4, marksIncorrect: 0, correctOptions: ['Insertion at the beginning', 'Deletion from the end', 'Insertion at the end'] },
            { id: crypto.randomUUID(), type: 'multiChoice', label: '15. Which of the following problems can be solved using a Stack data structure? (Select all that apply)', options: ['Evaluating a postfix expression', 'Implementing a queue', 'Reversing a string', 'Finding the shortest path in an unweighted graph'], required: true, hasMarks: true, marksCorrect: 4, marksIncorrect: 0, correctOptions: ['Evaluating a postfix expression', 'Implementing a queue', 'Reversing a string'] },
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Section C: Numerical Answer Questions',
          questions: [
            { id: crypto.randomUUID(), type: 'numeric', label: '16. What is the maximum number of nodes in a binary tree of height 4? (Assume the root is at level 0)', required: true, hasMarks: true, marksCorrect: 3, marksIncorrect: 0, correctValue: 31 },
            { id: crypto.randomUUID(), type: 'numeric', label: '17. In a hash table of size 10, using linear probing for collision resolution, what will be the final index of the key 23 after inserting keys 13, 33, 23? (Use hash function: h(key) = key % 10)', required: true, hasMarks: true, marksCorrect: 3, marksIncorrect: 0, correctValue: 5 },
            { id: crypto.randomUUID(), type: 'numeric', label: '18. How many comparisons are required in the worst case to find a specific element in a sorted array of 16 elements using Binary Search?', required: true, hasMarks: true, marksCorrect: 3, marksIncorrect: 0, correctValue: 5 },
            { id: crypto.randomUUID(), type: 'numeric', label: '19. Consider the in-order traversal of a Binary Search Tree (BST) is: [5, 10, 15, 20, 25]. What is the sum of the pre-order traversal\'s first and last elements?', required: true, hasMarks: true, marksCorrect: 3, marksIncorrect: 0, correctValue: 30 },
            { id: crypto.randomUUID(), type: 'numeric', label: '20. In a complete undirected graph with 5 vertices, how many unique edges are present?', required: true, hasMarks: true, marksCorrect: 3, marksIncorrect: 0, correctValue: 10 },
          ],
        },
      ],
      conditions: [],
    }
    await db.assessments.put(assessment)
  }
}
