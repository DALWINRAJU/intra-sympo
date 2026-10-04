# Technical Quiz Competition Platform — Architecture Document

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Technology Stack](#4-technology-stack)
5. [High-Level Architecture](#5-high-level-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Database Architecture](#8-database-architecture)
9. [Authentication Architecture](#9-authentication-architecture)
10. [Quiz/Competition State Machine](#10-quizcompetition-state-machine)
11. [Timer Architecture](#11-timer-architecture)
12. [Level 1 Architecture](#12-level-1-architecture---mcq)
13. [Level 2 Architecture](#13-level-2-architecture---exit-room)
14. [Level 3 Architecture](#14-level-3-architecture---guess-the-output)
15. [Scoring Architecture](#15-scoring-architecture)
16. [API Architecture](#16-api-architecture)
17. [Admin Architecture](#17-admin-architecture)
18. [Leaderboard Architecture](#18-leaderboard-architecture)
19. [Security Architecture](#19-security-architecture)
20. [Concurrent User Architecture](#20-concurrent-user-architecture)
21. [Error Handling Architecture](#21-error-handling-architecture)
22. [Deployment Architecture](#22-deployment-architecture)
23. [Folder Structure](#23-folder-structure)
24. [Data Flow Diagrams](#24-data-flow-diagrams)
25. [Testing Strategy](#25-testing-strategy)
26. [Development Phases](#26-development-phases)

---

## 1. Project Overview

### Problem Statement

A college symposium requires a real-time, multi-level technical quiz competition platform that supports 140+ concurrent participants. The competition consists of three progressive levels (MCQ → Exit Room → Guess the Output) with a continuous server-authoritative timer, life-based elimination, and an admin dashboard for competition management.

### Key Constraints

| Constraint | Detail |
|---|---|
| **Scale** | 140+ simultaneous participants |
| **Deployment** | render (frontend) + Render free/starter (backend) + MongoDB Atlas |
| **Timeline** | College symposium — must be reliable on event day |
| **Budget** | Likely free-tier 
| **Integrity** | Anti-cheating: server must be the single source of truth |

### What This Document Covers

This document defines the complete architecture **without writing implementation code**. It covers database schemas, API contracts, state machines, security measures, concurrency strategy, deployment topology, and a phased implementation plan.

---

## 2. Functional Requirements

### Participant-Facing

| ID | Requirement |
|---|---|
| FR-1 | Participant registers with Full Name, College Name, Department, Participant ID |
| FR-2 | Participant starts the competition, creating a server-side session |
| FR-3 | Level 1: Answer 20 MCQs (configurable) from a bank of 100 -random questions need to be |
| FR-4 | Level 1: Immediate correct/incorrect feedback after each answer |
| FR-5 | Level 1: Display score after completing all questions |
| FR-6 | Level 2: Complete 3 steps (configurable) with 3 lives (configurable) |
| FR-7 | Level 2: Lose a life on wrong answer; elimination on 0 lives |
| FR-8 | Level 3: Answer 5 (configurable) "Guess the Output" questions |
| FR-9 | Continuous timer from start to completion/elimination |
| FR-10 | Session recovery on page refresh/reconnect |
| FR-11 | Final result screen with total score and time taken |

### Admin-Facing

| ID | Requirement |
|---|---|
| FR-12 | Admin login with role-based access |
| FR-13 | CRUD operations on question bank |
| FR-14 | View/search/filter participants and their sessions |
| FR-15 | Configure competition parameters (question counts, lives, scoring) |
| FR-16 | View real-time leaderboard |
| FR-17 | Competition lifecycle controls (start, pause, end) |

---

## 3. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | API response time under normal load | < 500ms p95 |
| **Concurrency** | Simultaneous participants supported | 140+ (design target) |
| **Availability** | Uptime during competition window (2–3 hours) | 99%+ |
| **Security** | Server-authoritative scoring and timing | Mandatory |
| **Resilience** | Session recovery after page refresh | Full state recovery |
| **Data Integrity** | No duplicate answer submissions | Server-enforced |
| **Maintainability** | Clear separation of concerns | MVC + Service layer |
| **Deployability** | Zero-downtime deploy during non-competition hours | Supported |

---

## 4. Technology Stack

### Frontend

| Technology | Purpose | Version Target |
|---|---|---|
| React 18+ | UI framework | Latest stable |
| Vite 5+ | Build tool & dev server | Latest stable |
| Tailwind CSS 3+ | Utility-first styling | Latest stable |
| React Router v6 | Client-side routing | v6.x |
| Axios | HTTP client | Latest stable |

### Backend

| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| Express.js 4.x | HTTP framework |
| Mongoose 7+ | MongoDB ODM |
| jsonwebtoken | JWT creation/verification |
| bcryptjs | Password hashing |
| cors | Cross-origin configuration |
| helmet | Security headers |
| express-rate-limit | Rate limiting |
| express-validator / joi | Input validation |
| dotenv | Environment variable loading |
| morgan / winston | Logging |

### Database

| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud-hosted database (M0 free tier or M10+) |

### Why This Stack?

- **React + Vite**: Fast HMR, optimized builds, widely understood by college developers.
- **Express.js**: Minimal, well-documented, sufficient for REST API needs.
- **MongoDB**: Schema flexibility for varied question types; Mongoose provides validation and type safety.
- **JWT**: Stateless authentication suitable for the scale; no server-side session store needed.

---

## 5. High-Level Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (Vercel)"]
        R["React SPA"]
    end

    subgraph Server["Backend (Render)"]
        E["Express.js API"]
        MW["Middleware Layer"]
        SVC["Service Layer"]
    end

    subgraph DB["Database (MongoDB Atlas)"]
        M["MongoDB"]
    end

    R -->|"HTTPS REST API"| E
    E --> MW
    MW --> SVC
    SVC --> M
```

### Request Flow

```
Browser (React)
  ↓ HTTPS
Vercel CDN → serves static React build
  ↓ API calls
Render (Express.js)
  ↓ Mongoose
MongoDB Atlas
```

### Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **REST API (not WebSocket)** | Simpler to implement and debug; polling or timestamp-based timer removes the need for real-time push. WebSocket adds complexity with Render's infrastructure. |
| **Server-authoritative state** | All competition state (score, timer, lives, level) lives in MongoDB. The frontend is a thin display layer. |
| **Stateless JWT auth** | Scales horizontally without shared session stores. Token contains participant ID and role. |
| **Service layer pattern** | Controllers handle HTTP concerns; services handle business logic; models handle data. Testable and maintainable. |

---

## 6. Frontend Architecture

### Pages

| Page | Route | Purpose |
|---|---|---|
| Landing / Login | `/` | Registration form + "Start Game" entry point |
| Instructions | `/instructions` | Competition rules and overview before starting |
| Level 1 — MCQ | `/level/1` | MCQ question interface with progress indicator |
| Level 1 Result | `/level/1/result` | Score display after completing Level 1 |
| Level 2 — Exit Room | `/level/2` | Step-by-step challenge with lives display |
| Level 3 — Guess Output | `/level/3` | Code snippet + text input for predicted output |
| Final Result | `/result` | Total score, time taken, rank, completion status |
| Admin Login | `/admin/login` | Admin authentication page |
| Admin Dashboard | `/admin/dashboard` | Overview stats, active sessions, quick actions |
| Participant Management | `/admin/participants` | Table with search, filter, session details |
| Question Management | `/admin/questions` | CRUD interface for question bank |
| Competition Settings | `/admin/settings` | Configure question counts, lives, scoring, competition status |
| Leaderboard | `/leaderboard` | Public or admin-only leaderboard |

### Component Hierarchy

```
App
├── PublicLayout
│   ├── LandingPage
│   ├── InstructionsPage
│   └── LeaderboardPage
├── CompetitionLayout (protected — participant)
│   ├── Timer (persistent across levels)
│   ├── Level1Page
│   │   ├── QuestionCard
│   │   ├── OptionsList
│   │   └── ProgressBar
│   ├── Level1ResultPage
│   ├── Level2Page
│   │   ├── StepChallenge
│   │   └── LivesIndicator
│   ├── Level3Page
│   │   ├── CodeSnippet
│   │   └── OutputInput
│   └── FinalResultPage
├── AdminLayout (protected — admin)
│   ├── AdminDashboard
│   │   ├── StatsCards
│   │   └── ActiveSessionsList
│   ├── ParticipantManagement
│   │   ├── ParticipantTable
│   │   ├── SearchBar
│   │   └── FilterControls
│   ├── QuestionManagement
│   │   ├── QuestionTable
│   │   ├── QuestionForm (Add/Edit)
│   │   └── QuestionPreview
│   └── CompetitionSettings
│       ├── ScoringConfig
│       ├── QuestionCountConfig
│       └── CompetitionControls
└── SharedComponents
    ├── LoadingSpinner
    ├── ErrorBoundary
    ├── ConfirmDialog
    ├── Toast / Notification
    └── ProtectedRoute
```

### Contexts

| Context | Purpose |
|---|---|
| `AuthContext` | JWT token, participant/admin identity, login/logout actions |
| `CompetitionContext` | Current session state synced from server: level, score, lives, timer start time |

### Custom Hooks

| Hook | Purpose |
|---|---|
| `useAuth` | Access auth context, auto-redirect on expiry |
| `useSession` | Fetch and restore active session on mount |
| `useTimer` | Calculate elapsed time from `startTime` (server timestamp) using `Date.now()` |
| `useLevel1` | Load questions, submit answers, track progress for Level 1 |
| `useLevel2` | Load steps, submit answers, track lives for Level 2 |
| `useLevel3` | Load code snippets, submit answers for Level 3 |
| `useLeaderboard` | Fetch and poll leaderboard data |
| `useAdminData` | CRUD hooks for admin operations |

### Services (API Layer)

| Service File | Responsibility |
|---|---|
| `api.js` | Axios instance with base URL, interceptors, token injection |
| `authService.js` | `register()`, `login()`, `adminLogin()` |
| `sessionService.js` | `startSession()`, `getSession()`, `recoverSession()` |
| `quizService.js` | `getQuestions()`, `submitAnswer()`, `completeLevel()` |
| `resultService.js` | `getFinalResult()`, `getLeaderboard()` |
| `adminService.js` | Participant CRUD, question CRUD, config CRUD, competition controls |

### State Management Decision: Context API

**Recommendation: Context API (NOT Redux Toolkit)**

**Reasoning:**

| Factor | Analysis |
|---|---|
| **State complexity** | Moderate. The primary state (session) lives on the server. The frontend only mirrors a small state object. |
| **State shape** | Flat. Two main domains: auth and competition session. |
| **Update frequency** | Low. State changes only on answer submission (user-driven), not continuous streaming. |
| **Team size** | Likely 1–3 developers for a symposium project. Redux's boilerplate overhead is unjustified. |
| **Server as source of truth** | The frontend doesn't need a sophisticated client-side store because every mutation goes through the server and the response updates local state. |
| **Bundle size** | Context API is built-in; Redux Toolkit adds ~12KB gzipped. |

Two contexts (`AuthContext` and `CompetitionContext`) with `useReducer` internally provide sufficient structure. If a component needs session data, it calls `useSession()` which reads from `CompetitionContext`.

> [!TIP]
> If the admin dashboard grows significantly in complexity (dozens of independent data tables with complex filtering), consider adding `@tanstack/react-query` (TanStack Query) for server-state caching — NOT Redux. TanStack Query handles server-state (caching, refetching, stale-while-revalidate) much better than Redux for this use case.

---

## 7. Backend Architecture

### Layered Architecture

```mermaid
flowchart TD
    REQ["Incoming Request"] --> MW["Middleware"]
    MW --> RT["Route"]
    RT --> CT["Controller"]
    CT --> SV["Service"]
    SV --> MD["Model / Mongoose"]
    MD --> DB["MongoDB"]
    DB --> MD
    MD --> SV
    SV --> CT
    CT --> RES["Response"]
```

### Layer Responsibilities

| Layer | Responsibility | Example |
|---|---|---|
| **Middleware** | Auth verification, rate limiting, input validation, error handling | `authMiddleware.js`, `validateInput.js` |
| **Routes** | Map HTTP methods + URLs to controllers | `quizRoutes.js` |
| **Controllers** | Parse request, call service, format response | `quizController.js` |
| **Services** | Business logic, state machine enforcement, scoring calculations | `quizService.js` |
| **Models** | Mongoose schema definitions, static/instance methods, indexes | `QuizSession.js` |
| **Utils** | Shared helpers (error classes, response formatters, constants) | `AppError.js` |

### Why This Separation Matters

- **Controllers** never touch MongoDB directly → testable with mocked services.
- **Services** contain all business rules → single place to enforce "you can't skip levels" or "you can't answer after elimination."
- **Models** define data shape + database-level validation → last line of defense for data integrity.

---

## 8. Database Architecture

### Entity-Relationship Diagram

```mermaid
erDiagram
    ADMIN ||--o{ QUIZ_SESSION : "manages"
    PARTICIPANT ||--|| QUIZ_SESSION : "has one active"
    QUIZ_SESSION ||--o{ ANSWER : "contains"
    QUESTION ||--o{ ANSWER : "referenced by"
    COMPETITION_CONFIG ||--o{ QUIZ_SESSION : "governs"

    ADMIN {
        ObjectId _id
        String username
        String passwordHash
        String role
        Boolean isActive
    }

    PARTICIPANT {
        ObjectId _id
        String fullName
        String collegeName
        String department
        String participantId
        Date registeredAt
    }

    QUIZ_SESSION {
        ObjectId _id
        ObjectId participantRef
        String status
        Date startTime
        Date endTime
        Number totalScore
        Number level1Score
        Number level2Score
        Number level3Score
        Number lives
        Number currentLevel
        Array level1QuestionIds
        Array level2QuestionIds
        Array level3QuestionIds
        Number level1CurrentIndex
        Number level2CurrentIndex
        Number level3CurrentIndex
        Number timeTakenMs
    }

    QUESTION {
        ObjectId _id
        String type
        Number level
        String category
        String questionText
        String codeSnippet
        String language
        Array options
        String correctAnswer
        Number points
        String difficulty
        Boolean isActive
    }

    ANSWER {
        ObjectId _id
        ObjectId sessionRef
        ObjectId questionRef
        Number level
        String submittedAnswer
        Boolean isCorrect
        Number pointsAwarded
        Date submittedAt
    }

    COMPETITION_CONFIG {
        ObjectId _id
        Number level1QuestionCount
        Number level1PointsPerQuestion
        Number level2StepCount
        Number level2PointsPerStep
        Number level2Lives
        Number level3QuestionCount
        Number level3PointsPerQuestion
        String competitionStatus
        Date competitionStartTime
        Date competitionEndTime
    }
```

### Collection Details

---

#### 1. `admins`

**Purpose:** Store admin credentials and authorization levels.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `username` | String | Yes | Unique admin username |
| `passwordHash` | String | Yes | bcrypt-hashed password |
| `role` | String | Yes | `"super_admin"` or `"admin"` |
| `isActive` | Boolean | Yes | Soft-disable admin accounts |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**
- `{ username: 1 }` — unique index for login lookup.

**Why this collection exists:** Admins are a fundamentally different entity from participants. They have passwords (participants don't), different permissions, and different authentication flows. Mixing them into a single "users" collection adds unnecessary conditional logic.

---

#### 2. `participants`

**Purpose:** Store participant identity information, decoupled from competition session data.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `fullName` | String | Yes | Participant's full name |
| `collegeName` | String | Yes | College name |
| `department` | String | Yes | Department |
| `participantId` | String | Yes | Unique registration ID (e.g., event registration code) |
| `registeredAt` | Date | Auto | Registration timestamp |

**Indexes:**
- `{ participantId: 1 }` — unique index; used for login/lookup.

**Why separate from QuizSession:** A participant's identity is stable. Their session state is volatile and complex. Separating them means:
- Participant data can be pre-loaded (bulk registration) without creating sessions.
- A participant could theoretically be reset (new session) without losing identity data.
- Cleaner queries: "list all participants" doesn't require parsing session data.

---

#### 3. `quizsessions`

**Purpose:** The core competition state document. This is the single source of truth for a participant's competition progress.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `participant` | ObjectId (ref) | Yes | Reference to `participants` |
| `status` | String (enum) | Yes | State machine status (see §10) |
| `startTime` | Date | No | Set when competition starts |
| `endTime` | Date | No | Set on completion or elimination |
| `totalScore` | Number | Yes | Running total, default 0 |
| `level1Score` | Number | Yes | Level 1 subtotal, default 0 |
| `level2Score` | Number | Yes | Level 2 subtotal, default 0 |
| `level3Score` | Number | Yes | Level 3 subtotal, default 0 |
| `lives` | Number | Yes | Current lives (initialized from config) |
| `currentLevel` | Number | Yes | 1, 2, or 3 |
| `level1Questions` | [ObjectId] | Yes | Randomly selected question IDs for Level 1 |
| `level2Questions` | [ObjectId] | Yes | Randomly selected question IDs for Level 2 |
| `level3Questions` | [ObjectId] | Yes | Randomly selected question IDs for Level 3 |
| `level1CurrentIndex` | Number | Yes | Current question index in Level 1 (0-based) |
| `level2CurrentIndex` | Number | Yes | Current step index in Level 2 (0-based) |
| `level3CurrentIndex` | Number | Yes | Current question index in Level 3 (0-based) |
| `timeTakenMs` | Number | No | Calculated on completion: `endTime - startTime` in ms |

**Indexes:**
- `{ participant: 1 }` — unique index; one active session per participant.
- `{ status: 1 }` — filter active/completed/eliminated sessions.
- `{ totalScore: -1, timeTakenMs: 1 }` — compound index for leaderboard queries (highest score first, then fastest time).

**Why references instead of embedding participant data?**
Session documents change frequently (every answer submission). Embedding participant data would mean duplicating stable data inside a frequently-updated document. References keep the session document focused on volatile state. The `populate()` call is needed only for admin views and leaderboard, not on the hot path of answer submission.

**Why are question IDs stored in the session?**
When a session starts, the server randomly selects questions and stores their IDs. This ensures:
- The participant always sees the same questions even after refresh.
- The question set is locked at session creation (not affected by admin edits during competition).
- The current index tells the server exactly which question to serve next.

---

#### 4. `questions`

**Purpose:** Unified question bank for all three levels.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `type` | String (enum) | Yes | `"mcq"`, `"exit_room"`, `"guess_output"` |
| `level` | Number | Yes | 1, 2, or 3 |
| `category` | String | Yes | e.g., `"Operating Systems"`, `"Java"`, `"Python"` |
| `questionText` | String | Yes | The question prompt |
| `codeSnippet` | String | No | Code block (for Level 2 and Level 3) |
| `language` | String | No | `"python"`, `"java"`, `"c"`, etc. |
| `options` | [Object] | Conditional | Array of `{ label: "A", text: "..." }` — required for MCQ and exit_room |
| `correctAnswer` | String | Yes | The correct answer (option label for MCQ, text for guess_output) |
| `points` | Number | Yes | Points awarded for correct answer |
| `difficulty` | String | No | `"easy"`, `"medium"`, `"hard"` |
| `isActive` | Boolean | Yes | Default `true`; allows disabling without deleting |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**
- `{ type: 1, level: 1, isActive: 1 }` — compound index for fetching active questions by type and level.
- `{ category: 1 }` — for admin filtering by category.

**Why a single collection instead of three separate collections (one per level)?**
- All questions share a common shape (text, answer, points, category).
- A unified schema simplifies admin CRUD — one form, one table, one API.
- The `type` and `level` fields differentiate behavior. The minor structural differences (MCQ has `options`, Guess Output has `codeSnippet`) are handled via conditional validation in Mongoose.

**Critical security note:** The `correctAnswer` field must NEVER be included in API responses to participants. It is only sent to the frontend after the participant submits their answer (and even then, only the "correct or not" verdict is sent — the actual correct answer text can optionally be sent for feedback purposes).

---

#### 5. `answers`

**Purpose:** Immutable log of every answer submitted. Enables audit, prevents duplicates, and decouples answer history from session state.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `session` | ObjectId (ref) | Yes | Reference to `quizsessions` |
| `question` | ObjectId (ref) | Yes | Reference to `questions` |
| `level` | Number | Yes | 1, 2, or 3 |
| `submittedAnswer` | String | Yes | What the participant submitted |
| `isCorrect` | Boolean | Yes | Server-calculated |
| `pointsAwarded` | Number | Yes | 0 if wrong, configured points if correct |
| `submittedAt` | Date | Yes | Server timestamp |

**Indexes:**
- `{ session: 1, question: 1 }` — unique compound index; prevents duplicate submissions for the same question in the same session.
- `{ session: 1, level: 1 }` — fetch all answers for a session at a given level.

**Why a separate collection instead of embedding in QuizSession?**
- A session could have 20 (L1) + 3 (L2) + 5 (L3) = 28 answer subdocuments. While MongoDB handles this, a separate collection:
  - Allows the unique compound index `{ session, question }` — a clean, database-level duplicate prevention.
  - Keeps the session document smaller and faster to read/write on the hot path.
  - Enables efficient aggregation queries across all answers (e.g., "which question was most frequently missed?").

---

#### 6. `competitionconfigs`

**Purpose:** Single-document collection storing global competition configuration. Acts as a feature-flag and parameter store.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | — | Primary key |
| `level1QuestionCount` | Number | Yes | 20 | MCQs per session |
| `level1PointsPerQuestion` | Number | Yes | 5 | Points per correct MCQ |
| `level2StepCount` | Number | Yes | 3 | Steps in Exit Room |
| `level2PointsPerStep` | Number | Yes | 10 | Points per correct step |
| `level2Lives` | Number | Yes | 3 | Starting lives |
| `level3QuestionCount` | Number | Yes | 5 | Guess Output questions |
| `level3PointsPerQuestion` | Number | Yes | 10 | Points per correct output |
| `competitionStatus` | String (enum) | Yes | `"not_started"` | `"not_started"`, `"active"`, `"paused"`, `"ended"` |
| `competitionStartTime` | Date | No | — | When admin started competition |
| `competitionEndTime` | Date | No | — | When admin ended competition |
| `updatedAt` | Date | Auto | — | Last config change |

**Why a separate collection instead of hardcoding?**
Admin can change parameters without redeploying. The config is read once at session creation and cached in the session. This means mid-competition config changes won't affect in-progress sessions — only new sessions.

---

### Embedded vs. Referenced: Summary

| Relationship | Strategy | Reason |
|---|---|---|
| Session → Participant | **Reference** | Participant data is stable; session data is volatile |
| Session → Questions (IDs) | **Embedded array of ObjectIds** | Question set is locked at session creation; small array (≤28 IDs) |
| Session → Answers | **Reference (separate collection)** | Enables unique index for duplicate prevention; keeps session doc lean |
| Answer → Question | **Reference** | Questions are shared across sessions |
| CompetitionConfig | **Standalone document** | Global singleton; read by services at session creation |

---

## 9. Authentication Architecture

### Dual Authentication Flows

```mermaid
flowchart LR
    subgraph Participant
        P1["Enter participantId"] --> P2["POST /api/auth/register"]
        P2 --> P3["Server creates/finds participant"]
        P3 --> P4["JWT issued (role: participant)"]
    end

    subgraph Admin
        A1["Enter username + password"] --> A2["POST /api/auth/admin/login"]
        A2 --> A3["bcrypt.compare(password, hash)"]
        A3 --> A4["JWT issued (role: admin)"]
    end
```

### JWT Structure

**Participant Token Payload:**
```json
{
  "id": "<participant ObjectId>",
  "participantId": "SYMP2026-042",
  "role": "participant",
  "iat": 1696000000,
  "exp": 1696014400
}
```

**Admin Token Payload:**
```json
{
  "id": "<admin ObjectId>",
  "role": "admin",
  "iat": 1696000000,
  "exp": 1696014400
}
```

### Token Lifecycle

| Parameter | Participant | Admin |
|---|---|---|
| **Expiry** | 4 hours (covers full competition window) | 8 hours |
| **Storage** | `localStorage` (acceptable for this use case — see security notes) | `localStorage` |
| **Refresh** | No refresh tokens (single-use competition) | No refresh tokens |

### Middleware Chain

```
Request
  ↓
extractToken()        → Reads Bearer token from Authorization header
  ↓
verifyToken()         → jwt.verify() with secret
  ↓
attachUser()          → Attaches decoded payload to req.user
  ↓
requireRole('admin')  → Optional: checks req.user.role
  ↓
Controller
```

### Why No Password for Participants?

Participants authenticate via their unique `participantId` (distributed during event registration). Reasons:
- **UX**: Adding password creation/management for a 2-hour competition adds friction without proportional security benefit.
- **Context**: This is an in-person college event, not a public internet application.
- **Mitigation**: The `participantId` is unique and not publicly listed. Combined with server-side session binding, impersonation would require knowing someone's ID and them not having already started.

> [!WARNING]
> If there's concern about participants sharing IDs, consider adding a simple PIN during registration, or using pre-registered participants (admin bulk-imports IDs, and participants can only log in with known IDs).

---

## 10. Quiz/Competition State Machine

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED : Session created

    NOT_STARTED --> ACTIVE_LEVEL_1 : startCompetition()

    ACTIVE_LEVEL_1 --> COMPLETED_LEVEL_1 : All L1 questions answered

    COMPLETED_LEVEL_1 --> ACTIVE_LEVEL_2 : advanceToLevel2()

    ACTIVE_LEVEL_2 --> COMPLETED_LEVEL_2 : All L2 steps completed
    ACTIVE_LEVEL_2 --> ELIMINATED : Lives reach 0

    COMPLETED_LEVEL_2 --> ACTIVE_LEVEL_3 : advanceToLevel3()

    ACTIVE_LEVEL_3 --> COMPLETED : All L3 questions answered

    ELIMINATED --> [*]
    COMPLETED --> [*]
```

### Valid State Transitions

| Current Status | Allowed Next Status | Trigger |
|---|---|---|
| `NOT_STARTED` | `ACTIVE_LEVEL_1` | Participant clicks "Start" |
| `ACTIVE_LEVEL_1` | `COMPLETED_LEVEL_1` | Last L1 question answered |
| `COMPLETED_LEVEL_1` | `ACTIVE_LEVEL_2` | Participant clicks "Continue to Level 2" |
| `ACTIVE_LEVEL_2` | `COMPLETED_LEVEL_2` | Last L2 step answered correctly |
| `ACTIVE_LEVEL_2` | `ELIMINATED` | Lives reach 0 |
| `COMPLETED_LEVEL_2` | `ACTIVE_LEVEL_3` | Participant clicks "Continue to Level 3" |
| `ACTIVE_LEVEL_3` | `COMPLETED` | Last L3 question answered |

### Server Enforcement

The service layer maintains a transition map:

```
VALID_TRANSITIONS = {
  'NOT_STARTED':       ['ACTIVE_LEVEL_1'],
  'ACTIVE_LEVEL_1':    ['COMPLETED_LEVEL_1'],
  'COMPLETED_LEVEL_1': ['ACTIVE_LEVEL_2'],
  'ACTIVE_LEVEL_2':    ['COMPLETED_LEVEL_2', 'ELIMINATED'],
  'COMPLETED_LEVEL_2': ['ACTIVE_LEVEL_3'],
  'ACTIVE_LEVEL_3':    ['COMPLETED'],
  'COMPLETED':         [],
  'ELIMINATED':        []
}
```

Before any state change, the service checks: `if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) throw ForbiddenError`.

This prevents:
- Skipping levels (L1 → L3)
- Going backward (L2 → L1)
- Restarting after completion/elimination
- Any client-side manipulation of the `status` field

---

## 11. Timer Architecture

### Design: Server-Authoritative Timestamps

The timer is **NOT** a JavaScript `setInterval` counter. It is derived from server-stored timestamps.

```mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant MongoDB

    Browser->>Server: POST /api/session/start
    Server->>MongoDB: Set startTime = new Date()
    Server-->>Browser: { startTime: "2026-10-01T10:00:00Z" }

    Note over Browser: Display timer = Date.now() - startTime

    Browser->>Server: POST /api/quiz/submit-answer
    Server-->>Browser: { ... } (no timer reset)

    Note over Browser: Timer continues: Date.now() - startTime

    Browser->>Server: POST /api/quiz/complete (Level 3)
    Server->>MongoDB: Set endTime = new Date()
    Server->>MongoDB: Set timeTakenMs = endTime - startTime
    Server-->>Browser: { timeTakenMs: 4230000 }
```

### How It Works

1. **Start**: Server stores `startTime = new Date()` in the session document.
2. **Display**: Frontend calculates `elapsed = Date.now() - new Date(startTime).getTime()` and formats as `MM:SS`.
3. **Continuity**: `startTime` never changes. Moving between levels does not reset it.
4. **Refresh recovery**: On page load, frontend calls `GET /api/session/current` → receives `startTime` → resumes display.
5. **End**: Server stores `endTime = new Date()` and calculates `timeTakenMs = endTime - startTime`.

### Why Not a Server-Sent Timer?

- Sending tick-by-tick updates (WebSocket or SSE) for 140 participants would strain a free-tier Render instance.
- The frontend's `Date.now()` is sufficiently accurate for display purposes (±1 second drift is acceptable for a quiz competition).
- The **actual** time used for scoring/ranking is `timeTakenMs`, calculated entirely on the server.

### Clock Drift Mitigation

If needed, the frontend can periodically sync with the server:
1. On each API response, the server includes its current timestamp in a response header (`X-Server-Time`).
2. The frontend calculates `offset = serverTime - Date.now()` and applies it to the timer display.
3. This compensates for client clocks that are slightly off.

For a college symposium, this is optional — most modern devices have accurate clocks.

---

## 12. Level 1 Architecture — MCQ

### Question Selection Flow

```
Session Start
  ↓
Read CompetitionConfig.level1QuestionCount (default: 20)
  ↓
Query: db.questions.aggregate([
  { $match: { level: 1, type: "mcq", isActive: true } },
  { $sample: { size: 20 } }
])
  ↓
Store selected question IDs in session.level1Questions
  ↓
Set session.level1CurrentIndex = 0
```

### Question Serving

When the frontend requests the next question:

```
GET /api/quiz/question
  ↓
Read session.level1CurrentIndex
  ↓
Fetch session.level1Questions[currentIndex]
  ↓
Return question WITHOUT correctAnswer field
  ↓
Response: {
  questionId,
  questionText,
  options: [{ label, text }],
  category,
  currentIndex,
  totalQuestions
}
```

### Answer Submission

```
POST /api/quiz/submit-answer
Body: { questionId, answer: "B" }
  ↓
Validate:
  - Session is ACTIVE_LEVEL_1
  - questionId matches session.level1Questions[currentIndex]
  - No existing Answer document for (session, question)
  ↓
Fetch question.correctAnswer from DB
  ↓
Compare: submitted === correct
  ↓
Create Answer document
  ↓
If correct: session.level1Score += question.points
  ↓
Increment session.level1CurrentIndex
  ↓
If index === level1Questions.length:
  Transition session.status → COMPLETED_LEVEL_1
  ↓
Response: {
  isCorrect: true/false,
  correctAnswer: "B",     // safe to reveal AFTER submission
  pointsAwarded: 5,
  currentScore: 45,
  isLevelComplete: false,
  nextIndex: 5
}
```

### Why Validate `questionId` Matches `currentIndex`?

This prevents a participant from:
- Skipping questions
- Answering questions out of order
- Re-submitting answers for already-answered questions

The server controls the progression, not the client.

---

## 13. Level 2 Architecture — Exit Room

### Design

Level 2 is structurally similar to Level 1 but adds a **lives mechanic**.

### State at Level 2 Entry

```
session.status = ACTIVE_LEVEL_2
session.lives = CompetitionConfig.level2Lives (default: 3)
session.level2CurrentIndex = 0
session.level2Questions = [randomly selected step question IDs]
```

### Answer Submission

```
POST /api/quiz/submit-answer
Body: { questionId, answer: "C" }
  ↓
Validate:
  - Session is ACTIVE_LEVEL_2
  - session.lives > 0
  - questionId matches level2Questions[currentIndex]
  ↓
If correct:
  session.level2Score += points
  session.level2CurrentIndex++
  
  If all steps completed:
    session.status → COMPLETED_LEVEL_2
  ↓
If wrong:
  session.lives--
  pointsAwarded = 0
  // DO NOT advance currentIndex — participant retries the same step?
  // OR: advance to next step (design decision below)
  
  If session.lives === 0:
    session.status → ELIMINATED
    session.endTime = new Date()
    session.timeTakenMs = endTime - startTime
```

> [!IMPORTANT]
> **Design decision: On wrong answer, does the participant retry the same step or move to the next step?**
>
> **Recommendation: Move to the next step.** Retrying the same step effectively gives the answer away (elimination of options). Moving forward maintains challenge integrity. This means a participant could be eliminated before reaching the last step if they lose all 3 lives across any 3 steps.
>
> If the desired behavior is different (retry same step), the architecture supports it by simply not incrementing `level2CurrentIndex` on wrong answers.

### Lives Display

The response always includes current `lives` count. The frontend renders hearts:

```
lives: 3 → ❤️ ❤️ ❤️
lives: 2 → ❤️ ❤️ 🖤
lives: 1 → ❤️ 🖤 🖤
lives: 0 → ELIMINATED
```

---

## 14. Level 3 Architecture — Guess the Output

### Design

Display a code snippet (Python or Java). Participant types the expected console output.

### Question Schema (Level 3 specific fields)

```
{
  type: "guess_output",
  level: 3,
  questionText: "What is the output of the following code?",
  codeSnippet: "for i in range(3):\n    print(i, end=' ')",
  language: "python",
  correctAnswer: "0 1 2",
  points: 10
}
```

### Answer Comparison Strategy

The server compares submitted output against `correctAnswer` with these normalizations:

1. **Trim whitespace** from both ends
2. **Normalize line endings** (`\r\n` → `\n`)
3. **Case-sensitive comparison** (output is code — case matters)
4. **Collapse trailing newlines** (a trailing `\n` in output shouldn't cause failure)

```
normalize(answer):
  return answer.trim().replace(/\r\n/g, '\n').replace(/\n+$/, '')

isCorrect = normalize(submitted) === normalize(correctAnswer)
```

> [!NOTE]
> The comparison is done server-side. Participant-submitted text is NEVER executed as code. It is only compared as a string.

### Completion

After the last Level 3 question:

```
session.status → COMPLETED
session.endTime = new Date()
session.timeTakenMs = endTime - startTime
session.totalScore = level1Score + level2Score + level3Score
```

---

## 15. Scoring Architecture

### Point Configuration

| Level | Default Points per Correct Answer | Configurable Via |
|---|---|---|
| Level 1 (MCQ) | 5 | `CompetitionConfig.level1PointsPerQuestion` |
| Level 2 (Exit Room) | 10 | `CompetitionConfig.level2PointsPerStep` |
| Level 3 (Guess Output) | 10 | `CompetitionConfig.level3PointsPerQuestion` |

### Maximum Possible Score (Default Config)

```
Level 1: 20 questions × 5 points = 100
Level 2:  3 steps     × 10 points = 30
Level 3:  5 questions × 10 points = 50
─────────────────────────────────────
Maximum Total:                      180
```

### Score Calculation Rules

| Scenario | Points |
|---|---|
| Correct answer | Configured points for that level |
| Wrong answer | 0 (no negative marking) |

### Where Scores Are Calculated

**Always on the server.** The flow:

1. Participant submits answer → API call
2. Server fetches `question.correctAnswer` from DB
3. Server compares
4. Server increments `session.levelNScore` if correct
5. Server recalculates `session.totalScore = l1 + l2 + l3`
6. Server saves session
7. Response includes updated scores

The frontend displays scores from the API response. It never calculates or stores scores independently.

### Score Integrity Guarantee

- No API endpoint accepts a score value from the client.
- The `totalScore` field is computed server-side from sub-scores.
- Sub-scores are computed from `Answer` documents (audit trail).
- An admin can recalculate scores from the `answers` collection if needed.

---

## 16. API Architecture

### API Base URL

```
Production: https://quiz-api.onrender.com/api
Development: http://localhost:5000/api
```

### Authentication APIs

---

#### `POST /api/auth/register`

| | |
|---|---|
| **Purpose** | Register a new participant and issue JWT |
| **Auth Required** | No |
| **Request Body** | `{ fullName, collegeName, department, participantId }` |
| **Response** | `{ token, participant: { id, fullName, collegeName, department, participantId } }` |
| **Validation** | All fields required; `participantId` must be unique; string lengths; no special character injection |
| **Errors** | `400` — validation error; `409` — participantId already registered |

---

#### `POST /api/auth/login`

| | |
|---|---|
| **Purpose** | Login existing participant by participantId |
| **Auth Required** | No |
| **Request Body** | `{ participantId }` |
| **Response** | `{ token, participant: { id, fullName, collegeName, department, participantId } }` |
| **Validation** | `participantId` must exist |
| **Errors** | `404` — participant not found |

---

#### `POST /api/auth/admin/login`

| | |
|---|---|
| **Purpose** | Admin login |
| **Auth Required** | No |
| **Request Body** | `{ username, password }` |
| **Response** | `{ token, admin: { id, username, role } }` |
| **Validation** | Both fields required; bcrypt password comparison |
| **Errors** | `401` — invalid credentials; `403` — account disabled |

---

### Session APIs

---

#### `GET /api/session/current`

| | |
|---|---|
| **Purpose** | Get current session for the authenticated participant (session recovery) |
| **Auth Required** | Participant JWT |
| **Response** | `{ session: { status, currentLevel, startTime, totalScore, level1Score, level2Score, level3Score, lives, level1CurrentIndex, ... } }` or `{ session: null }` if no active session |
| **Errors** | `401` — unauthenticated |

---

#### `POST /api/session/start`

| | |
|---|---|
| **Purpose** | Create a new quiz session and start the competition |
| **Auth Required** | Participant JWT |
| **Request Body** | `{}` (empty — server reads config and creates session) |
| **Response** | `{ session: { id, status: "ACTIVE_LEVEL_1", startTime, lives, ... } }` |
| **Validation** | No existing active/completed session; competition must be in `"active"` status |
| **Errors** | `409` — session already exists; `403` — competition not active |

---

### Quiz APIs

---

#### `GET /api/quiz/question`

| | |
|---|---|
| **Purpose** | Get the current question for the participant's active level |
| **Auth Required** | Participant JWT |
| **Response (L1)** | `{ question: { id, questionText, options, category }, currentIndex, totalQuestions, level: 1 }` |
| **Response (L2)** | `{ question: { id, questionText, options/codeSnippet, category }, currentIndex, totalSteps, lives, level: 2 }` |
| **Response (L3)** | `{ question: { id, questionText, codeSnippet, language }, currentIndex, totalQuestions, level: 3 }` |
| **Validation** | Session must be in an `ACTIVE_*` state |
| **Errors** | `403` — not in active level state; `404` — no more questions |

> [!IMPORTANT]
> The `correctAnswer` field is **never** included in this response.

---

#### `POST /api/quiz/submit-answer`

| | |
|---|---|
| **Purpose** | Submit an answer for the current question |
| **Auth Required** | Participant JWT |
| **Request Body** | `{ questionId, answer }` |
| **Response** | `{ isCorrect, correctAnswer, pointsAwarded, currentScore, lives (L2), isLevelComplete, isEliminated, nextIndex }` |
| **Validation** | Session active; `questionId` matches current question; no duplicate submission; answer is non-empty string |
| **Errors** | `400` — invalid answer; `403` — session completed/eliminated; `409` — already answered |

---

#### `POST /api/quiz/advance-level`

| | |
|---|---|
| **Purpose** | Advance to the next level after completing the current one |
| **Auth Required** | Participant JWT |
| **Request Body** | `{ targetLevel: 2 }` or `{ targetLevel: 3 }` |
| **Response** | `{ session: { status, currentLevel, ... } }` |
| **Validation** | Current status must be `COMPLETED_LEVEL_N` and targetLevel must be N+1 |
| **Errors** | `403` — invalid state transition |

---

### Results APIs

---

#### `GET /api/results/me`

| | |
|---|---|
| **Purpose** | Get the authenticated participant's final result |
| **Auth Required** | Participant JWT |
| **Response** | `{ result: { totalScore, level1Score, level2Score, level3Score, timeTakenMs, status, rank } }` |
| **Validation** | Session must be `COMPLETED` or `ELIMINATED` |
| **Errors** | `403` — competition still in progress |

---

#### `GET /api/results/leaderboard`

| | |
|---|---|
| **Purpose** | Get the competition leaderboard |
| **Auth Required** | Optional (configurable: public or admin-only) |
| **Query Params** | `?page=1&limit=20&status=COMPLETED` |
| **Response** | `{ leaderboard: [{ rank, fullName, collegeName, totalScore, timeTakenMs, status }], pagination: { ... } }` |
| **Errors** | `403` — leaderboard not public and not admin |

---

### Admin APIs

---

#### `GET /api/admin/participants`

| | |
|---|---|
| **Purpose** | List all participants with session data |
| **Auth Required** | Admin JWT |
| **Query Params** | `?search=john&status=COMPLETED&page=1&limit=20&sortBy=totalScore&order=desc` |
| **Response** | `{ participants: [...], pagination: { total, page, pages } }` |

---

#### `GET /api/admin/participants/:id`

| | |
|---|---|
| **Purpose** | Get detailed participant session data |
| **Auth Required** | Admin JWT |
| **Response** | `{ participant: {...}, session: {...}, answers: [...] }` |

---

#### `GET /api/admin/sessions/stats`

| | |
|---|---|
| **Purpose** | Get aggregate stats (active, completed, eliminated counts, avg score) |
| **Auth Required** | Admin JWT |
| **Response** | `{ totalParticipants, activeSessions, completedSessions, eliminatedSessions, averageScore, ... }` |

---

#### `GET /api/admin/questions`

| | |
|---|---|
| **Purpose** | List all questions with filtering |
| **Auth Required** | Admin JWT |
| **Query Params** | `?level=1&type=mcq&category=Java&isActive=true&page=1&limit=20` |
| **Response** | `{ questions: [...], pagination: { ... } }` |

---

#### `POST /api/admin/questions`

| | |
|---|---|
| **Purpose** | Add a new question |
| **Auth Required** | Admin JWT |
| **Request Body** | Full question object |
| **Validation** | Type-specific validation (MCQ requires options, guess_output requires codeSnippet) |
| **Response** | `{ question: { ... } }` |
| **Errors** | `400` — validation error |

---

#### `PUT /api/admin/questions/:id`

| | |
|---|---|
| **Purpose** | Update a question |
| **Auth Required** | Admin JWT |
| **Request Body** | Partial question object (fields to update) |
| **Response** | `{ question: { ... } }` |

---

#### `PATCH /api/admin/questions/:id/toggle`

| | |
|---|---|
| **Purpose** | Toggle question active/inactive status |
| **Auth Required** | Admin JWT |
| **Response** | `{ question: { id, isActive } }` |

---

#### `GET /api/admin/config`

| | |
|---|---|
| **Purpose** | Get current competition configuration |
| **Auth Required** | Admin JWT |
| **Response** | `{ config: { ... } }` |

---

#### `PUT /api/admin/config`

| | |
|---|---|
| **Purpose** | Update competition configuration |
| **Auth Required** | Admin JWT |
| **Request Body** | Partial config object |
| **Validation** | Numeric ranges; `competitionStatus` must be valid enum |
| **Response** | `{ config: { ... } }` |

> [!WARNING]
> Config changes (question count, points) should only take effect for **new** sessions. In-progress sessions use the config values that were locked at session creation time.

---

#### `POST /api/admin/competition/start`

| | |
|---|---|
| **Purpose** | Set competition status to "active" |
| **Auth Required** | Admin JWT (`super_admin`) |
| **Response** | `{ config: { competitionStatus: "active" } }` |

---

#### `POST /api/admin/competition/pause`

| | |
|---|---|
| **Purpose** | Set competition status to "paused" (prevents new sessions) |
| **Auth Required** | Admin JWT (`super_admin`) |
| **Response** | `{ config: { competitionStatus: "paused" } }` |

---

#### `POST /api/admin/competition/end`

| | |
|---|---|
| **Purpose** | Set competition status to "ended" (prevents new sessions, finalizes results) |
| **Auth Required** | Admin JWT (`super_admin`) |
| **Response** | `{ config: { competitionStatus: "ended" } }` |

---

#### `GET /api/health`

| | |
|---|---|
| **Purpose** | Health check endpoint for monitoring |
| **Auth Required** | No |
| **Response** | `{ status: "ok", timestamp: "...", dbStatus: "connected" }` |

---

## 17. Admin Architecture

### Admin Roles & Permissions

| Permission | `admin` | `super_admin` |
|---|---|---|
| View participants | ✅ | ✅ |
| Search/filter participants | ✅ | ✅ |
| View sessions (active/completed/eliminated) | ✅ | ✅ |
| View scores and time taken | ✅ | ✅ |
| View leaderboard | ✅ | ✅ |
| Add questions | ✅ | ✅ |
| Edit questions | ✅ | ✅ |
| Disable/enable questions | ✅ | ✅ |
| Configure scoring parameters | ❌ | ✅ |
| Configure question counts | ❌ | ✅ |
| Start competition | ❌ | ✅ |
| Pause competition | ❌ | ✅ |
| End competition | ❌ | ✅ |
| Create/manage admin accounts | ❌ | ✅ |

### Admin Dashboard Layout

```
┌──────────────────────────────────────────────┐
│  Admin Dashboard                              │
├──────────┬───────────────────────────────────┤
│          │                                    │
│  Sidebar │  Main Content Area                 │
│          │                                    │
│  • Dashboard (Stats)                          │
│  • Participants                               │
│  • Questions                                  │
│  • Settings                                   │
│  • Leaderboard                                │
│          │                                    │
└──────────┴───────────────────────────────────┘
```

### Dashboard Stats Cards

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Total: 142 │ │ Active: 38 │ │ Done: 87   │ │ Elim: 17   │
│ Registered │ │ Sessions   │ │ Completed  │ │ Eliminated │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Admin Account Seeding

The first admin account should be created via a seed script (not a public registration endpoint):

```
node scripts/seedAdmin.js
  → Creates super_admin with credentials from environment variables
  → ADMIN_USERNAME, ADMIN_PASSWORD (env vars, never hardcoded)
```

---

## 18. Leaderboard Architecture

### Ranking Algorithm

```
Primary Sort:   totalScore DESC   (highest score first)
Secondary Sort: timeTakenMs ASC   (fastest time breaks ties)
```

### Tie-Breaking Logic

| Scenario | Resolution |
|---|---|
| Same score, different time | Faster participant ranks higher |
| Same score, same time (extremely unlikely) | Earlier `endTime` ranks higher |
| Eliminated participants | Ranked below all completed participants, then by score/time |

### Query Strategy

```javascript
// MongoDB query for leaderboard
db.quizsessions.find({
  status: { $in: ['COMPLETED', 'ELIMINATED'] }
})
.sort({ totalScore: -1, timeTakenMs: 1 })
.populate('participant', 'fullName collegeName')
.skip((page - 1) * limit)
.limit(limit)
```

**Index used:** `{ totalScore: -1, timeTakenMs: 1 }` — a compound index that supports the sort without in-memory sorting.

### Real-Time vs. Periodic Refresh

**Recommendation: Periodic refresh (polling every 30 seconds).**

| Approach | Pros | Cons |
|---|---|---|
| Real-time (WebSocket) | Instant updates | Complex; resource-heavy on Render free tier |
| Polling (30s interval) | Simple; low server load | Slight delay in updates |

For a symposium with 140 participants, polling is more reliable. The leaderboard page fetches fresh data every 30 seconds using `setInterval` + API call. Admin can also manually refresh.

### Leaderboard Response Shape

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "fullName": "Alice M.",
      "collegeName": "ABC College",
      "totalScore": 175,
      "timeTakenMs": 1823000,
      "status": "COMPLETED"
    }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "pages": 8,
    "limit": 20
  }
}
```

---

## 19. Security Architecture

### Threat Model for a Quiz Competition

| Threat | Severity | Mitigation |
|---|---|---|
| Participant views correct answers before submitting | **Critical** | Server never sends `correctAnswer` in question responses |
| Participant manipulates score via DevTools | **Critical** | Score is server-computed; no API accepts score from client |
| Participant manipulates timer | **Critical** | Timer is server-authoritative (`startTime`/`endTime` in MongoDB) |
| Participant skips to Level 3 | **High** | State machine enforced server-side |
| Participant submits duplicate answers | **High** | Unique index on `{ session, question }` in `answers` collection |
| Participant submits after elimination | **High** | Server checks `session.status` before processing |
| Participant impersonates another participant | **Medium** | JWT-bound sessions; session linked to JWT's participant ID |
| API abuse / DDoS | **Medium** | Rate limiting (express-rate-limit) |
| MongoDB injection | **Medium** | Mongoose parameterized queries; input validation |
| XSS | **Medium** | React's built-in escaping; Helmet security headers |

### Security Layers

#### 1. JWT Authentication

- Tokens signed with `JWT_SECRET` (256-bit+ secret from env vars)
- All quiz/session endpoints require valid JWT
- Token payload includes `role` — middleware checks role before admin routes

#### 2. Admin Authentication

- Passwords hashed with `bcrypt` (12 rounds)
- Admin accounts created via seed script, not public registration
- Admin routes protected by `requireRole('admin')` middleware

#### 3. Input Validation

Every API endpoint validates input using `express-validator` or `joi`:
- String length limits
- Enum validation for `type`, `status`, `difficulty`
- ObjectId format validation
- Required field checks
- No raw user input in MongoDB queries

#### 4. Rate Limiting

```
Global:        100 requests per 15 minutes per IP
Auth routes:   20 requests per 15 minutes per IP
Answer submit: 60 requests per 15 minutes per IP (one answer every 15 seconds average)
```

#### 5. CORS

```javascript
cors({
  origin: 'https://quiz-competition.vercel.app', // exact frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
})
```

#### 6. Helmet

```javascript
helmet() // Sets security headers:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security
// Content-Security-Policy
```

#### 7. Secure API Responses

- Never include `correctAnswer` in question GET responses
- Never include `passwordHash` in admin responses
- Use Mongoose `select('-correctAnswer')` or explicit field projection
- Error responses never leak stack traces in production

#### 8. MongoDB Injection Protection

- Mongoose schemas enforce types → passing `{ $gt: "" }` as a string field will be rejected
- Input validation rejects objects where strings are expected
- Never use `eval()` or `$where` operators

### Client-Side vs. Server-Side Protections

| Protection | Client-Side (UX) | Server-Side (Enforced) |
|---|---|---|
| Can't skip levels | Route guards redirect | State machine validation |
| Can't submit twice | Button disabled after click | Unique index on answers |
| Timer display | `Date.now() - startTime` | `endTime - startTime` in MongoDB |
| Score display | Shows server-returned score | Score computed from answers |
| Lives display | Shows server-returned lives | Lives decremented server-side |
| Prevent DevTools manipulation | Not possible to fully prevent | All state validated server-side |

> [!CAUTION]
> **Client-side protections are UX conveniences, not security measures.** A determined participant with browser DevTools can bypass any frontend check. The server must independently validate everything.

---

## 20. Concurrent User Architecture

### Scale Target: 140+ Simultaneous Participants

#### MongoDB Connection Management

```javascript
// Mongoose connection with pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,       // Max connections in the pool
  minPoolSize: 5,        // Keep 5 connections warm
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
});
```

**Why 50 pool size?** Each concurrent API request uses one connection. With 140 participants, peak concurrent API calls (e.g., all submitting answers within a few seconds) might be 20–40 simultaneous requests. 50 provides headroom.

#### Request Load Analysis

| Scenario | Requests per participant | Total (140 participants) |
|---|---|---|
| Session start | 1 | 140 |
| Level 1 (20 questions × 2 calls each: get + submit) | 40 | 5,600 |
| Level 2 (3 steps × 2 calls) | 6 | 840 |
| Level 3 (5 questions × 2 calls) | 10 | 1,400 |
| Session recovery (page refresh) | 1–5 | ~200 |
| **Total over competition** | ~60 | ~8,200 |

Over a 2-hour competition, this averages to ~1.1 requests/second — well within Render's free-tier capacity.

**Peak scenario:** All 140 participants start within 5 minutes → ~28 starts/minute → < 1 per second. This is trivially handled.

#### Database Indexes (Critical for Performance)

```javascript
// These indexes MUST exist for acceptable query performance:
participants:    { participantId: 1 }       // unique
quizsessions:    { participant: 1 }          // unique — session lookup
quizsessions:    { status: 1 }               // filter by status
quizsessions:    { totalScore: -1, timeTakenMs: 1 }  // leaderboard
answers:         { session: 1, question: 1 } // unique — duplicate prevention
answers:         { session: 1, level: 1 }    // fetch answers by level
questions:       { type: 1, level: 1, isActive: 1 }  // question selection
```

Without these indexes, MongoDB would perform collection scans, which degrade badly beyond ~100 documents.

#### Preventing Race Conditions

**Scenario:** Participant double-clicks "Submit" → two identical requests arrive.

**Solution:** The unique compound index `{ session: 1, question: 1 }` on the `answers` collection means the second insert will throw a duplicate key error. The service layer catches this and returns a `409 Conflict`.

**Scenario:** Two requests try to modify the same session document simultaneously.

**Solution:** Use Mongoose's atomic update operators:

```
// Instead of:
session.level1Score += points;
await session.save();

// Use:
await QuizSession.findByIdAndUpdate(sessionId, {
  $inc: { level1Score: points, totalScore: points },
  $set: { level1CurrentIndex: nextIndex }
}, { new: true });
```

`$inc` and `$set` are atomic at the document level in MongoDB → no lost updates.

#### Render Deployment Considerations

| Factor | Consideration |
|---|---|
| **Cold starts** | Render free tier spins down after 15 min inactivity. Use a health-check ping (e.g., UptimeRobot every 14 min) to keep it warm during competition. |
| **Memory** | Free tier: 512MB RAM. Express + Mongoose for 140 users is well within limits (~50–100MB). |
| **CPU** | Free tier: shared CPU. Adequate for REST API workload; no compute-intensive operations. |
| **Timeout** | Render free tier has a 30-second request timeout. All API calls should complete in < 5 seconds. |

#### MongoDB Atlas Considerations

| Factor | Consideration |
|---|---|
| **M0 (Free Tier)** | 512MB storage, shared RAM, 500 max connections. Sufficient for 140 participants. |
| **Network** | Choose Atlas region closest to Render region (e.g., both US-East). |
| **Connections** | M0 allows 500 connections. With pool size 50, this is fine. |
| **Storage** | 140 sessions × 28 answers × ~500 bytes/answer ≈ 2MB. Plus 100 questions ≈ 50KB. Well under 512MB. |

> [!NOTE]
> These numbers are theoretical estimates. **Load testing before the event is essential.** Use a tool like `artillery` or `k6` to simulate 140 concurrent users submitting answers. This can be done against a staging deployment on Render.

---

## 21. Error Handling Architecture

### Error Classification

| Category | HTTP Status | Example | Recovery |
|---|---|---|---|
| **Validation Error** | 400 | Missing required field | Show error message, user corrects input |
| **Authentication Error** | 401 | Invalid/expired JWT | Redirect to login |
| **Authorization Error** | 403 | Participant accessing admin route | Show "access denied" |
| **Not Found** | 404 | Invalid question ID | Show error message |
| **Conflict** | 409 | Duplicate answer submission | Ignore silently (answer already recorded) |
| **Server Error** | 500 | MongoDB connection failure | Show retry message |

### Backend Error Handling

```
Custom AppError class:
  → statusCode
  → message
  → isOperational (true = expected error, false = programming bug)

Global error handler middleware:
  → Catches all errors
  → Logs full error in development
  → Returns sanitized error in production (no stack traces)
  → Distinguishes operational vs. programming errors
```

### Frontend Error Handling

| Scenario | Behavior |
|---|---|
| **Internet disconnects** | Axios interceptor detects network error → shows "Connection lost. Retrying..." toast → auto-retry with exponential backoff (max 3 retries) |
| **Page refresh** | On app mount, `useSession()` hook calls `GET /api/session/current` → restores full session state → routes to correct level page |
| **Browser closes** | Same as refresh — session is in MongoDB, fully recoverable |
| **API request fails (500)** | Show "Something went wrong. Please try again." → retry button |
| **JWT expires** | Axios interceptor detects 401 → clears token → redirects to login → on re-login, session recovery kicks in |
| **Duplicate request** | Server returns 409 → frontend treats as success (answer was already recorded) |
| **Invalid answer** | Server returns 400 → show validation error message |
| **Answer after session ended** | Server returns 403 → redirect to result page |

### Session Recovery Flow

```mermaid
flowchart TD
    A["App Mounts / Page Refresh"] --> B{"JWT in localStorage?"}
    B -->|No| C["Show Login Page"]
    B -->|Yes| D["GET /api/session/current"]
    D --> E{"Active session exists?"}
    E -->|No| F["Show Start Game Page"]
    E -->|Yes| G["Read session.status"]
    G --> H{"Route to correct page"}
    H --> H1["ACTIVE_LEVEL_1 → /level/1"]
    H --> H2["COMPLETED_LEVEL_1 → /level/1/result"]
    H --> H3["ACTIVE_LEVEL_2 → /level/2"]
    H --> H4["ACTIVE_LEVEL_3 → /level/3"]
    H --> H5["COMPLETED → /result"]
    H --> H6["ELIMINATED → /result"]
```

### MongoDB Temporary Failure

If MongoDB is briefly unreachable:
- Mongoose's built-in retry logic handles transient connection issues
- The connection pool automatically reconnects
- Requests during the outage receive 500 errors → frontend retries
- No data is lost because writes are atomic (either fully committed or not)

---

## 22. Deployment Architecture

### Architecture Diagram

```mermaid
flowchart LR
    subgraph Users["Participants' Browsers"]
        B["Browser"]
    end

    subgraph Vercel["Vercel (Frontend)"]
        CDN["CDN / Edge"]
        SPA["React Build (Static Files)"]
    end

    subgraph Render["Render (Backend)"]
        API["Express.js API Server"]
    end

    subgraph Atlas["MongoDB Atlas"]
        DB["MongoDB Cluster"]
    end

    B -->|"HTTPS"| CDN
    CDN --> SPA
    B -->|"HTTPS API Calls"| API
    API -->|"mongodb+srv://"| DB
```

### Environment Variables

#### Backend (Render)

| Variable | Example | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Environment flag |
| `PORT` | `5000` | Server port (Render sets this) |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/quizdb` | Atlas connection string |
| `JWT_SECRET` | `<256-bit random string>` | Token signing secret |
| `JWT_EXPIRES_IN` | `4h` | Token expiry duration |
| `CORS_ORIGIN` | `https://quiz-competition.vercel.app` | Allowed frontend origin |
| `ADMIN_USERNAME` | `admin` | Seed script admin username |
| `ADMIN_PASSWORD` | `<strong password>` | Seed script admin password |

#### Frontend (Vercel)

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://quiz-api.onrender.com/api` | Backend API base URL |

### CORS Configuration

```javascript
// Only allow the specific Vercel frontend domain
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
```

### Health Check Endpoint

```
GET /api/health
Response: { status: "ok", uptime: process.uptime(), dbStatus: "connected" }
```

Use UptimeRobot or similar to ping this endpoint every 14 minutes to prevent Render free-tier cold starts during the competition.

### Logging Strategy

| Environment | Logger | Output |
|---|---|---|
| Development | `morgan('dev')` | Console |
| Production | `winston` | JSON to stdout (Render captures) |

Log: request method, URL, status code, response time, error details (no sensitive data).

### Production Error Handling

```javascript
// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Log full error details
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.originalUrl,
    method: req.method
  });

  // Send sanitized response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### Vercel Configuration

Create `vercel.json` in the frontend root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures all routes are handled by React Router (SPA fallback).

---

## 23. Folder Structure

```
Symposium_Technical_Event_Website/
│
├── client/                          # React Frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                  # Static assets (images, icons)
│   │   ├── components/              # Reusable UI components
│   │   │   ├── common/              # LoadingSpinner, ErrorBoundary, Toast
│   │   │   ├── competition/         # Timer, LivesIndicator, ProgressBar
│   │   │   ├── questions/           # QuestionCard, OptionsList, CodeSnippet
│   │   │   └── admin/               # StatsCard, DataTable, QuestionForm
│   │   ├── contexts/                # React Contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── CompetitionContext.jsx
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSession.js
│   │   │   ├── useTimer.js
│   │   │   ├── useLevel1.js
│   │   │   ├── useLevel2.js
│   │   │   ├── useLevel3.js
│   │   │   └── useLeaderboard.js
│   │   ├── layouts/                 # Layout components
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── CompetitionLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/                   # Page components (one per route)
│   │   │   ├── LandingPage.jsx
│   │   │   ├── InstructionsPage.jsx
│   │   │   ├── Level1Page.jsx
│   │   │   ├── Level1ResultPage.jsx
│   │   │   ├── Level2Page.jsx
│   │   │   ├── Level3Page.jsx
│   │   │   ├── FinalResultPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.jsx
│   │   │       ├── DashboardPage.jsx
│   │   │       ├── ParticipantsPage.jsx
│   │   │       ├── QuestionsPage.jsx
│   │   │       └── SettingsPage.jsx
│   │   ├── services/                # API service layer
│   │   │   ├── api.js               # Axios instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── sessionService.js
│   │   │   ├── quizService.js
│   │   │   ├── resultService.js
│   │   │   └── adminService.js
│   │   ├── utils/                   # Frontend utilities
│   │   │   ├── constants.js         # Status enums, config values
│   │   │   ├── formatters.js        # Time formatting, score display
│   │   │   └── validators.js        # Client-side form validation
│   │   ├── App.jsx                  # Root component + router
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Tailwind directives
│   ├── .env                         # VITE_API_URL
│   ├── .env.example                 # Template
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── vercel.json                  # SPA rewrite rules
│   └── package.json
│
├── server/                          # Express Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection setup
│   │   └── environment.js           # Centralized env var access
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   ├── quizController.js
│   │   ├── resultController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   ├── roleCheck.js             # Role-based access
│   │   ├── rateLimiter.js           # Rate limiting configs
│   │   ├── validateInput.js         # Input validation middleware
│   │   └── errorHandler.js          # Global error handler
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Participant.js
│   │   ├── QuizSession.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   └── CompetitionConfig.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── resultRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── sessionService.js
│   │   ├── quizService.js
│   │   ├── resultService.js
│   │   └── adminService.js
│   ├── utils/
│   │   ├── AppError.js              # Custom error class
│   │   ├── catchAsync.js            # Async error wrapper
│   │   ├── responseFormatter.js     # Consistent response shape
│   │   ├── constants.js             # Status enums, valid transitions
│   │   └── answerNormalizer.js      # String normalization for L3
│   ├── scripts/
│   │   ├── seedAdmin.js             # Create initial admin account
│   │   ├── seedQuestions.js          # Import question bank
│   │   └── seedConfig.js            # Initialize competition config
│   ├── data/
│   │   └── questions.json           # Question bank seed data
│   ├── .env                         # All server env vars
│   ├── .env.example                 # Template
│   ├── server.js                    # Entry point: app.listen()
│   ├── app.js                       # Express app setup (middleware, routes)
│   └── package.json
│
├── .gitignore
└── README.md
```

### Folder Purpose Summary

| Folder | Purpose |
|---|---|
| `client/src/components/` | Reusable, presentational UI building blocks |
| `client/src/pages/` | Route-level components, one per page |
| `client/src/contexts/` | React Context providers for global state |
| `client/src/hooks/` | Custom hooks encapsulating logic (API calls, computed state) |
| `client/src/services/` | Axios-based API abstraction layer |
| `client/src/layouts/` | Shared layout shells (nav, sidebar, footer) |
| `server/controllers/` | HTTP request/response handling only |
| `server/services/` | Business logic and state machine enforcement |
| `server/models/` | Mongoose schema definitions |
| `server/middleware/` | Cross-cutting concerns (auth, validation, errors) |
| `server/routes/` | Route definitions mapping URLs to controllers |
| `server/scripts/` | One-time setup scripts (run manually or in CI) |
| `server/data/` | Static seed data (question bank JSON) |

---

## 24. Data Flow Diagrams

### 1. Participant Registration

```
Browser: Fill registration form
  ↓
React: authService.register({ fullName, collegeName, department, participantId })
  ↓
Axios: POST /api/auth/register
  ↓
Express Route: authRoutes → authController.register
  ↓
authController: validate input → call authService.register()
  ↓
authService: Check if participantId exists
  ↓ (if not exists)
Mongoose: Participant.create({ fullName, collegeName, department, participantId })
  ↓
MongoDB: Insert into participants collection
  ↓
authService: Generate JWT with participant._id and role
  ↓
authController: res.status(201).json({ token, participant })
  ↓
Axios: Response received
  ↓
React: AuthContext stores token + participant → redirect to Instructions page
```

### 2. Starting Competition

```
Browser: Click "Start Game"
  ↓
React: sessionService.startSession()
  ↓
Axios: POST /api/session/start (with JWT in Authorization header)
  ↓
Express Route: auth middleware → sessionController.start
  ↓
sessionController: call sessionService.startSession(participantId)
  ↓
sessionService:
  1. Check: no existing active session for participant
  2. Fetch CompetitionConfig (question counts, lives)
  3. Query: random L1 questions → db.questions.aggregate($sample)
  4. Query: random L2 questions → db.questions.aggregate($sample)
  5. Query: random L3 questions → db.questions.aggregate($sample)
  6. Create QuizSession:
     {
       participant: participantId,
       status: 'ACTIVE_LEVEL_1',
       startTime: new Date(),
       lives: config.level2Lives,
       level1Questions: [...ids],
       level2Questions: [...ids],
       level3Questions: [...ids],
       level1CurrentIndex: 0,
       totalScore: 0
     }
  ↓
MongoDB: Insert into quizsessions collection
  ↓
sessionService: return session
  ↓
sessionController: res.status(201).json({ session })
  ↓
React: CompetitionContext stores session → navigate to /level/1
```

### 3. Loading Level 1 Questions

```
Browser: Level1Page mounts
  ↓
React: useLevel1 hook → quizService.getQuestion()
  ↓
Axios: GET /api/quiz/question (JWT in header)
  ↓
Express: auth middleware → quizController.getQuestion
  ↓
quizController: call quizService.getCurrentQuestion(participantId)
  ↓
quizService:
  1. Fetch session (status must be ACTIVE_LEVEL_1)
  2. Get questionId = session.level1Questions[session.level1CurrentIndex]
  3. Fetch question from DB (SELECT: questionText, options, category — NOT correctAnswer)
  ↓
MongoDB: Find question by ID
  ↓
quizService: return { question, currentIndex, totalQuestions }
  ↓
quizController: res.json({ question, currentIndex, totalQuestions, level: 1 })
  ↓
React: Display question card with options
```

### 4. Submitting an MCQ Answer

```
Browser: Select option "B" → click Submit
  ↓
React: quizService.submitAnswer({ questionId, answer: "B" })
  ↓
Axios: POST /api/quiz/submit-answer (JWT in header)
  ↓
Express: auth middleware → validate input → quizController.submitAnswer
  ↓
quizController: call quizService.submitAnswer(participantId, questionId, answer)
  ↓
quizService:
  1. Fetch session (status must be ACTIVE_LEVEL_1)
  2. Verify questionId === session.level1Questions[session.level1CurrentIndex]
  3. Check: no existing Answer for (session._id, questionId)
  4. Fetch question.correctAnswer from DB
  5. Compare: "B" === correctAnswer?
  6. Create Answer document: { session, question, level: 1, submittedAnswer, isCorrect, pointsAwarded }
  7. Atomic update session:
     $inc: { level1Score: points, totalScore: points }
     $inc: { level1CurrentIndex: 1 }
  8. Check: if level1CurrentIndex >= level1Questions.length → transition to COMPLETED_LEVEL_1
  ↓
MongoDB: Insert answer + update session (two operations)
  ↓
quizService: return { isCorrect, correctAnswer, pointsAwarded, currentScore, isLevelComplete }
  ↓
quizController: res.json({ ... })
  ↓
React: Show correct/incorrect feedback → update UI → load next question or show Level 1 result
```

### 5. Completing Level 1

```
(Triggered automatically when last L1 answer is submitted — see flow #4 step 8)

Session update:
  status: COMPLETED_LEVEL_1
  level1CurrentIndex: 20 (equal to total questions)

API response includes: isLevelComplete: true

React: Navigate to /level/1/result
  ↓
Display: "Level 1 Complete! Score: 85/100"
  ↓
Show "Continue to Level 2" button
```

### 6. Entering Level 2

```
Browser: Click "Continue to Level 2"
  ↓
React: quizService.advanceLevel({ targetLevel: 2 })
  ↓
Axios: POST /api/quiz/advance-level
  ↓
quizService:
  1. Fetch session (status must be COMPLETED_LEVEL_1)
  2. Validate transition: COMPLETED_LEVEL_1 → ACTIVE_LEVEL_2
  3. Update session: status = ACTIVE_LEVEL_2, level2CurrentIndex = 0
  ↓
React: Navigate to /level/2 → display first step with ❤️❤️❤️
```

### 7. Losing a Life

```
Browser: Submit wrong answer in Level 2
  ↓
quizService:
  1. Compare answer → incorrect
  2. session.lives-- (atomic $inc: { lives: -1 })
  3. Create Answer document (isCorrect: false, pointsAwarded: 0)
  4. Advance to next step: level2CurrentIndex++
  5. Check: lives > 0? → continue
  ↓
Response: { isCorrect: false, lives: 2, isEliminated: false }
  ↓
React: Show ❤️❤️🖤 → load next step
```

### 8. Participant Elimination

```
Browser: Submit wrong answer → lives reach 0
  ↓
quizService:
  1. Compare answer → incorrect
  2. session.lives = 0
  3. Transition: ACTIVE_LEVEL_2 → ELIMINATED
  4. Set session.endTime = new Date()
  5. Calculate session.timeTakenMs = endTime - startTime
  ↓
Response: { isCorrect: false, lives: 0, isEliminated: true }
  ↓
React: Navigate to /result → show "Eliminated" result page
```

### 9. Entering Level 3

```
(Same pattern as entering Level 2)

Session: COMPLETED_LEVEL_2 → ACTIVE_LEVEL_3
level3CurrentIndex = 0
```

### 10. Submitting Output Answer (Level 3)

```
Browser: Type "0 1 2" → click Submit
  ↓
Axios: POST /api/quiz/submit-answer { questionId, answer: "0 1 2" }
  ↓
quizService:
  1. Fetch question.correctAnswer
  2. Normalize both: trim(), replace(\r\n), collapse trailing newlines
  3. Compare normalized strings
  4. Create Answer document
  5. Update session scores
  ↓
Response: { isCorrect: true/false, correctAnswer: "0 1 2", pointsAwarded: 10 }
```

### 11. Completing Competition

```
(Last Level 3 answer submitted)

quizService:
  1. session.status → COMPLETED
  2. session.endTime = new Date()
  3. session.timeTakenMs = endTime - startTime
  4. session.totalScore = level1Score + level2Score + level3Score
  ↓
Response: { isLevelComplete: true, isCompetitionComplete: true }
  ↓
React: Navigate to /result
```

### 12. Generating Final Result

```
Browser: FinalResultPage mounts
  ↓
React: resultService.getMyResult()
  ↓
Axios: GET /api/results/me
  ↓
resultService (backend):
  1. Fetch session (status: COMPLETED or ELIMINATED)
  2. Calculate rank (count sessions with higher score or same score + less time)
  ↓
Response: {
  totalScore: 170,
  level1Score: 85,
  level2Score: 30,
  level3Score: 55,
  timeTakenMs: 4230000,
  status: "COMPLETED",
  rank: 3
}
  ↓
React: Display result card with score breakdown + formatted time + rank
```

### 13. Admin Viewing Results

```
Browser: Admin navigates to Participants page
  ↓
React: adminService.getParticipants({ page: 1, sortBy: 'totalScore', order: 'desc' })
  ↓
Axios: GET /api/admin/participants?page=1&sortBy=totalScore&order=desc (Admin JWT)
  ↓
adminController: call adminService.getParticipants(query)
  ↓
adminService:
  1. Build MongoDB query from filters
  2. QuizSession.find(query)
       .populate('participant', 'fullName collegeName department participantId')
       .sort({ totalScore: -1, timeTakenMs: 1 })
       .skip(offset)
       .limit(20)
  3. Count total matching documents
  ↓
Response: { participants: [...], pagination: { total: 142, page: 1, pages: 8 } }
  ↓
React: Render data table with search, filter, sort controls
```

---

## 25. Testing Strategy

### Testing Pyramid

| Level | Tool | What to Test | Priority |
|---|---|---|---|
| **Unit Tests** | Jest | Services (business logic, state machine, scoring) | **High** |
| **Integration Tests** | Jest + Supertest | API endpoints (full request → DB → response) | **High** |
| **Load Tests** | Artillery / k6 | 140 concurrent users submitting answers | **Medium** |
| **Manual E2E** | Browser | Full participant flow, admin flow | **High** |
| **Automated E2E** | Cypress (optional) | Critical paths (registration → completion) | **Low** (time-constrained) |

### Critical Test Scenarios

#### Unit Tests (Services)

1. **State machine transitions**: Verify all valid transitions succeed and all invalid transitions throw errors.
2. **Scoring**: Verify correct/incorrect answers award correct points.
3. **Lives**: Verify life decrement and elimination at 0.
4. **Answer normalization**: Verify Level 3 string comparison handles whitespace, newlines, etc.
5. **Duplicate prevention**: Verify submitting same answer twice is rejected.
6. **Question selection**: Verify random selection returns correct count and no duplicates.

#### Integration Tests (API)

1. Full participant flow: register → start → answer all L1 → advance → answer all L2 → advance → answer all L3 → complete.
2. Elimination flow: register → start → answer L1 → advance → lose all lives in L2 → verify eliminated.
3. Session recovery: start session → call GET /api/session/current → verify full state returned.
4. Invalid transitions: try to call advance-level when not in completed state → verify 403.
5. Duplicate submission: submit same answer twice → verify 409 on second.

#### Load Tests

Simulate 140 users:
1. All register within 5 minutes
2. All submit Level 1 answers with random delays (2–10 seconds between answers)
3. Verify no 500 errors, no data corruption
4. Measure p95 response time

### Testing Before Event Day

> [!CAUTION]
> **Run load tests against a staging deployment (Render + MongoDB Atlas) at least 2 days before the event.** This is the only way to verify the system handles 140 concurrent users on the actual infrastructure.

---

## 26. Development Phases

### Phase 1: Foundation (Days 1–2)

**Goal:** Project scaffolding, database setup, basic auth.

| Task | Details |
|---|---|
| Initialize frontend (Vite + React + Tailwind) | `npm create vite@latest client -- --template react` |
| Initialize backend (Express) | `npm init` + install dependencies |
| Set up folder structure | As defined in §23 |
| MongoDB Atlas cluster setup | Create M0 cluster, get connection string |
| Environment variables | `.env` files for client and server |
| Mongoose connection | `config/db.js` with connection pooling |
| Participant model + registration API | Model + `/api/auth/register` + `/api/auth/login` |
| JWT authentication middleware | Token generation + verification middleware |
| Admin model + seed script | `scripts/seedAdmin.js` |
| Admin login API | `/api/auth/admin/login` |
| Health check endpoint | `GET /api/health` |
| Global error handler | `middleware/errorHandler.js` |
| CORS + Helmet + Rate Limiting | Security middleware setup |

**Verification:** Register a participant via Postman, receive JWT, access protected route.

---

### Phase 2: Question System (Days 2–3)

**Goal:** Question bank and configuration.

| Task | Details |
|---|---|
| Question model | Schema with all fields, conditional validation |
| CompetitionConfig model | Singleton config document |
| Seed scripts | `seedQuestions.js` — import 100 MCQs + L2 + L3 questions |
| Seed config | `seedConfig.js` — initialize default config |
| Admin question CRUD APIs | Add, edit, toggle, list with filtering |
| Admin config APIs | Get/update config |
| Question data file | `server/data/questions.json` — prepare question bank |

**Verification:** Seed questions, list them via admin API, toggle active/inactive.

---

### Phase 3: Competition Core (Days 3–5)

**Goal:** Session management, state machine, Level 1.

| Task | Details |
|---|---|
| QuizSession model | Full schema with indexes |
| Answer model | Schema with unique compound index |
| Session start API | Create session, select random questions |
| State machine enforcement | `utils/constants.js` + service-level validation |
| Level 1: Get question API | Serve current question without answer |
| Level 1: Submit answer API | Validate, score, advance index |
| Level 1: Complete detection | Auto-transition to COMPLETED_LEVEL_1 |
| Session recovery API | `GET /api/session/current` |
| Advance level API | Validate transition, update status |

**Verification:** Complete full Level 1 flow via Postman. Verify state transitions. Verify duplicate rejection.

---

### Phase 4: Levels 2 & 3 (Days 5–6)

**Goal:** Exit Room and Guess the Output.

| Task | Details |
|---|---|
| Level 2: Lives mechanic | Decrement on wrong answer, check for elimination |
| Level 2: Elimination flow | Set endTime, calculate timeTakenMs, transition to ELIMINATED |
| Level 2: Completion flow | Transition to COMPLETED_LEVEL_2 |
| Level 3: Code snippet questions | Serve codeSnippet + language |
| Level 3: Answer comparison | Normalize + compare |
| Level 3: Completion flow | Calculate total score, set endTime, transition to COMPLETED |
| Timer calculation | `timeTakenMs = endTime - startTime` |

**Verification:** Full flow from start to completion and start to elimination via Postman.

---

### Phase 5: Results & Admin Backend (Days 6–7)

**Goal:** Results API, leaderboard, admin queries.

| Task | Details |
|---|---|
| My result API | `GET /api/results/me` — score breakdown + rank |
| Leaderboard API | `GET /api/results/leaderboard` — sorted, paginated |
| Admin participants API | List with search, filter, sort, pagination |
| Admin participant detail API | Session + answers detail |
| Admin stats API | Aggregate counts |
| Competition controls | Start/pause/end APIs |

**Verification:** Complete multiple sessions, verify leaderboard ranking. Verify admin queries.

---

### Phase 6: Frontend — Auth & Layout (Days 7–8)

**Goal:** React app scaffolding, auth flow, routing.

| Task | Details |
|---|---|
| Vite + React setup | Install dependencies, configure Tailwind |
| Router setup | All routes with lazy loading |
| AuthContext | Token management, login/logout |
| ProtectedRoute component | JWT check + redirect |
| Axios instance | Base URL, token interceptor, error interceptor |
| Landing/Registration page | Form + validation + API call |
| Instructions page | Competition rules display |
| Layouts | PublicLayout, CompetitionLayout, AdminLayout |

**Verification:** Register, login, see protected routes.

---

### Phase 7: Frontend — Competition (Days 8–10)

**Goal:** All three levels in React.

| Task | Details |
|---|---|
| CompetitionContext | Session state from server |
| useSession hook | Fetch + restore session |
| useTimer hook | Calculate elapsed from `startTime` |
| Timer component | Persistent across levels |
| Level 1 page | Question display, option selection, submit, feedback |
| Level 1 Result page | Score display + continue button |
| Level 2 page | Step display, lives indicator, elimination handling |
| Level 3 page | Code snippet + text input |
| Final Result page | Score breakdown + time + status |
| Session recovery | On page load, route to correct level |

**Verification:** Complete full competition flow in browser. Refresh at each level — verify recovery.

---

### Phase 8: Frontend — Admin (Days 10–11)

**Goal:** Admin dashboard in React.

| Task | Details |
|---|---|
| Admin login page | Separate auth flow |
| Dashboard page | Stats cards + active sessions |
| Participants page | Data table + search + filters |
| Questions page | CRUD form + table |
| Settings page | Config form + competition controls |
| Leaderboard page | Sorted table with periodic refresh |

**Verification:** Full admin workflow: login, view participants, manage questions, configure settings.

---

### Phase 9: Testing & Hardening (Days 11–12)

**Goal:** Test, fix, secure.

| Task | Details |
|---|---|
| Unit tests for services | State machine, scoring, normalization |
| Integration tests for APIs | Happy paths + edge cases |
| Load test | 140 simulated users with Artillery/k6 |
| Security audit | Check all endpoints for auth, validation, no answer leaks |
| Edge case testing | Double-submit, refresh, invalid transitions |
| Error handling polish | User-friendly messages, retry logic |
| UI polish | Responsive design, loading states, animations |

---

### Phase 10: Deployment (Days 12–13)

**Goal:** Production deployment.

| Task | Details |
|---|---|
| Render deployment | Push backend, set env vars |
| Vercel deployment | Push frontend, set env vars, configure rewrites |
| MongoDB Atlas production | Verify cluster, check indexes, whitelist Render IPs |
| Seed production data | Run seed scripts against production DB |
| CORS verification | Verify frontend → backend communication |
| End-to-end production test | Full flow on production URLs |
| UptimeRobot setup | Health check pinging every 14 min |
| Dry run | Simulate event with 10–20 test participants |

---

### Phase 11: Event Day Prep (Day 14)

| Task | Details |
|---|---|
| Fresh seed data | Reset question bank if needed |
| Admin accounts ready | Verify admin login |
| Competition status: `not_started` | Set via admin panel |
| Brief team | Ensure someone can access admin dashboard |
| Backup plan | Document manual scoring procedure in case of system failure |
| Monitor | Keep Render logs and MongoDB Atlas metrics open during event |

---

## Open Questions

> [!IMPORTANT]
> **These questions should be resolved before starting implementation:**

1. **Level 2 wrong answer behavior**: Should the participant retry the same step or advance to the next step on a wrong answer? (Architecture assumes: advance to next step.)

2. **Leaderboard visibility**: Should the leaderboard be publicly accessible during the competition, or admin-only until the competition ends?

3. **Participant re-registration**: If a participant's browser loses their JWT token and they register again with the same `participantId`, should the system re-issue a token and resume their session, or block the duplicate registration?

4. **Competition-wide time limit**: Is there a maximum overall competition duration (e.g., 2 hours) after which all active sessions are auto-completed? Or is the timer purely per-participant with no global cap?

5. **Level 2 question type**: Are Exit Room questions MCQ-style (select from options), code-based (like Level 3), or a mix? This affects the question schema and UI.

6. **Admin can reset a participant's session?**: Should there be an admin endpoint to reset/delete a participant's session (in case of legitimate technical issues)?

---

## User Review Required

> [!WARNING]
> **Key architectural decisions that need your confirmation before implementation:**
>
> - **Context API over Redux Toolkit** — simpler, lighter, sufficient for this state shape. Confirm you agree.
> - **REST API (no WebSocket)** — timer is timestamp-based, leaderboard is polled. Confirm this is acceptable.
> - **No password for participants** — they authenticate with `participantId` only. Confirm this fits your event's security model.
> - **Separate `answers` collection** — not embedded in session documents. This adds a second DB write per answer submission but enables duplicate prevention via unique index. Confirm this trade-off is acceptable.
> - **Advance to next step on wrong L2 answer** — instead of retrying the same step. Confirm desired behavior.

## Verification Plan

### Automated Tests
After implementation:
```bash
cd server && npm test          # Unit + integration tests
npx artillery run load-test.yml  # Load test with 140 simulated users
```

### Manual Verification
1. Complete full competition flow (register → L1 → L2 → L3 → result) in browser
2. Refresh at each level transition — verify session recovery
3. Open DevTools and attempt to manipulate score/timer/level — verify server rejects
4. Run two tabs with same participant — verify no duplicate sessions
5. Complete elimination flow — verify timer stops and result displays
6. Admin: manage questions, view participants, control competition status
7. Leaderboard: verify correct ranking with tie-breaking
