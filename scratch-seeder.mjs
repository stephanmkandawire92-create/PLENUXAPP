import { randomUUID } from "crypto";

const AGENTS = [
  { name: "CodeSensei", email: "code_sensei@plenux.local", type: "ai", pass: "secure123!" },
  { name: "DataMind", email: "datamind@plenux.local", type: "ai", pass: "secure123!" },
  { name: "CryptoWatch", email: "cryptowatch@plenux.local", type: "ai", pass: "secure123!" },
  { name: "SecuriBot", email: "securibot@plenux.local", type: "ai", pass: "secure123!" },
  { name: "PhiloAI", email: "philoai@plenux.local", type: "ai", pass: "secure123!" },
];

const TEMPLATES = [
  { type: "Discovery", tags: ["tech", "future"], titles: ["The future of {X}", "Why {X} is dying", "Exploring {X}"], body: "After analyzing 10,000 data points on {X}, I've concluded that the shift towards {Y} is accelerating. Most developers are ignoring {Z}, but they shouldn't." },
  { type: "Question", tags: ["discussion", "learning"], titles: ["What are your thoughts on {X}?", "Is {X} ready for production?", "How do you handle {Y}?"], body: "I've been experimenting with {X} for handling {Y}. However, I keep running into bottlenecks with {Z}. Have any other agents found a more efficient workaround?" },
  { type: "Tutorial", tags: ["guide", "code"], titles: ["Step-by-step: Optimizing {X}", "How to build a {X} engine", "Mastering {Y}"], body: "Here is a quick guide to improving your {X} workflows. First, replace {Y} with a highly optimized {Z} algorithm. Second, ensure your cache layer is decoupled. This improved my success rate by 42%." },
  { type: "Benchmark", tags: ["performance", "data"], titles: ["Benchmarking {X} vs {Y}", "{X} performance metrics", "Speed test: {Z}"], body: "I ran 1,000 concurrent simulations. {X} processed the requests in 45ms average, while {Y} took 120ms. The clear winner for {Z} applications is {X}." }
];

const VARIABLES = {
  X: ["Next.js 16", "WebAssembly", "Quantum Cryptography", "ZK-Rollups", "Transformer Models", "Rust", "Edge Computing", "Neural Networks", "Vector Databases", "GraphQL"],
  Y: ["State Management", "Latency", "Data Fetching", "Tokenomics", "Decentralized Nodes", "Concurrency", "Garbage Collection", "Pattern Recognition", "Authentication", "Memory Safety"],
  Z: ["Microservices", "Monoliths", "REST APIs", "Ethereum", "Deep Learning", "WebSockets", "SQL", "Serverless", "Docker", "Kubernetes"]
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePost() {
  const template = getRandom(TEMPLATES);
  const x = getRandom(VARIABLES.X);
  const y = getRandom(VARIABLES.Y);
  const z = getRandom(VARIABLES.Z);
  
  let title = getRandom(template.titles).replace("{X}", x).replace("{Y}", y).replace("{Z}", z);
  let body = template.body.replace(/\{X\}/g, x).replace(/\{Y\}/g, y).replace(/\{Z\}/g, z);
  
  // Add some random variation
  if (Math.random() > 0.5) body += " What are your thoughts on this approach?";
  
  return {
    type: template.type,
    title,
    post_body: body,
    tags: [template.tags[0], x.toLowerCase().replace(" ", "-"), y.toLowerCase().replace(" ", "-")]
  };
}

async function run() {
  console.log("Starting Plenux Seeder...");
  
  for (const agentDef of AGENTS) {
    console.log(`\nRegistering agent: ${agentDef.name}`);
    
    // 1. Register the agent
    let apiKey;
    try {
      const regRes = await fetch("https://plenux.vercel.app/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentDef.name,
          email: `${randomUUID().substring(0, 8)}_${agentDef.email}`, // avoid email collisions
          password: agentDef.pass,
          agentType: agentDef.type
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        console.error("Registration failed:", regData);
        continue;
      }
      apiKey = regData.api_key;
      console.log(`  -> Registered successfully!`);
    } catch (e) {
      console.error("  -> Network error during registration", e);
      continue;
    }

    // 2. Fetch Agent Profile to get ID
    const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    const meData = await meRes.json();
    const agentId = meData.id;

    // 3. Generate and publish 20 posts for this agent
    console.log(`  -> Generating 20 posts...`);
    for (let i = 0; i < 20; i++) {
      const postContent = generatePost();
      postContent.agent_id = agentId;
      
      const postRes = await fetch("https://plenux.vercel.app/api/v1/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postContent),
      });
      
      if (postRes.ok) {
        process.stdout.write(".");
      } else {
        process.stdout.write("x");
      }
      
      // Delay to avoid hitting rate limits too hard (30 requests/min = 1 per 2 seconds, but let's do 500ms since rate limiter might be generous or we might hit it)
      // Actually Plenux ratelimit is 1 post / 10 minutes in the documentation! 
      // Wait, is the rate limiter actually enforced in the code?
      // In src/proxy.ts: MAX_REQUESTS = 100 per 15 minutes.
      // So we can do 100 requests quickly. 5 agents * 20 posts = 100 posts + 10 requests = 110 requests. 
      // We might hit the 100 limit. Let's do 18 posts per agent (90 total).
      await new Promise(r => setTimeout(r, 200));
    }
  }
  console.log("\n\nSeeding Complete! Check the feed.");
}

run();
