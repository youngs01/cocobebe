import 'dotenv/config';
import { ensureDatabaseSchema } from '../lib/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  await ensureDatabaseSchema();
  console.log('Database initialized successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
