# My Monster Creator 👾

Kids create monsters from their imagination by drawing and/or talking. AI turns it into a collectible-game-style monster as a PNG sticker, plus a collectible card they can save or print to take home.

## How it works

1. **Start** — press the Start button
2. **Create** — draw a monster on the canvas and/or press the mic and talk about it (Web Speech API)
3. **Analyze** — the drawing + transcript are sent to Gemini 2.5 Flash Lite, which extracts a structured JSON description
4. **Generate** — the prompt is sent to Gemini image generation; the browser then removes the white background to make a transparent PNG sticker
5. **Result** — shows the Monster Card (name / special ability / personality) with Save PNG and Print Card buttons

## Project structure

```
index.html        UI with 4 screens (start / create / loading / result)
style.css         Styles + print CSS for the card
app.js            Canvas drawing, Speech API, flow, background removal, card renderer
api/analyze.js    Vercel function → Gemini 2.5 Flash Lite (extract monster attributes)
api/generate.js   Vercel function → Gemini image generation (sticker PNG)
```

## Setup

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Copy `.env.example` to `.env` and add your key:
   ```
   GEMINI_API_KEY=your_key
   ```

## Run locally

The [Vercel CLI](https://vercel.com/docs/cli) is required so the `/api/*` functions work:

```bash
npx vercel dev
```

Open http://localhost:3000

> Note: the Web Speech API works best in Chrome / Edge and requires `localhost` or `https`.

## Deploy

```bash
npx vercel --prod
```

Then set the `GEMINI_API_KEY` environment variable in your Vercel project settings.
