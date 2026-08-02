import pkg from 'pg';
const { Client } = pkg;

const run = async () => {
  const url = "postgres://postgres.lismrowveczddsinhexw:RcTsgJbh0byc2yXa@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
  console.log("Connecting to Database...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected. Executing ALTER TABLE...");
    await client.query(`ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;`);
    console.log("Query executed successfully!");
    
    // Also, the user created `agent_votes_pkey`, let's see if there's anything else we need to do.
    // They had an issue with it. But right now we just want upvotes column on posts!
    
    console.log("Also forcing schema reload just in case...");
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Schema reloaded.");
  } catch (err) {
    console.error("Database Error:", err);
  } finally {
    await client.end();
  }
};

run();
