# Gym Pro Portal

Full-stack gym management website for `OLD SCHOOL FITNESS GYM` with a public landing page, member dashboard, and admin dashboard.

## Current Features

- Shared login and registration flow for gym members and admins
- Role-based routing to `client` and `admin` dashboards
- Public landing page with:
  - featured gym photo carousel
  - gym reels section
  - training showcase
  - supplement section with carousel
  - gym details, location, and privacy messaging
  - client feedback summary and feedback modal
  - admin-controlled scrolling timeline update banner
- Client profile editing with image upload
- Membership start date, plan, and renewal visibility
- Day-wise exercise scheduling for members
- Client feedback submission from dashboard
- Admin client management with alerts for plan expiry
- Password change and password reset flow

## Tech Stack

- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

## Project Structure

- `frontend/` React application
- `frontend/src/pages/LandingPage.jsx` public landing page
- `frontend/src/pages/ClientDashboard.jsx` member dashboard
- `frontend/src/pages/AdminDashboard.jsx` admin dashboard
- `backend/` Express API and PostgreSQL setup

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

## Landing Page Overview

The landing page now includes these main sections:

- sticky navigation with section links
- client rating summary banner
- scrolling timeline update banner
- featured gym photos
- hero section
- gym reels and gallery
- training showcase with detailed personal training content
- supplement section with carousel
- about, privacy, and footer navigation

## Notes

- Supplement images are stored in `frontend/src/assets/supplements/`
- Gym featured photos are stored in `frontend/src/assets/gym-gallery/`
- Client feedback shown on the landing page is submitted by members from the client dashboard
- Timeline banner content is managed from the admin dashboard

## GDPR Note

This project includes privacy consent, secure cookies, minimal personal-data fields, and account-management flows, but legal review is still required before claiming full GDPR compliance in production.
