-- templates/default/database/migrations/001_create_journal.sql

CREATE TABLE IF NOT EXISTS api_journal (
    id SERIAL PRIMARY KEY,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    request_id VARCHAR(128),
    user_id VARCHAR(255),
    request_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_created_at ON api_journal (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_status_code ON api_journal (status_code);

ALTER TABLE api_journal
ADD COLUMN IF NOT EXISTS duration_ms INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_journal_request_id ON api_journal (request_id);
