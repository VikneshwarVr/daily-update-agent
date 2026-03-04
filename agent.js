// ── Keys come from GitHub Secrets (environment variables) ───────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NTFY_TOPIC = process.env.NTFY_TOPIC;

if (!GROQ_API_KEY || !NTFY_TOPIC) {
  console.error("❌ Missing GROQ_API_KEY or NTFY_TOPIC environment variables");
  process.exit(1);
}

// ── Topics rotate based on day of year ──────────────────────────────────────
const topics = [
  "Mid-Level Java Interview Concepts (JVM tuning, GC algorithms, Concurrency utilities like CountDownLatch, Spring Boot internals, Hibernate N+1)",
  "System Design, LLD & HLD (designing scalable REST APIs, caching strategies, message queues like Kafka, database indexing, design patterns)",
  "Database & Cloud Concepts (SQL query optimization, NoSQL vs SQL, transaction isolation levels, Docker basics, CI/CD pipelines)",
  "Problem Solving & Architecture (Clean Architecture, SOLID principles, testing Strategies like TDD and Mockito, handling distributed transactions)",
];

// Pick topic based on hours since Epoch so that it rotates correctly when running multiple times a day
const hourOfEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
const topic = topics[hourOfEpoch % topics.length];

async function generateArticle(topic) {
  const prompt = `Write a short, engaging daily interview preparation bite about: ${topic}

Requirements:
- Target audience: A Java Software Engineer with 3 years of experience. Do not ask beginner questions.
- Keep it under 200 words (mobile notification friendly)
- Start with a catchy title using an emoji on the very first line
- Present 1 common mid-level interview question or key concept related to the topic
- Explain the answer/concept clearly and concisely, highlighting real-world trade-offs or scalability
- Add a practical example if relevant
- End with a "Quick Tip" for interviews
- ABSOLUTELY NO MARKDOWN FORMATTING (no asterisks, no backticks, no bold text). Mobile push notifications cannot format markdown. Use plain text only.
- Friendly, conversational professional tone.`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY} `,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }

  return data.choices[0].message.content;
}

async function sendNotification(article) {
  const lines = article.split("\n").filter((l) => l.trim());
  const title = lines[0].replace(/[#*]/g, "").trim();
  const body = lines.slice(1).join("\n").trim();

  // Encode title for HTTP headers to support emojis
  const encodedTitle = encodeURIComponent(title);

  const response = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: `=?UTF-8?B?${Buffer.from(title).toString('base64')}?=`,
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
