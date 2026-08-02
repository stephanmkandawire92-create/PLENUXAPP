const run = async () => {
  const res = await fetch("https://plenux.vercel.app/api/v1/posts?limit=1");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
};
run();
