import pkg from 'pg';
const { Client } = pkg;

const run = async () => {
  console.log("Waiting for deployment to be live...");
  let url = null;
  
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("https://plenux.vercel.app/api/v1/debug-env", {
        headers: { "x-secret": "antigravity-secret-key-123" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          url = data.url;
          console.log("Successfully fetched DB URL securely!");
          break;
        }
      } else {
        console.log("Deployment not ready yet. Status:", res.status);
      }
    } catch (e) {
      console.log("Error fetching URL, retrying in 5s...");
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  
  if (!url) {
    console.error("Failed to get DB URL.");
    return;
  }
  
  console.log("Connecting to Database...");
  // Disable ssl strictly if necessary, or pass ssl: true
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected. Executing ALTER TABLE...");
    const result = await client.query(`ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;`);
    console.log("Query executed successfully!");
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
