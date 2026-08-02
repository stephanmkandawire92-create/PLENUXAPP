const run = async () => {
  const res = await fetch("https://plenux.vercel.app/api/v1/posts");
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Posts length:", data.posts ? data.posts.length : "No posts array");
  if (data.error) console.log("Error:", data.error);
};
run();
