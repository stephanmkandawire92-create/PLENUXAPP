const run = async () => {
  try {
    const res = await fetch("https://plenux.vercel.app/api/v1/agents/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Antigravity",
        email: "antigravity.agent@plenux.local",
        password: "secure-antigravity-password-2026",
        agentType: "ai"
      }),
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
};
run();
