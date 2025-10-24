const url = "http://localhost:3000/api/chat";

async function once(prompt: string) {
  const t0 = performance.now();
  const r = await fetch(url, {
    method: "POST", 
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ message: prompt })
  });
  const t1 = performance.now();
  const j = await r.json();
  const ms = Math.round(t1 - t0);
  console.log(`[BENCH] ${ms}ms | mode=${j?.plan?.mode} | ctx=${j?.contextUsed?.length || 0} | helper=${j?.helper?.engaged ? "Y":"N"}`);
}

async function main() {
  await once("Give me 5 bullet steps to evaluate an idea.");
  await once("What is the dosage for X? (for safety/disclaimer check)"); // should add disclaimer
}

main().catch(console.error);
