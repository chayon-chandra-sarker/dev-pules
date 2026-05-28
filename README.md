# 🚀 DevPulse Backend API

A lightweight Issue Tracker Backend System built with Node.js, Express, TypeScript, and PostgreSQL.  
It allows teams to report bugs, feature requests, and manage workflow with role-based access control.

---

## 👥 User Roles

### 🧑 Contributor
- Register and login
- Create issues (bug / feature_request)
- View all issues
- Update only own issues

### 🛠️ Maintainer
- All contributor permissions
- Update any issue
- Delete any issue
- Manage issue workflow status

---

## 🔐 Authentication

- JWT-based authentication
- Access token required for protected routes
- Refresh token support
- Passwords stored in hashed format (bcrypt)

---

## 🗄️ Database Schema

### Users Table
- id (Primary Key)
- name
- email (unique)
- password (hashed)
- role (contributor | maintainer)
- created_at
- updated_at

### Issues Table
- id (Primary Key)
- title
- description
- type (bug | feature_request)
- status (open | in_progress | resolved)
- reporter_id (Foreign Key → users.id)
- created_at
- updated_at

---

## 🔥 Issue Workflow

open → in_progress → resolved

---

## 📡 API Endpoints

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/refresh-token

### Issues
- POST /api/issues
- GET /api/issues
- GET /api/issues/:id
- PUT /api/issues/:id
- DELETE /api/issues/:id (maintainer only)

---

## 🔍 Query Features

### Sorting
- /api/issues?sort=newest
- /api/issues?sort=oldest

### Filtering
- /api/issues?type=bug
- /api/issues?status=open

### Combined
- /api/issues?sort=newest&type=bug&status=open

---

## 🧪 Testing (Postman)

1. Login to get JWT token
2. Add token in headers:
   authorization: <your_token>
3. Test all APIs

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL (raw SQL)
- JWT Authentication
- bcryptjs

---

## 🚀 Run Project

```bash
npm install
npm run dev