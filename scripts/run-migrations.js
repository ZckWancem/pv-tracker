import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Load .env from root

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  try {
    const scriptsDir = __dirname;
    const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sqlScript = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
      const statements = sqlScript.split(';').filter(s => s.trim());
      for (const statement of statements) {
        await sql(statement);
      }
      console.log(`Finished migration: ${file}`);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

runMigrations();