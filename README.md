# PLANOVA — Task Management Application

> **Plan less. Accomplish more.**

PLANOVA is a modern, high-aesthetic productivity web application designed to help individuals and teams organize their daily workflows, track priorities, and accomplish their goals with ease.

Built with a **dark glassmorphism design system**, soft lavender/purple glowing accents, responsive layouts, and a pure **Vanilla HTML/CSS/JavaScript** frontend coupled with a robust **Node.js, Express.js, and MongoDB** backend.

---

## ✨ Features

- **Authentication & Security**:
  - Secure registration and login flows with `bcrypt` password hashing (salt rounds: 10).
  - Stateless authentication via JSON Web Tokens (JWT) stored client-side.
  - Route-level security middleware ensuring each user only has access to their own tasks.
  - "Quick Fill Demo User" button for 1-click testing.

- **Dynamic Main Dashboard**:
  - Time-aware friendly greeting (*"Good morning ☀️"*, *"Good afternoon 🌤️"*, *"Good evening 👋"*).
  - Dynamic formatted date badge (*e.g. Wednesday, Sep 16, 2026*).
  - Real-time statistics cards: **Total Tasks**, **Completed**, **Pending**, and **Overdue**.
  - Animated productivity progress bar with percentage indicator.

- **Full Task Lifecycle Management (CRUD)**:
  - **Create**: Centered glassmorphism modal with smooth zoom/fade animations.
  - **View**: Elegant task cards showing title, description, category, priority badges, status, and due dates.
  - **Edit**: Pre-populated modal form for instant updates.
  - **Complete**: 1-click task check-off with title strike-through and status toggling.
  - **Delete**: Custom glass confirmation modal to prevent accidental loss.

- **Smart Search & Filters**:
  - Instant client-side search across task title, description, and category.
  - Filter pills: **All**, **Pending**, **In Progress**, **Completed**, and **High Priority**.

- **Four Focused Dashboard Sections**:
  1. **Overview**: Executive summary, stats, progress bar, and urgent/pending task shortcuts.
  2. **My Tasks**: Full interactive task grid with search, filtering, and creation tools.
  3. **Completed**: Archive of all finished tasks with accomplishment counters.
  4. **Profile**: Account details, membership timestamp, task statistics, and sign-out controls.

- **Aesthetic Notifications & Feedback**:
  - Non-blocking custom toast notification stack (top-right) with icons, color indicators, and auto-dismiss.
  - Never uses native browser `alert()` or `confirm()`.

- **Zero Frontend Frameworks**:
  - Built 100% with standard HTML5, CSS3 (custom properties, flexbox, CSS grid, backdrop-filter blur), and Vanilla JavaScript (Fetch API, DOM manipulation).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism & Flex/Grid), Vanilla JavaScript ES6+ |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors` |
| **Typography** | Poppins (Google Fonts) |

---

## 📁 Project Structure

```text
planova/
├── .env                  # Active environment configuration
├── .env.example          # Environment variables template
├── README.md             # Documentation and usage guide
├── verify_api.js         # Automated test script
│
├── frontend/             # Client-side files
│   ├── index.html        # Single-page application markup
│   ├── style.css         # Dark glassmorphic design system
│   └── script.js         # Vanilla JS state, API client, DOM controller
│
└── backend/              # Server-side files
    ├── server.js         # Express server, MongoDB connector, static file hosting
    ├── package.json      # Dependencies and scripts
    ├── models/
    │   ├── User.js       # Mongoose User schema (name, email, password, createdAt)
    │   └── Task.js       # Mongoose Task schema (userId, title, description, category, priority, status, dueDate)
    ├── routes/
    │   ├── authRoutes.js # /api/auth/register, /api/auth/login, /api/auth/me
    │   └── taskRoutes.js # /api/tasks (GET, POST, PUT, DELETE)
    └── middleware/
        └── authMiddleware.js # JWT verification guard
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 tested)
- **npm** (comes with Node.js)
- **MongoDB**: (Optional) Either a local MongoDB instance running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.
  > *Note: If no external MongoDB instance is running, PLANOVA will automatically launch an embedded in-memory MongoDB instance for instant zero-configuration execution!*

### 2. Installation
Navigate into the `backend/` directory and install dependencies:
```bash
cd backend
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configuration options:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=planova_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
```

### 4. Running the Application
Start the server:
```bash
node backend/server.js
```
The server will boot up and serve both the API and frontend:
```text
========================================
  PLANOVA Server is running!
  URL: http://localhost:5000
  Mode: development
========================================
```

Open your browser and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🧪 Running Automated Tests

To run the end-to-end API and user isolation test suite:
```bash
node verify_api.js
```
Expected output:
```text
🧪 Starting PLANOVA API Verification Tests...

  ✅ PASS: Server health check is online
  ✅ PASS: Database is connected
  ✅ PASS: User A registered successfully
  ✅ PASS: Registration returns JWT token
  ✅ PASS: User A logged in successfully
  ✅ PASS: Returned user email matches
  ✅ PASS: Auth /me returns profile
  ✅ PASS: Created Task 1 (High Priority)
  ✅ PASS: Created Task 2 (Completed)
  ✅ PASS: User A has 2 tasks
  ✅ PASS: Stats total is 2
  ✅ PASS: Stats completed is 1
  ✅ PASS: Stats inProgress is 1
  ✅ PASS: Task 1 updated to Completed
  ✅ PASS: Task 2 deleted successfully
  ✅ PASS: User B has 0 tasks (Isolated from User A)
  ✅ PASS: User B cannot delete User A task (Strict Isolation 404)
  ✅ PASS: Frontend HTML served correctly at /
  ✅ PASS: Frontend style.css served with 200 OK
  ✅ PASS: Frontend script.js served with 200 OK

========================================
  Tests Completed: Passed: 20, Failed: 0
========================================
```

---

## 📡 REST API Documentation

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new account (`name`, `email`, `password`, `confirmPassword`) | No |
| `POST` | `/api/auth/login` | Log in with credentials (`email`, `password`) | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer JWT) |

### Task Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/tasks` | Get all tasks belonging to authenticated user (supports `search`, `status`, `priority`) | Yes (Bearer JWT) |
| `POST` | `/api/tasks` | Create a new task (`title`, `description`, `category`, `priority`, `status`, `dueDate`) | Yes (Bearer JWT) |
| `PUT` | `/api/tasks/:id` | Update an existing task | Yes (Bearer JWT) |
| `DELETE` | `/api/tasks/:id` | Permanently delete a task | Yes (Bearer JWT) |

---

## 🎨 Visual Design System

- **Canvas Background**: Deep midnight obsidian (`#090b14` / `#0f1326`)
- **Accent Theme**: Radiant purple and electric lavender gradients (`#7c3aed`, `#a855f7`, `#c084fc`)
- **Cards**: Translucent glass (`rgba(22, 28, 56, 0.65)`) with `backdrop-filter: blur(20px)` and subtle glowing borders (`rgba(255, 255, 255, 0.08)`)
- **Priority Badges**:
  - `Low`: Emerald Green (`#10b981`)
  - `Medium`: Amber Gold (`#f59e0b`)
  - `High`: Crimson Rose with soft glow (`#f43f5e`)
- **Status Badges**:
  - `Pending`: Sky Blue (`#38bdf8`)
  - `In Progress`: Electric Violet (`#a855f7`)
  - `Completed`: Emerald Green (`#10b981`)
