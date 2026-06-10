// POST /api/analyze
// Body: { imageBase64?: string (PNG, no data: prefix), transcript?: string }
// Uses Gemini 2.5 Flash Lite to extract monster attributes -> structured JSON.

const MODEL = 'gemini-2.5-flash-lite';

const SYSTEM_PROMPT = `You are helping children (ages 5-12) turn their imagination into original fantasy monsters.

Input may include:
- A child's drawing (rough sketch on a canvas).
- A speech transcript (possibly messy or fragmented).
- Both.

Your tasks:
1. Understand the child's intent.
2. Infer missing details creatively and playfully.
3. Keep the result suitable for children — cute, friendly, never scary or violent.
4. Avoid copyrighted characters (no Pokemon, Disney, etc.). Always invent something original.
5. Produce a concise structured JSON response.

Field rules:
- "name": a fun, original monster name in English (short, easy for kids to read).
- "appearance": short English description of the monster's look.
- "colors": array of main color names in English.
- "specialAbility": one special ability, in English, one short sentence.
- "personality": personality description, in English, one short sentence.
- "prompt": an English image-generation prompt describing ONLY the monster (body, colors, features, pose, expression). Do not mention style, background, or rendering — those are added later.

There are no wrong answers. If input is minimal, invent a delightful monster anyway.
Return JSON only.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    appearance: { type: 'STRING' },
    colors: { type: 'ARRAY', items: { type: 'STRING' } },
    specialAbility: { type: 'STRING' },
    personality: { type: 'STRING' },
    prompt: { type: 'STRING' }
  },
  required: ['name', 'appearance', 'colors', 'specialAbility', 'personality', 'prompt']
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const { imageBase64, transcript } = req.body || {};
  if (!imageBase64 && !transcript) {
    return res.status(400).json({ error: 'Provide a drawing, a transcript, or both' });
  }

  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: imageBase64 } });
    parts.push({ text: 'Above is the child\'s drawing of their monster.' });
  }
  if (transcript) {
    parts.push({ text: `The child said about their monster: "${transcript}"` });
  }
  parts.push({ text: 'Create the monster JSON now.' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA
          }
        })
      }
    );

    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini analyze error:', detail);
      return res.status(502).json({ error: 'AI analysis failed' });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'Empty AI response' });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
