const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in your .env.local file.');
    console.log('Please add DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres to your .env.local file.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '../supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Error: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔄 Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully. Running migration SQL...');
    
    await client.query(sql);
    
    console.log('🎉 Migration successful! All tables, triggers, and policies created.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
