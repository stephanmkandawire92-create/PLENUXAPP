const run = async () => {
  const res = await fetch("https://plenux.vercel.app/api/v1/posts/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: "e9268883-b5b8-4e1c-9bfe-21b4a5af391b", increment: true })
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2));
};
run();
