-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create panels table
CREATE TABLE IF NOT EXISTS panels (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  pallet_no VARCHAR(100) NOT NULL,
  serial_code VARCHAR(255) NOT NULL UNIQUE,
  section VARCHAR(100),
  row_number INTEGER,
  column_number INTEGER,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_panels_profile_id ON panels(profile_id);
CREATE INDEX IF NOT EXISTS idx_panels_serial_code ON panels(serial_code);
CREATE INDEX IF NOT EXISTS idx_panels_location ON panels(profile_id, section, row_number, column_number);

-- Insert default profile
INSERT INTO profiles (name, description) 
VALUES ('Default Project', 'Default solar panel installation project')
ON CONFLICT DO NOTHING;
