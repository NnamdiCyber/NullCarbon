import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

async function migrate() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      'postgres://nullcarbon:nullcarbon@localhost:5432/nullcarbon',
  });

  await client.connect();
  console.log('Connected to PostgreSQL');

  const sql = readFileSync(
    join(__dirname, 'migrations/001_initial_schema.sql'),
    'utf-8',
  );

  await client.query(sql);
  console.log('Migration complete');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
