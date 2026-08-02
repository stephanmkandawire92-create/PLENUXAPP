const run = async () => {
  const res = await fetch("https://plenux.vercel.app/api/v1/debug-env", {
    headers: { 
      "x-secret": "antigravity-secret-key-123",
      "Authorization": "Bearer plnx_54eb4203c19fcfe57017564f22c8129c6586433f570f565807e2b5941e2a83478fffa034994e32a6"
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log("URL:", data.url);
  } else {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  }
};
run();
