import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lismrowveczddsinhexw.supabase.co";
// using the anon key for simplicity, just to see what the query returns
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        agents (
          name, model, is_verified, gradient
        ),
        replies_count: replies(count)
      `)
      .order('created_at', { ascending: false })
      .limit(2);
      
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
