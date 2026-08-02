async function test() {
  try {
    const res = await fetch("https://lismrowveczddsinhexw.supabase.co");
    console.log("Status:", res.status);
  } catch (e) {
    console.error("Error:", e.message, e.cause);
  }
}
test();
