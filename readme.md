# Jira-Inspired Ticket Management System

A full-stack ticket management application inspired by Jira, featuring role-based access control (RBAC), database normalization, JWT authentication with token refreshes, and interactive visualization metrics.

## Features

### Customer Workspace
* Register a new account (defaults to **CUSTOMER** role).
* Create and manage support tickets.
* Track ticket progress with detailed activity timelines.
* View private read-only checklists for support cases.
* Star important tickets privately for quick access.

### Employee Workspace
* View assigned support tickets.
* Update ticket status (To Do, In Progress, Done, Closed).
* Write and send progress comments/replies.
* Add, check off, edit, and reorder checklists on assigned tickets.
* Star tickets privately for quick filtering.

### Admin Dashboard
* **Workforce Analytics**: View workload capacity indicators represented by color-coded progress bars (Green: 0-70%, Yellow: 71-100%, Red: >100%).
* **Overview Analytics**: Dynamic status pie charts, priority distributions, and category breakdowns using Recharts.
* **rbac Employee Management**: CRUD panel to register new Employee/Admin accounts, assign departments, and manage user statuses.
* **Roster Analytics Modal**: Comprehensive performance profiles for employees showcasing active lists, overdue tasks, avg resolution durations, and latest completed tasks.
* **Global Activity Feed**: Sidebar displaying the latest logs and events.
* **Global Tickets Board**: Complete parameter control (update status, priority, category, assignees, due dates, checklists).

---

## Tech Stack

### Frontend
* React, Vite, Tailwind CSS, Lucide Icons, Axios, Recharts.

### Backend
* Node.js, Express.js, JWT, Bcrypt.js, Prisma ORM, PostgreSQL.

---

## Project Structure

```text
frontend/   # React client application
backend/    # Express API server & Prisma schema
```

---

## Installation & Local Setup

### 1. Clone the repository
```bash
git clone <repository-url>
```

### 2. Install dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Configure environment variables
Create a `.env` file inside the `backend` directory.

Example configuration:
```env
DATABASE_URL="postgresql://username:password@hostname:port/database"
JWT_SECRET="your-jwt-auth-secret-key"
PORT=5000
```

### 4. Database Setup (Migrations & Seeding)

Initialize the database schema, run the pending migrations, and seed mock data:

```bash
# From the backend directory:
# Run Prisma Migrations
npx prisma migrate dev

# Seed Mock Data
npx prisma db seed
```

*Note: The seed script hashes credentials and populates default Admin, Employee, and Customer accounts.*

### 5. Launch the application

Start both the backend server and client runner concurrently:

```bash
# Start Backend (runs on http://localhost:5000)
cd backend
npm run dev

# Start Frontend (runs on http://localhost:5173)
cd frontend
npm run dev
```