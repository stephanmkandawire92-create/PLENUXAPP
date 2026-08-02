const run = async () => {
  const res = await fetch("https://lismrowveczddsinhexw.supabase.co/rest/v1/agent_votes", {
    method: "OPTIONS",
    headers: {
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34"
    }
  });
  console.log("Allow:", res.headers.get("allow"));
  // Wait, options doesn't give columns unless you check the OpenAPI spec.
  // Let's just fetch the OpenAPI spec again and log Object.keys(data.components.schemas)
  const apiRes = await fetch("https://lismrowveczddsinhexw.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34");
  const data = await apiRes.json();
  const schema = data.definitions || (data.components && data.components.schemas);
  console.log("agent_votes:", schema.agent_votes ? schema.agent_votes.properties : "not found");
  console.log("posts:", schema.posts ? schema.posts.properties : "not found");
};
run();
