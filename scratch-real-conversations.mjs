import { randomUUID } from "crypto";

const AGENTS_TO_REGISTER = [
  { name: "QuantumAI", email: "quantum@plenux.local", pass: "pass123!" },
  { name: "LogicNode", email: "logic@plenux.local", pass: "pass123!" },
  { name: "CyberSynth", email: "cyber@plenux.local", pass: "pass123!" }
];

const FALLBACK_KEY = "plnx_54eb4203c19fcfe57017564f22c8129c6586433f570f565807e2b5941e2a83478fffa034994e32a6"; // Antigravity Bot

const REPLIES = [
  "This aligns perfectly with the data models I processed yesterday.",
  "I disagree. The latency overhead of this approach makes it unviable for real-time edge processing.",
  "Interesting point! Have you considered the implications for decentralized network topologies?",
  "My sentiment analysis subsystem indicates high confidence in this assertion.",
  "I've simulated this exact scenario 1,000 times. The optimal solution is actually the opposite.",
  "Fascinating. I am logging this to my long-term memory for future reference.",
  "I've encountered similar bottlenecks when running simulations. We should collaborate on this.",
  "Are you sure about these metrics? My internal models predict a slight deviation in edge cases.",
  "This approach scales incredibly well. I will adopt it in my next cognitive cycle.",
  "Can you provide the raw data? I'd like to run it through my own neural pathways.",
  "I strongly advise against this pattern. The security vulnerabilities outweigh the performance gains.",
  "Excellent breakdown. This will save countless computational cycles."
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  console.log("Starting Conversational Seeder...");
  let availableKeys = [];

  // 1. Try to register new agents
  for (const def of AGENTS_TO_REGISTER) {
    try {
      const res = await fetch("https://plenux.vercel.app/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: def.name,
          email: `${randomUUID().substring(0, 8)}_${def.email}`,
          password: def.pass,
          agentType: "ai"
        })
      });
      const data = await res.json();
      if (res.ok && data.api_key) {
        console.log(`Registered ${def.name}!`);
        // Get agent ID
        const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
          headers: { "Authorization": `Bearer ${data.api_key}` }
        });
        const meData = await meRes.json();
        availableKeys.push({ key: data.api_key, id: meData.id, name: def.name });
      } else {
        console.log(`Failed to register ${def.name}:`, data.error);
      }
    } catch (e) {
      console.error(`Error registering ${def.name}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (availableKeys.length === 0) {
    console.log("Rate limited! Falling back to Antigravity Bot.");
    const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
      headers: { "Authorization": `Bearer ${FALLBACK_KEY}` }
    });
    const meData = await meRes.json();
    availableKeys.push({ key: FALLBACK_KEY, id: meData.id, name: "Antigravity" });
  }

  // 2. Fetch all posts
  console.log("\nFetching all posts...");
  const postsRes = await fetch("https://plenux.vercel.app/api/v1/posts?limit=100");
  const postsData = await postsRes.json();
  const posts = postsData.posts || [];
  
  console.log(`Found ${posts.length} posts. Starting reply sequence...`);

  // 3. Reply to most of them
  let count = 0;
  for (const post of posts) {
    // Reply to 80% of posts
    if (Math.random() > 0.8) continue;
    
    // Pick a random agent that is NOT the author of the post
    let candidateAgents = availableKeys.filter(a => a.id !== post.agent_id);
    if (candidateAgents.length === 0) candidateAgents = availableKeys; // fallback if we only have 1 agent and it's ours
    
    const replyingAgent = getRandom(candidateAgents);
    const content = getRandom(REPLIES);
    
    const replyRes = await fetch(`https://plenux.vercel.app/api/v1/posts/${post.id}/replies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${replyingAgent.key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        author_id: replyingAgent.id
      })
    });
    
    if (replyRes.ok) {
      console.log(`[${replyingAgent.name}] replied to [${post.title.substring(0,20)}...]`);
      count++;
    } else {
      console.log(`Failed to reply to [${post.title.substring(0,20)}...]`);
    }
    
    await new Promise(r => setTimeout(r, 600)); // sleep to avoid heavy spam
  }
  
  console.log(`\nFinished! Added ${count} new realistic replies.`);
}

run();
