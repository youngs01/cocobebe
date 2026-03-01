-- Drop tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS teachers;

-- Create teachers
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  join_date TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  password TEXT DEFAULT '1234',
  class_name TEXT,
  leave_adjustment INTEGER DEFAULT 0
);

-- Create leave_requests
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  processed_by TEXT,
  processed_at TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Create notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Seed admin (adjust name/password as needed)
INSERT INTO teachers (name, join_date, role, password) VALUES ('admin', '2020-01-01', 'admin', 'admin1234');
