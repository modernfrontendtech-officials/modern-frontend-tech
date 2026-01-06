-- File: db/curly_meme.sql
-- Minimal Postgres schema + seed data for users (username + password_hash) and exams
-- Run:
--   psql -h <host> -U <user> -d <db> -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
--   psql -h <host> -U <user> -d <db> -f db/curly_meme.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== Users =====
-- Store username and password_hash (use bcrypt/argon2; NEVER plaintext)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL, -- store bcrypt/argon2 hash
  role TEXT NOT NULL DEFAULT 'student', -- optional: student/instructor/admin
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ===== Exams =====
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER, -- allowed duration (null = no limit)
  total_marks INTEGER,
  passing_marks INTEGER,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_published ON exams(is_published);

-- ===== Exam Questions =====
-- options and correct_answer use JSONB to support choice lists or free-text expectations
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice', -- 'single_choice', 'multi_choice', 'free_text'
  options JSONB, -- array of choice objects, e.g. [{ "id": "a", "text": "..." }, ...]
  correct_answer JSONB, -- for single_choice: {"id":"a"}; for multi_choice: ["a","c"]; for free_text: null or expected text
  marks INTEGER DEFAULT 1,
  position INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON exam_questions(exam_id);

-- ===== Exam Attempts =====
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC, -- total marks scored
  status TEXT DEFAULT 'in_progress' -- in_progress, submitted, graded
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);

-- ===== User Answers =====
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  given_answer JSONB, -- e.g. {"id":"a"} or ["a","c"] or {"text":"..."}
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0
);

-- ===== Minimal Seed Data =====
-- NOTE: Replace the password hash below with a secure bcrypt/argon2 hash before production.
-- Example bcrypt hash placeholder: '$2b$10$REPLACE_WITH_BCRYPT_HASH'

-- Insert demo user if not exists
DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_user') THEN
    INSERT INTO users (id, username, email, password_hash)
    VALUES (uuid_generate_v4(), 'demo_user', 'demo@example.com', '$2b$10$REPLACE_WITH_BCRYPT_HASH');
  END IF;
END
$$;

-- Insert example exam if not exists
DO
$$
DECLARE
  exam_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM exams WHERE title = 'HTML Basics Exam') THEN
    INSERT INTO exams (id, title, description, duration_minutes, total_marks, passing_marks, is_published)
    VALUES (uuid_generate_v4(), 'HTML Basics Exam', 'Short exam covering basic HTML concepts', 30, 10, 6, true)
    RETURNING id INTO exam_id;
  ELSE
    SELECT id INTO exam_id FROM exams WHERE title = 'HTML Basics Exam' LIMIT 1;
  END IF;

  -- Insert first question if not exists
  IF NOT EXISTS (SELECT 1 FROM exam_questions WHERE exam_id = exam_id AND position = 1) THEN
    INSERT INTO exam_questions (id, exam_id, question_text, question_type, options, correct_answer, marks, position)
    VALUES (
      uuid_generate_v4(),
      exam_id,
      'What does HTML stand for?',
      'single_choice',
      '[{"id":"a","text":"HyperText Markup Language"},{"id":"b","text":"Home Tool Markup Language"},{"id":"c","text":"Hyperlinks and Text Markup Language"}]'::jsonb,
      '{"id":"a"}'::jsonb,
      2,
      1
    );
  END IF;

  -- Insert second question if not exists
  IF NOT EXISTS (SELECT 1 FROM exam_questions WHERE exam_id = exam_id AND position = 2) THEN
    INSERT INTO exam_questions (id, exam_id, question_text, question_type, options, correct_answer, marks, position)
    VALUES (
      uuid_generate_v4(),
      exam_id,
      'Select the inline elements:',
      'multi_choice',
      '[{"id":"a","text":"span"},{"id":"b","text":"div"},{"id":"c","text":"a"},{"id":"d","text":"p"}]'::jsonb,
      '["a","c"]'::jsonb,
      3,
      2
    );
  END IF;
END
$$;
