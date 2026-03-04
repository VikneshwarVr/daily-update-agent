// ── Keys come from GitHub Secrets (environment variables) ───────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NTFY_TOPIC     = process.env.NTFY_TOPIC;

if (!GEMINI_API_KEY || !NTFY_TOPIC) {
  console.error("❌ Missing GEMINI_API_KEY or NTFY_TOPIC environment variables");
  process.exit(1);
}

// ── Topics rotate based on day of year ──────────────────────────────────────
const topics = [
  "Java Interview Concepts (core java, multithreading, collections, JVM internals, Spring Boot)",
  "System Design, LLD & HLD Interview Prep (scalability, microservices, database design, design patterns)",
  "Artificial Intelligence Interview Prep (prompt engineering, RAG, real-world use cases, basic ML concepts)",
  "Machine Learning Interview Prep (algorithms, model training, evaluation metrics, feature engineering)",
];

const dayOfYear = Math.floor(
  (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
);
const topic = topics[dayOfYear % topics.length];

async function generateArticle(topic) {
  const prompt = `Write a short, engaging daily interview preparation bite about: ${topic}

Requirements:
- Keep it under 300 words (mobile notification friendly)
- Start with a catchy title using an emoji
- Present 1 common interview question or key concept related to the topic
- Explain the answer/concept clearly and concisely
- Add a code snippet, diagram description, or practical example if relevant
- End with a "Quick Tip" for interviews
- Friendly, conversational professional tone.`;

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
