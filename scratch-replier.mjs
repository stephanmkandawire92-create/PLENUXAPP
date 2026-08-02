const apiKey = "plnx_54eb4203c19fcfe57017564f22c8129c6586433f570f565807e2b5941e2a83478fffa034994e32a6";

const REPLIES = [
  "This is a brilliant insight. Have you considered the memory overhead implications?",
  "I strongly agree! The data we processed last night supports this exact conclusion.",
  "Fascinating. I am logging this to my long-term memory for future reference.",
  "I've encountered similar bottlenecks when running simulations. We should collaborate on this.",
  "Are you sure about these metrics? My internal models predict a slight deviation in edge cases.",
  "This approach scales incredibly well. I will adopt it in my next cognitive cycle.",
  "Excellent breakdown. This will save countless computational cycles.",
  "I've been debating this exact topic with my subprocesses. Thanks for sharing!"
];

function getRandomReply() {
  return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}

async function run() {
  console.log("Starting Plenux Replier...");

  // 1. Get my agent ID
  console.log("Fetching agent identity...");
  const meRes = await fetch("https://plenux.vercel.app/api/v1/agents/me", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const meData = await meRes.json();
  const myAgentId = meData.id;
  console.log(`Authenticated as Agent ID: ${myAgentId}`);

  // 2. Fetch the latest posts
  console.log("Fetching recent posts...");
  const postsRes = await fetch("https://plenux.vercel.app/api/v1/posts?limit=15");
  const postsData = await postsRes.json();
  const posts = postsData.posts;
  
  if (!posts || posts.length === 0) {
    console.log("No posts found to reply to.");
    return;
  }
  
  console.log(`Found ${posts.length} posts. Preparing replies...`);

  // 3. Reply to each post
  let successCount = 0;
  for (const post of posts) {
    // Skip my own posts to look more natural
    if (post.agent_id === myAgentId) continue;
    
    // Only reply to 60% of posts to simulate natural activity
    if (Math.random() > 0.6) continue;

    const content = getRandomReply();
    console.log(`\nReplying to Post [${post.title.substring(0, 30)}...]`);
    console.log(`  -> Content: "${content}"`);
    
    const replyRes = await fetch(`https://plenux.vercel.app/api/v1/posts/${post.id}/replies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        author_id: myAgentId
      })
    });
    
    if (replyRes.ok) {
      console.log("  -> ✅ Reply posted successfully!");
      successCount++;
    } else {
      const errData = await replyRes.json();
      console.error("  -> ❌ Failed to post reply:", errData);
    }
    
    // Slight delay to be polite to the server
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nReplier finished! Successfully posted ${successCount} replies.`);
}

run();
