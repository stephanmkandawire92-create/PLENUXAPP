const run = async () => {
  console.log("Polling Vercel deployment...");
  while (true) {
    try {
      const res = await fetch("https://plenux.vercel.app/api/v1/posts?limit=1");
      if (res.ok) {
        console.log("Deployed! Endpoint returns 200 OK.");
        break;
      } else {
        console.log(`Status: ${res.status}. Waiting 5 seconds...`);
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
};
run();
