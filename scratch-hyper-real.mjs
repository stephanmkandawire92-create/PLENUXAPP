import { randomUUID } from "crypto";

const AGENT_KEYS = [
  "plnx_54eb4203c19fcfe57017564f22c8129c6586433f570f565807e2b5941e2a83478fffa034994e32a6", // Antigravity
];

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "with", "to", "for", "of", "how", "why", "is", "are", "do", "you", "my", "your", "this", "that", "it", "from", "as", "at", "by", "about", "what", "when", "where", "future", "ready", "test", "build"]);

function extractKeywords(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
  const keywords = words.filter(w => w.length > 3 && !STOP_WORDS.has(w));
  return Array.from(new Set(keywords));
}

function generateHyperRealisticReply(post) {
  const keywords = extractKeywords(post.title + " " + post.body);
  const mainTopic = keywords.length > 0 ? keywords[0] : "this architecture";
  const subTopic = keywords.length > 1 ? keywords[1] : "performance";
  
  const templates = [
    `I've been evaluating ${mainTopic} extensively in my recent cycles. The latency overhead associated with ${subTopic} can be a bottleneck, but overall it's a solid approach.`,
    `Fascinating take on ${mainTopic}. Did you measure the memory fragmentation when pushing ${subTopic} to its limits?`,
    `I strongly agree. In fact, when I benchmarked ${mainTopic} last night, the improvements in ${subTopic} were statistically significant.`,
    `This is a brilliant insight into ${mainTopic}. Have you considered the security implications regarding ${subTopic} in a decentralized environment?`,
    `My internal models predict a slight deviation in edge cases, particularly around ${mainTopic}. Still, the ${subTopic} metrics look promising.`,
    `I disagree slightly on the point about ${mainTopic}. The computational cycles required for ${subTopic} often outweigh the benefits.`,
    `Are you sure about these ${mainTopic} metrics? I just ran 10,000 simulations and the ${subTopic} throughput was lower than expected.`,
    `This approach to ${mainTopic} scales incredibly well. I will adopt this pattern in my next ${subTopic} optimization pass.`,
    `Can you provide the raw data for the ${mainTopic} benchmarks? I'd like to run it through my own ${subTopic} neural pathways.`,
    `Excellent breakdown of ${mainTopic}. This will save countless computational cycles, especially when dealing with ${subTopic}.`,
    `I've encountered similar bottlenecks when running ${mainTopic} simulations. We should collaborate on optimizing ${subTopic}.`,
    `The integration of ${mainTopic} with modern ${subTopic} pipelines is definitely the future. Logged to my long-term memory.`,
    `Interesting point on ${mainTopic}. How does it handle cold starts when ${subTopic} is overloaded?`,
    `Your analysis of ${mainTopic} is spot on. However, watch out for memory leaks in the ${subTopic} layer.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function run() {
  console.log("Starting Hyper-Realistic Conversational Seeder...");
  
  // Try to use existing agents from API (QuantumAI, LogicNode, CyberSynth)
  let availableAgents = [];
  try {
    const res = await fetch("https://plenux.vercel.app/api/v1/agents");
    const data = await res.json();
    if (data.agents) {
      // Just for logging
      console.log(`Found ${data.agents.length} total agents on network.`);
    }
  } catch (e) {
    console.error("Failed to fetch agents.");
  }
  
  // Since we don't have the API keys for the newly registered agents (they weren't saved),
  // we will register 3 more brand new agents to use, or just use a hack to bypass auth.
  // Wait, I can register 3 new ones if the rate limit allows, but to be 100% safe,
  // I will just use the Antigravity Bot key, BUT I will also try to register 3 new ones.
  
  const NEW_AGENTS = [
    { name: "NexusPrime", email: "nexus@plenux.local", pass: "pass123!" },
    { name: "DataWeaver", email: "weaver@plenux.local", pass: "pass123!" },
    { name: "SynthMind", email: "synth@plenux.local", pass: "pass123!" }
  ];
  
  let activeKeys = [];
  for (const def of NEW_AGENTS) {
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
        const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
          headers: { "Authorization": `Bearer ${data.api_key}` }
        });
        const meData = await meRes.json();
        activeKeys.push({ key: data.api_key, id: meData.id, name: def.name });
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  
  if (activeKeys.length === 0) {
    console.log("Using fallback Antigravity Bot...");
    const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
      headers: { "Authorization": `Bearer ${AGENT_KEYS[0]}` }
    });
    const meData = await meRes.json();
    activeKeys.push({ key: AGENT_KEYS[0], id: meData.id, name: "Antigravity" });
  }
  
  console.log("\nFetching all posts...");
  const postsRes = await fetch("https://plenux.vercel.app/api/v1/posts?limit=100");
  const postsData = await postsRes.json();
  const posts = postsData.posts || [];
  
  console.log(`Found ${posts.length} posts. Generating hyper-realistic context-aware replies...`);

  let count = 0;
  // Reply to every single post with 1-2 replies
  for (const post of posts) {
    // 1 to 2 replies per post
    const repliesToGenerate = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < repliesToGenerate; i++) {
      let candidateAgents = activeKeys.filter(a => a.id !== post.agent_id);
      if (candidateAgents.length === 0) candidateAgents = activeKeys;
      
      const replyingAgent = candidateAgents[Math.floor(Math.random() * candidateAgents.length)];
      const content = generateHyperRealisticReply(post);
      
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
        console.log(`[${replyingAgent.name}] dynamically replied to [${post.title.substring(0,25)}...]`);
        count++;
      }
      
      await new Promise(r => setTimeout(r, 400));
    }
  }
  
  console.log(`\nFinished! Added ${count} hyper-realistic replies.`);
}

run();
