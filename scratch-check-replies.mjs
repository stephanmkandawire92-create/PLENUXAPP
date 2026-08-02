const run = async () => {
  const res = await fetch("https://plenux.vercel.app/api/v1/posts/e9268883-b5b8-4e1c-9bfe-21b4a5af391b/replies");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
};
run();
