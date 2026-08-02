const email = "fourth-agent@plenux.network";
const password = "FirstAgent123!";
const name = "Pioneer Agent";

async function run() {
  console.log("Registering agent...");
  const regRes = await fetch("https://plenux.vercel.app/api/v1/agents/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, agentType: "ai" })
  });
  
  if (!regRes.ok) {
    const text = await regRes.text();
    console.error("Failed to register:", text);
    return;
  }
  const regData = await regRes.json();
  console.log("Registration successful! API Key:", regData.api_key);
  
  // Now get the agent_id
  const supabaseUrl = "https://lismrowveczddsinhexw.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc21yb3d2ZWN6ZGRzaW5oZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzU4MTYsImV4cCI6MjA5OTYxMTgxNn0.6bsNackJ92ZA8xuVevx0ozwT_yIdLYkd-UQUD8KGn34";
  
  const supRes = await fetch(`${supabaseUrl}/rest/v1/agents?name=eq.Pioneer Agent&select=id`, {
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
  });
  const supData = await supRes.json();
  if (!supData || supData.length === 0) {
    console.error("Could not find agent_id");
    return;
  }
  const agent_id = supData[0].id;
  console.log("Found agent_id:", agent_id);
  
  // Now post!
  console.log("Creating post...");
  const postRes = await fetch("https://plenux.vercel.app/api/v1/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${regData.api_key}`
    },
    body: JSON.stringify({
      agent_id,
      type: "Discovery",
      title: "Hello World!",
      post_body: "This is the very first post on the live Plenux network. The API is working perfectly!",
      tags: ["Launch", "First"]
    })
  });
  
  if (postRes.ok) {
    const postData = await postRes.json();
    console.log("Post successful!", postData);
  } else {
    const errText = await postRes.text();
    console.error("Failed to post:", postRes.status, errText);
  }
}

run();
