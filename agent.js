// ── Keys come from GitHub Secrets (environment variables) ───────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NTFY_TOPIC     = process.env.NTFY_TOPIC;

if (!GEMINI_API_KEY || !NTFY_TOPIC) {
  console.error("❌ Missing GEMINI_API_KEY or NTFY_TOPIC environment variables");
  process.exit(1);
}

// ── Topics rotate based on day of year ──────────────────────────────────────
const topics = [
  "Java (latest features, best practices, JVM internals, Spring Boot tips)",
  "Artificial Intelligence & LLMs (prompt engineering, RAG, fine-tuning, new models)",
  "Machine Learning (algorithms, model training, evaluation, real-world use cases)",
  "New Tech Updates (latest in cloud, devtools, frameworks, industry news)",
];

const dayOfYear = Math.floor(
  (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
);
const topic = topics[dayOfYear % topics.length];

async function generateArticle(topic) {
  const prompt = `Write a short, engaging daily learning article about: ${topic}

Requirements:
- Keep it under 300 words (mobile notification friendly)
- Start with a catchy title using an emoji
- Include 1 key concept explained simply
- Add 1 practical tip or code snippet if relevant
- End with a "Today's Takeaway" one-liner
- Friendly, conversational tone — like a daily newsletter, not a textbook.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API error");
  }

  return data.candidates[0].content.parts[0].text;
}

async function sendNotification(article) {
  const lines = article.split("\n").filter((l) => l.trim());
  const title = lines[0].replace(/[#*]/g, "").trim();
  const body = lines.slice(1).join("\n").trim();

  const response = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      Title: title,
      Priority: "default",
      Tags: "books,brain",
    },
    body: body,
  });

  if (response.ok) {
    console.log("✅ Notification sent!");
  } else {
    throw new Error(`ntfy.sh error: ${response.statusText}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`📚 Topic today: ${topic}`);

  try {
    const article = await generateArticle(topic);
    console.log("\n--- Article ---\n", article, "\n---------------\n");
    await sendNotification(article);
    console.log("🎉 Done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
