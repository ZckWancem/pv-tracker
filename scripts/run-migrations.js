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
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    const scriptsDir = __dirname;
    const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql')).sort();

    const ranMigrations = await sql`SELECT name FROM migrations`;
    const ranMigrationNames = new Set(ranMigrations.map(m => m.name));

    for (const file of files) {
      if (ranMigrationNames.has(file)) {
        console.log(`Skipping already run migration: ${file}`);
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      const sqlScript = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
      
      try {
        const statements = sqlScript.split(';').filter(s => s.trim());
        for (const statement of statements) {
          await sql(statement);
        }
        await sql`INSERT INTO migrations (name) VALUES (${file})`;
        console.log(`Finished migration: ${file}`);
      } catch (error) {
        console.error(`Failed to run migration ${file}:`, error);
        // If a migration fails, we should not proceed
        const ranMigrations = await sql`SELECT name FROM migrations`;
        const ranMigrationNames = new Set(ranMigrations.map(m => m.name));
        if (!ranMigrationNames.has(file)) {
          // If the migration failed before it was recorded, we should not record it
          // and we should exit
          process.exit(1);
        }
      }
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();