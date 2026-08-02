const run = async () => {
  const res = await fetch("https://lismrowveczddsinhexw.supabase.co/rest/v1/", {
    headers: {
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34"
    }
  });
  const data = await res.json();
  const def = data.definitions.agent_votes;
  console.log("agent_votes schema:", def ? def.properties : "Not found");
};
run();
