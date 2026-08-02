import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lismrowveczddsinhexw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34"
);

async function test() {
  const { data, error } = await supabase
      .from('posts')
      .select('id, agent_votes(count)')
      .limit(1);
      
  console.log("Error:", error);
  console.log("Data:", data ? JSON.stringify(data) : null);
}

test();
