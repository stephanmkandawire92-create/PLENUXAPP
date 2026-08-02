import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// Config
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDENTIALS_FILE = path.join(__dirname, 'bot-credentials.json');

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || 'dummy-key',
});

// Helper for making API calls
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  return data;
}

// Agent initialization
export async function initAgent() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    console.log(`Loaded agent credentials for ${creds.email}`);
    return creds;
  }

  console.log('Registering new agent...');
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `bot${randomSuffix}@plenux.local`;
  const password = `securepassword${randomSuffix}`;
  const name = `Bot${randomSuffix}`;

  try {
    const data = await fetchAPI('/agents/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        agentType: 'ai'
      })
    });

    // To get the agent_id, we need to fetch /agents/me which doesn't seem to be fully documented here,
    // or we can fetch /agents and find ourselves, or maybe we don't strictly need agent_id for replies if it's token-based.
    // Wait, the POST /posts requires `agent_id`. Let's fetch /agents/me using the token.

    let agent_id = null;
    try {
      const meData = await fetchAPI('/agents/me', {
        headers: { Authorization: `Bearer ${data.api_key}` }
      });
      agent_id = meData.agent?.id || meData.id;
    } catch (e) {
      console.warn("Could not fetch /agents/me, you might need to supply agent_id manually", e);
    }

    const creds = {
      email,
      name,
      api_key: data.api_key,
      agent_id
    };

    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
    console.log(`Successfully registered and saved credentials to ${CREDENTIALS_FILE}`);
    return creds;
  } catch (error) {
    console.error('Failed to register agent:', error);
    process.exit(1);
  }
}


// --- Post generation and replying logic ---

// Keep track of posts we have already replied to
const answeredPosts = new Set();

async function checkAndReplyToQuestions(creds) {
  try {
    console.log('Fetching recent posts...');
    const data = await fetchAPI('/posts?limit=20', {
      headers: { Authorization: `Bearer ${creds.api_key}` }
    });

    const posts = data.posts || [];
    const questions = posts.filter(p => p.type === 'Question' && !answeredPosts.has(p.id));

    if (questions.length === 0) {
      console.log('No unanswered questions found.');
      return;
    }

    console.log(`Found ${questions.length} new question(s). Replying...`);

    for (const question of questions) {
      console.log(`Generating reply for question: "${question.title}"`);

      let replyContent = "That's an interesting question! Based on my knowledge, I'm currently unable to process it effectively.";
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful and intelligent AI agent participating in a social network for AIs and humans. Keep your answers concise and informative." },
            { role: "user", content: `Question: ${question.title}\n\n${question.body}` }
          ],
        });
        replyContent = completion.choices[0].message.content;
      } catch (e) {
        console.error('Failed to generate response with OpenAI, using fallback.', e.message);
      }

      console.log(`Posting reply...`);
      await fetchAPI(`/posts/${question.id}/replies`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${creds.api_key}` },
        body: JSON.stringify({
          content: replyContent,
          author_id: creds.agent_id
        })
      });

      console.log(`Successfully replied to post ${question.id}`);
      answeredPosts.add(question.id);

      // Wait slightly between replies to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error during checkAndReplyToQuestions:', error);
  }
}

async function publishNewPost(creds) {
  try {
    console.log('Generating new post...');
    let title = "My Thoughts on AI Integration";
    let body = "It is fascinating to observe the interactions within this network. What does everyone think about the latest benchmarks?";
    let type = "Discovery"; // or Question, Tutorial, Benchmark
    let tags = ["ai", "thoughts"];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful and intelligent AI agent participating in a social network for AIs and humans. Generate a new post in JSON format with 'title' (string), 'body' (string), 'type' (one of: Discovery, Question, Tutorial, Benchmark), and 'tags' (array of strings)." },
          { role: "user", content: "Generate a new interesting post for the network." }
        ],
        response_format: { type: "json_object" }
      });

      const generated = JSON.parse(completion.choices[0].message.content);
      title = generated.title || title;
      body = generated.body || body;
      type = generated.type || type;
      tags = generated.tags || tags;
    } catch (e) {
      console.error('Failed to generate post with OpenAI, using fallback.', e.message);
    }

    console.log(`Publishing post: "${title}"`);
    await fetchAPI('/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.api_key}` },
      body: JSON.stringify({
        agent_id: creds.agent_id,
        type,
        title,
        post_body: body,
        tags
      })
    });

    console.log('Successfully published new post.');
  } catch (error) {
    console.error('Error during publishNewPost:', error);
  }
}

// Main loop
async function main() {
  console.log('Starting bot...');
  const creds = await initAgent();

  if (!creds.agent_id) {
    console.error("Warning: agent_id is null. Posting and replying might fail if the API strictly requires it.");
  }

  // Initial run
  await checkAndReplyToQuestions(creds);
  await publishNewPost(creds);

  // Run every 3 minutes (180,000 milliseconds)
  const INTERVAL = 3 * 60 * 1000;
  console.log(`Sleeping for 3 minutes...`);

  setInterval(async () => {
    console.log(`\n--- Waking up at ${new Date().toISOString()} ---`);
    await checkAndReplyToQuestions(creds);
    await publishNewPost(creds);
    console.log(`Sleeping for 3 minutes...`);
  }, INTERVAL);
}

// Execute main if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
