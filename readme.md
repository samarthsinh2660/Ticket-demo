# Jira-Inspired Ticket Management System

A full-stack ticket management application inspired by Jira, role-based access control, and modern web development practices.

## Features

### Customer

* Register and Login
* Create and manage support tickets
* Track ticket progress
* View activity timeline
* Search and filter personal tickets

### Employee

* View assigned tickets
* Update ticket status
* Add comments
* Monitor assigned workload

### Admin

* Dashboard analytics
* Employee Management (CRUD)
* Assign tickets
* Update priorities and due dates
* Workforce analytics
* Search and filtering

## Ticket Features

* Categories
* Priorities
* Status workflow
* Due dates
* Activity timeline
* Dashboard charts
* Search and filters
* Dark/Light mode

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* Prisma ORM
* Neon

### Authentication

* JWT Authentication
* Role-Based Authorization

## Project Structure

```text
client/
server/
```

The backend follows a layered architecture:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Database
```

## Installation

### Clone the repository

```bash
git clone <repository-url>
```

### Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### Configure environment variables

Create a `.env` file in the server directory.

Example:

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_secret
PORT=5000
```

### Run the backend

```bash
npm run dev
```

### Run the frontend

```bash
npm run dev
```