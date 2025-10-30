# TalentFlow - Modern Applicant Tracking System

<div align="center">

![TalentFlow Logo](https://img.shields.io/badge/TalentFlow-ATS-6366f1?style=for-the-badge&logo=briefcase)

A modern, full-featured Applicant Tracking System (ATS) built with React, featuring real-time candidate pipeline management, comprehensive assessment system, and professional UI/UX.

[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![MirageJS](https://img.shields.io/badge/MirageJS-Mock_API-yellow)](https://miragejs.com/)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed-Netlify-00c7b7?logo=netlify)](https://www.netlify.com/)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [User Roles & Credentials](#-user-roles--credentials)
- [Key Features Breakdown](#-key-features-breakdown)
- [Technical Decisions](#-technical-decisions)
- [Issues & Solutions](#-issues--solutions)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)

---

## ✨ Features

### 👥 Multi-Role Support
- **Admin**: Full system access, user management, job creation
- **HR Team**: Job posting, candidate management, pipeline operations
- **Candidates**: Job browsing, application submission, assessment taking

### 💼 Job Management
- Create, edit, archive/unarchive jobs
- Time-based application windows (Opens Soon, Active, Closed)
- Job tags and advanced filtering
- Salary range display
- Comprehensive job descriptions

### 📊 Candidate Pipeline
- Drag-and-drop candidate movement across stages
- 6 pipeline stages: Applied → Screen → Tech → Offer → Hired/Rejected
- Real-time timeline tracking for each candidate
- Search and filter capabilities
- Bulk candidate management

### 📝 Assessment System
- **Multi-section assessments** with different question types
- **Question Types**:
  - Single Choice (MCQ)
  - Multiple Choice (MSQ)
  - Numeric Answer
  - Text (Short/Long)
  - Rating Scale
- **Smart Evaluation**:
  - Automatic grading for MCQ/MSQ/Numeric questions
  - Configurable marks (correct/incorrect)
  - Total score calculation
  - Negative marking support
- **Time Management**:
  - Countdown timer during assessment
  - Automatic rejection for missed deadlines
  - Prevents duplicate submissions
- **Visibility**: HR/Admin can view all submissions with scores

### 🎯 Offer Management
- Send job offers to candidates
- Candidate can accept/reject offers
- Automatic stage progression on acceptance
- Offer status tracking

### 🎨 Modern UI/UX
- Role-based gradient themes (Admin: Indigo, HR: Emerald, Candidate: Purple)
- Responsive design for all screen sizes
- Smooth animations and transitions
- Professional card-based layouts
- Icon-enhanced navigation
- Custom scrollbar styling
- Empty state illustrations

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Pages     │  │  Components  │  │    Context       │    │
│  │  (Routes)   │  │   (Shared)   │  │  (Auth, State)   │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│           │              │                    │             │
│           └──────────────┴────────────────────┘             │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │ React Query │                           │
│                   │  (Caching)  │                           │
│                   └──────┬──────┘                           │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │ API Client  │                           │
│                   └──────┬──────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   MirageJS Mock Server                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Routes    │  │   Models     │  │    Factories     │    │
│  │ (REST API)  │  │  (Schemas)   │  │   (Seeders)      │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │   Dexie.js  │                           │
│                   │  (IndexedDB)│                           │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → API Client → MirageJS Handler
     ↓                                              ↓
Update UI ← React Query Cache ← Response ← IndexedDB (Dexie)
```

### State Management

- **Authentication State**: Context API (`AuthContext`)
- **Server State**: TanStack Query (React Query) for caching and synchronization
- **Local Storage**: IndexedDB via Dexie.js for persistence
- **Form State**: React Hook Form (where applicable)

---

## 🛠 Tech Stack

### Core
- **React 18.3** - UI library
- **Vite 5.4** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first styling

### Data & State Management
- **TanStack Query (React Query)** - Server state management and caching
- **MirageJS** - Mock API server
- **Dexie.js** - IndexedDB wrapper for data persistence

### UI/UX Libraries
- **DnD Kit** - Drag-and-drop functionality
- **Lucide React** - Modern icon library (implied from code)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### Deployment
- **Netlify** - Hosting and continuous deployment

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Uday1260-lab/entnt_project.git
   cd TalentFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
TalentFlow/
├── public/
│   └── _redirects              # Netlify SPA routing config
├── src/
│   ├── api/
│   │   └── client.js           # API client configuration
│   ├── components/
│   │   └── shared/
│   │       ├── ErrorBanner.jsx # Error display component
│   │       ├── Layout.jsx      # Page layout wrapper
│   │       ├── LoadingSpinner.jsx # Loading indicator
│   │       ├── Navbar.jsx      # Navigation bar
│   │       ├── Pagination.jsx  # Pagination component
│   │       └── RequireAuth.jsx # Authentication guard
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── hooks/
│   │   ├── useAssessments.js   # Assessment data hooks
│   │   ├── useCandidates.js    # Candidate data hooks
│   │   └── useJobs.js          # Job data hooks
│   ├── mirage/
│   │   ├── server.js           # MirageJS server setup
│   │   ├── seeds.js            # Database seeding
│   │   └── utils.js            # Helper utilities
│   ├── pages/
│   │   ├── AddNewJob.jsx       # Job creation form
│   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   ├── ApplicationDetails.jsx # View candidate application
│   │   ├── AssessmentBuilder.jsx  # Create assessments
│   │   ├── CandidateJobs.jsx   # Candidate job browsing
│   │   ├── CandidateProfile.jsx   # Candidate profile view
│   │   ├── CandidateProfileForm.jsx # Profile completion
│   │   ├── Candidates.jsx      # Candidate list
│   │   ├── JobDetails.jsx      # Job details & applicants
│   │   ├── Jobs.jsx            # Job management
│   │   ├── Login.jsx           # Login page
│   │   ├── Pipeline.jsx        # Candidate pipeline
│   │   └── Register.jsx        # User registration
│   ├── persistence/
│   │   └── db.js               # Dexie.js database schema
│   ├── styles/
│   │   └── index.css           # Global styles
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # App entry point
├── .gitignore
├── index.html
├── netlify.toml                # Netlify configuration
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

---

## 🔐 User Roles & Credentials

### Default Users (Seeded in Database)

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin1234@talentflow.com` | `admin1234` | Full system access |
| **Admin** | `admin@talentflow.test` | `admin123` | Full system access |
| **HR Team** | `hr1@talentflow.test` | `hr12345` | Job & candidate management |
| **HR Team** | `hr2@talentflow.test` | `hr12345` | Job & candidate management |

**Note**: Candidate accounts are created through registration.

---

## 🎯 Key Features Breakdown

### 1. Assessment Builder

**Location**: `src/pages/AssessmentBuilder.jsx`

**Features**:
- Drag-and-drop section reordering
- Multiple question types with type-specific configurations
- Answer key setup (MCQ, MSQ, Numeric)
- Marks configuration (correct/incorrect)
- Conditional logic support
- Real-time preview

**Technical Implementation**:
- Uses DnD Kit for drag-and-drop
- Stores assessment configuration in IndexedDB
- Validates question structure before saving

### 2. Time-Based Application Windows

**Implementation**: Time validation across multiple components

**States**:
1. **Opens Soon**: Application window hasn't started
2. **Active/Apply**: Within application window
3. **Applications Closed**: Past application deadline

**Features**:
- Countdown timer showing exact remaining time
- Automatic status updates
- Visual indicators (badges, button states)
- Prevents late submissions

### 3. Pipeline Management

**Location**: `src/pages/Pipeline.jsx`

**Features**:
- Drag-and-drop candidate movement
- 6 stages with visual feedback
- Search functionality
- Timeline tracking for each move
- Archive/unarchive functionality

**Technical Implementation**:
- DnD Kit for drag operations
- Optimistic updates with React Query
- IndexedDB persistence
- Event timeline stored separately

### 4. Assessment Evaluation System

**Automatic Grading**:
- **MCQ**: Compares selected option with `correctOption`
- **MSQ**: Exact match with `correctOptions` array
- **Numeric**: Matches `correctValue`
- **Text/Rating**: Manual review (no auto-grading)

**Marks Calculation**:
```javascript
// For each question with hasMarks=true
if (correct) {
  score += marksCorrect
} else {
  score += marksIncorrect  // Can be negative
}
```

**Duplicate Prevention**:
- Checks for existing submissions before allowing access
- Shows "Already Submitted" message
- Displays previous submission to HR/Admin

### 5. Offer Management

**Flow**:
1. HR/Admin sends offer to candidate in "offer" stage
2. Candidate receives offer notification
3. Candidate accepts → moves to "hired" stage
4. Candidate rejects → stays in "offer" stage (can resend)

**Technical Implementation**:
- Offer stored with `offerStatus` field
- Status updates trigger stage changes
- Timeline events track offer history

---

## 🧩 Technical Decisions

### 1. **MirageJS for Backend**

**Decision**: Use MirageJS instead of a real backend

**Reasoning**:
- Fast prototyping and development
- No need for backend infrastructure
- Built-in request/response mocking
- Works in both development and production

**Trade-offs**:
- Not suitable for real production use
- Data only persists in browser (IndexedDB)
- No server-side validation
- Limited to single-user scenarios

### 2. **IndexedDB with Dexie.js**

**Decision**: Use IndexedDB for data persistence

**Reasoning**:
- Survives page refreshes
- Large storage capacity (50MB+)
- Asynchronous API
- Better than localStorage for complex data

**Implementation**:
```javascript
// db.js
export const db = new Dexie('TalentFlowDB')
db.version(1).stores({
  users: 'id, email',
  jobs: 'id, status, slug',
  candidates: 'id, email, jobId, stage',
  // ... more tables
})
```

### 3. **React Query for State Management**

**Decision**: Use React Query instead of Redux/Context

**Reasoning**:
- Automatic caching and background refetching
- Built-in loading and error states
- Optimistic updates support
- Less boilerplate than Redux
- Perfect for server-state management

**Example**:
```javascript
const { data: jobs, isLoading } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => apiClient.get('/api/jobs')
})
```

### 4. **Tailwind CSS for Styling**

**Decision**: Use Tailwind over traditional CSS/SCSS

**Reasoning**:
- Rapid UI development
- Consistent design system
- Smaller bundle size (only used classes)
- Easy responsiveness
- Modern utility patterns

### 5. **Role-Based Theming**

**Decision**: Different color schemes for each role

**Implementation**:
- Admin: Indigo gradient
- HR: Emerald gradient
- Candidate: Purple gradient

**Reasoning**:
- Clear visual distinction
- Better user orientation
- Professional appearance
- Improved UX

### 6. **Client-Side Routing**

**Decision**: Use React Router with hash routing fallback

**Reasoning**:
- Fast page transitions (no server round-trip)
- Better UX with instant navigation
- Suitable for SPA architecture
- Works well with Netlify's redirect system

---

## ⚠️ Issues & Solutions

### Issue 1: Comma Input Breaking Options Field

**Problem**: Entering commas in the options textarea treated them as separators

**Root Cause**: Options were split by commas on blur event

**Solution**: 
- Removed automatic comma splitting
- Users manually add one option per line
- Preserved raw text input
- Fixed in `AssessmentBuilder.jsx`

```javascript
// Before (problematic)
setOptions(e.target.value.split(',').map(o => o.trim()))

// After (fixed)
setOptions(e.target.value)  // Preserve raw text
```

### Issue 2: Netlify Deployment - JSON Parse Error

**Problem**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause**: 
1. Netlify serving 404 HTML page for client-side routes
2. MirageJS not running in production build

**Solution**:
1. Created `netlify.toml` with SPA redirect rules
2. Created `public/_redirects` as backup
3. Modified `main.jsx` to run MirageJS in production
4. Enhanced error handling in `AuthContext.jsx`

**Files Modified**:

`netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

`main.jsx`:
```javascript
// Run in both dev and production
makeServer({ 
  environment: import.meta.env.DEV ? 'development' : 'production' 
})
```

### Issue 3: Archive/Unarchive Button Not Working

**Problem**: Clicking archive/unarchive button triggered drag operation

**Root Cause**: Drag handlers were wrapping the entire table row including buttons

**Solution**:
- Added `e.stopPropagation()` to button onClick
- Prevented event bubbling to drag handler
- Fixed in `Jobs.jsx`

```javascript
<button 
  onClick={(e) => {
    e.stopPropagation()  // Stop drag handler
    handleArchive(job.id)
  }}
>
  Archive
</button>
```

### Issue 4: Pending Assessment Not Showing

**Problem**: "Pending assessment" text showed for all applicants

**Root Cause**: Incorrect conditional logic checking submission existence

**Solution**:
- Fixed condition to check `!submission` instead of `submission`
- Added proper null checks
- Fixed in `JobDetails.jsx`

```javascript
// Before
{submission && <span>Pending assessment</span>}

// After
{!submission && <span>Pending assessment</span>}
```

### Issue 5: Countdown Timer Showing Full Duration

**Problem**: Timer showed full assessment duration instead of remaining time

**Root Cause**: Not accounting for start time in calculation

**Solution**:
- Calculate elapsed time: `Date.now() - startTime`
- Subtract from total duration
- Update every second
- Fixed in multiple assessment components

```javascript
const [timeLeft, setTimeLeft] = useState(() => {
  const elapsed = Date.now() - startTime
  return Math.max(0, duration * 60 - Math.floor(elapsed / 1000))
})
```

---

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link GitHub repository to Netlify
   - Select branch: `master`

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables** (if needed)
   - None required for current setup

4. **Deploy**
   - Automatic deployment on push to master
   - Manual deploy via Netlify dashboard

### Configuration Files

**netlify.toml**:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

**public/_redirects**:
```
/*    /index.html   200
```

### Post-Deployment Checklist

- ✅ MirageJS running in production
- ✅ SPA routing working correctly
- ✅ Login/authentication functional
- ✅ IndexedDB persistence working
- ✅ All routes accessible
- ✅ Assets loading correctly
- ✅ Responsive on mobile devices

---

## 🔮 Future Enhancements

### Planned Features

1. **Real Backend Integration**
   - Replace MirageJS with actual REST API
   - Implement server-side validation
   - Add authentication tokens (JWT)
   - Multi-user support

2. **Enhanced Assessment System**
   - Coding challenges with online IDE
   - Video interview integration
   - Proctoring features
   - Time-per-question limits

3. **Advanced Analytics**
   - Candidate sourcing metrics
   - Time-to-hire analytics
   - Pipeline conversion rates
   - Assessment performance insights

4. **Communication Features**
   - In-app messaging
   - Email notifications
   - Interview scheduling
   - Automated status updates

5. **Collaboration Tools**
   - Feedback/comments on candidates
   - Internal ratings system
   - Interview scorecards
   - Hiring team assignments

6. **Resume Parsing**
   - Automatic profile completion
   - Skills extraction
   - Experience parsing
   - AI-powered candidate matching

7. **Reporting System**
   - Export candidate data (CSV/PDF)
   - Custom report builder
   - Scheduled reports
   - Dashboard widgets

### Technical Improvements

- [ ] Add unit and integration tests (Jest, React Testing Library)
- [ ] Implement E2E testing (Playwright/Cypress)
- [ ] Add TypeScript for type safety
- [ ] Optimize bundle size with code splitting
- [ ] Implement PWA features (offline support)
- [ ] Add accessibility improvements (WCAG 2.1)
- [ ] Set up CI/CD pipelines
- [ ] Add error tracking (Sentry)
- [ ] Implement analytics (Google Analytics)

---

## 📄 License

This project is currently unlicensed. All rights reserved.

---

## 👨‍💻 Author

**Uday**
- GitHub: [@Uday1260-lab](https://github.com/Uday1260-lab)
- Repository: [entnt_project](https://github.com/Uday1260-lab/entnt_project)

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- MirageJS team for making mocking easy
- Open source community for the tools and libraries

---

<div align="center">

**Built with ❤️ using React, Vite, and Tailwind CSS**

[⬆ Back to Top](#talentflow---modern-applicant-tracking-system)

</div> (Front-end only)

A React-based mini hiring platform with local persistence and a simulated REST API. No backend required.

## Features

- Jobs
  - Paginated and filterable jobs list (title/slug/tags, status)
  - Create/Edit (basic), archive/unarchive
  - Drag-and-drop reorder with optimistic updates and rollback on failure
  - Deep link to a job `/jobs/:jobId`
- Candidates
  - 1,000+ seeded candidates
  - Virtualized list with search (name/email) and stage filter
  - Candidate profile with timeline of status changes `/candidates/:id`
  - Kanban board to move candidates across stages (drag-and-drop)
  - Notes with @mentions (rendering stub)
- Assessments
  - Per-job assessment builder with sections and question types (single/multi choice, short/long text, numeric with range, file upload stub)
  - Live preview as a fillable form
  - Persist builder state and responses locally
  - Runtime validation (required, numeric range, max length) and simple conditional capability placeholder
- Data & API
  - MirageJS simulates REST endpoints
  - IndexedDB via Dexie for durable local persistence (write-through in route handlers)
  - Artificial latency (200–1200ms) and 5–10% error rate on write endpoints

## Tech Stack

- React + Vite (JavaScript)
- React Router v6
- @tanstack/react-query
- MirageJS
- Dexie (IndexedDB)
- @dnd-kit for drag-and-drop
- react-window for virtualization
- Tailwind CSS

## Getting started

Prerequisites: Node.js 18+

Install dependencies and run the dev server:

```cmd
npm install
npm run dev
```

Then open the URL printed by Vite (typically http://localhost:5173).

Build for production:

```cmd
npm run build
npm run preview
```

## Architecture

- `src/mirage/*`: Mirage server, routes, seeds, and utilities
- `src/persistence/db.js`: Dexie database schema and helpers
- `src/api/client.js`: Small `fetch` wrapper
- `src/hooks/*`: Data hooks powered by React Query
- `src/pages/*`: Route pages for jobs, candidates, pipeline, assessment builder
- `src/components/shared/*`: Shared UI components

Mirage routes read/write through Dexie, acting as the "network" layer but persisting data locally. On first run, seeds populate the DB. State is preserved across refreshes since Dexie stores in IndexedDB.

## Known gaps and next steps

- Jobs: add dedicated edit modal with form validation for slug uniqueness within UI (API already validates)
- Assessments: add conditional logic UI and runtime evaluation
- Notes with @mentions: add suggestions dropdown and persistence
- Add unit tests and integration tests
- Optional GitHub Pages workflow for deployment

## License

MIT
