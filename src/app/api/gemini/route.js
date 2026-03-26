export async function POST(request) {
  const { contents, systemPrompt } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY exists:", !!apiKey);
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: { maxOutputTokens: 1000 },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) {
    return Response.json({ error: data.error.message }, { status: 400 });
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    "응답을 받지 못했습니다.";

  return Response.json({ text });
}
