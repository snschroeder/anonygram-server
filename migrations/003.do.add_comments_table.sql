CREATE TABLE comments (
    comment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_text TEXT NOT NULL,
    comment_timestamp TIMESTAMP DEFAULT now(),
    submission_id INTEGER REFERENCES submission(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);