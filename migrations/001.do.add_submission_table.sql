DROP TABLE IF EXISTS submission;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE submission (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_text TEXT,
  karma_total INTEGER DEFAULT 0,
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  create_timestamp TIMESTAMP DEFAULT NOW(),
  user_id uuid
);