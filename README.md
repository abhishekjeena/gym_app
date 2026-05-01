<<<<<<< HEAD
# Gym Pro Portal

Full-stack gym management website with:

- Shared login for `admin` and `client`
- Role-based dashboards
- Client profile editing with image upload
- Admin client management
- Password change and two-step password reset flow
- Day-wise exercise scheduling
- GDPR-oriented consent and privacy messaging

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

## Project Structure

- `frontend/` React application
- `backend/` Express API and PostgreSQL schema

## Setup

### 1. Backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gym_portal
JWT_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
COOKIE_SECRET=change_this_cookie_secret
```

Install and run:

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Default Seed Users

- Admin: `admin@gympro.com` / `Admin@123`
- Client: `client@gympro.com` / `Client@123`

## GDPR Note

This project includes privacy consent, secure cookies, minimal personal-data fields, and account-management flows, but legal review is still required before claiming full GDPR compliance in production.

=======
# gym_app
Old_school_fitness
>>>>>>> 49c1210c3dd13c2e5933bd8bd2ec54567470c513
