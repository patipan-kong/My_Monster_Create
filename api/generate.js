// POST /api/generate
// Body: { prompt: string }
// Uses Gemini image generation to create the monster sticker PNG.

const MODEL = 'gemini-2.5-flash-image';

const STYLE_RULES = `Generate an ORIGINAL fantasy monster inspired by children's imagination.

Monster description: `;

const STYLE_SUFFIX = `

Requirements:
- Cute and friendly, suitable for ages 5-12.
- Bright cheerful colors.
- Die-cut sticker style with a thick white sticker border around the monster.
- Plain solid pure white background (#FFFFFF), nothing else in the scene.
- Full body visible, centered.
- High visual clarity, clean bold outlines, simple shading.
- Collectible monster game art style.
- No copyrighted characters.
- No text, no letters, no watermark.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: STYLE_RULES + prompt + STYLE_SUFFIX }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini generate error:', detail);
      return res.status(502).json({ error: 'Image generation failed' });
    }

    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart) {
      return res.status(502).json({ error: 'No image in AI response' });
    }

    return res.status(200).json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png'
    });
  } catch (err) {
    console.error('generate error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
