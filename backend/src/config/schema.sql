CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(30),
  gender VARCHAR(20),
  age INTEGER,
  membership_plan VARCHAR(60) DEFAULT 'Monthly',
  join_date DATE,
  emergency_contact VARCHAR(120),
  address TEXT,
  profile_image_url TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_consent_at TIMESTAMP,
  refresh_token TEXT,
  reset_verification_token TEXT,
  reset_code_hash TEXT,
  reset_code_expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(15) NOT NULL,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(80),
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES exercise_schedules(id) ON DELETE CASCADE,
  exercise_name VARCHAR(150) NOT NULL,
  sets INTEGER,
  reps VARCHAR(40),
  weight VARCHAR(40),
  rest_seconds INTEGER,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_timeline_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE exercise_schedules
  ADD COLUMN IF NOT EXISTS category VARCHAR(80),
  ADD COLUMN IF NOT EXISTS start_time VARCHAR(10),
  ADD COLUMN IF NOT EXISTS end_time VARCHAR(10),
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE exercise_schedule_items
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS join_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE client_documents
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

