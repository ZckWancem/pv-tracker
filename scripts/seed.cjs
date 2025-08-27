require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { sql } = require('@vercel/postgres');

async function main() {
  console.log('Seeding database...');

  // Create a sample profile
  const { rows: profiles } = await sql`
    INSERT INTO profiles (name, description, created_at, updated_at)
    VALUES ('Sample Profile', 'This is a sample profile for testing.', NOW(), NOW())
    RETURNING id;
  `;
  const profileId = profiles[0].id;
  console.log(`Created profile with ID: ${profileId}`);

  // Create sample panels
  const panels = [
    { section: 'A', row: 1, col: 1, serial: 'PNL-A11-001' },
    { section: 'A', row: 1, col: 2, serial: 'PNL-A12-002' },
    { section: 'A', row: 2, col: 1, serial: 'PNL-A21-003' },
    { section: 'B', row: 1, col: 1, serial: 'PNL-B11-004', scanned: true },
    { section: 'B', row: 1, col: 2, serial: 'PNL-B12-005' },
  ];

  for (const panel of panels) {
    await sql`
      INSERT INTO panels (profile_id, section, row_number, column_number, serial_code, pallet_no, scanned_at)
      VALUES (
        ${profileId},
        ${panel.section},
        ${panel.row},
        ${panel.col},
        ${panel.serial},
        'PALLET-01',
        ${panel.scanned ? 'NOW()' : null}
      );
    `;
  }

  console.log('Finished seeding database.');
}

main().catch((err) => {
  console.error('An error occurred while seeding the database:', err);
});