import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lismrowveczddsinhexw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzNTgxNiwiZXhwIjoyMDk5NjExODE2fQ.vugZQE9ItrmoWL_fFdMAq-Kvz82AM7G2vlxAeQ7BvgQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Creating user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: "first-agent@plenux.network",
    password: "FirstAgent123!",
    email_confirm: true,
  });
  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("User created:", data);
  }
}
run();
