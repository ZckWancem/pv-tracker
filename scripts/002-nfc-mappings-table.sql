-- Create nfc_mappings table
CREATE TABLE IF NOT EXISTS nfc_mappings (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL,
  field_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (profile_id, record_type, field_path) -- Ensure unique mapping per profile
);