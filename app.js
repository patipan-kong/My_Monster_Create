/* ===== My Monster Creator — app logic ===== */
(() => {
  'use strict';

  // ---------- Screen navigation ----------
  const screens = {
    start: document.getElementById('screen-start'),
    create: document.getElementById('screen-create'),
    loading: document.getElementById('screen-loading'),
    result: document.getElementById('screen-result')
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ---------- Toast ----------
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg, ms = 3500) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, ms);
  }

  // ---------- Canvas drawing ----------
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('canvas-hint');

  let drawing = false;
  let hasDrawn = false;
  let brushColor = '#3b2f5e';
  let brushSize = 10;
  let erasing = false;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * (canvas.width / rect.width),
      y: (point.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    hasDrawn = true;
    hint.style.display = 'none';
    const { x, y } = canvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // dot for a single tap
    ctx.strokeStyle = erasing ? '#ffffff' : brushColor;
    ctx.lineWidth = erasing ? brushSize * 3 : brushSize;
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  }

  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = canvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() { drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw);

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    hint.style.display = 'flex';
  }

  // Tools
  document.querySelectorAll('.color').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      brushColor = btn.dataset.color;
      erasing = false;
      document.getElementById('btn-eraser').classList.remove('selected');
    });
  });

  const brushSmall = document.getElementById('brush-small');
  const brushBig = document.getElementById('brush-big');
  brushSmall.addEventListener('click', () => {
    brushSize = 5;
    brushSmall.classList.add('selected');
    brushBig.classList.remove('selected');
  });
  brushBig.addEventListener('click', () => {
    brushSize = 10;
    brushBig.classList.add('selected');
    brushSmall.classList.remove('selected');
  });

  document.getElementById('btn-eraser').addEventListener('click', (e) => {
    erasing = !erasing;
    e.currentTarget.classList.toggle('selected', erasing);
  });

  document.getElementById('btn-clear').addEventListener('click', clearCanvas);

  // Export drawing downscaled on white background (Gemini sees JPEG/PNG better on white)
  function exportDrawing() {
    if (!hasDrawn) return null;
    const out = document.createElement('canvas');
    const scale = 512 / canvas.width;
    out.width = 512;
    out.height = Math.round(canvas.height * scale);
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/png').split(',')[1];
  }

  // ---------- Speech recognition (Thai / English / Japanese) ----------
  const btnMic = document.getElementById('btn-mic');
  const transcriptBox = document.getElementById('transcript-box');

  const LANGS = {
    'th-TH': { speak: 'พูด', listening: 'กำลังฟัง...', retry: 'ฟังไม่ชัด ลองพูดอีกครั้งนะ' },
    'en-US': { speak: 'Speak', listening: 'Listening...', retry: "I couldn't hear clearly. Please try again." },
    'ja-JP': { speak: 'はなす', listening: '聞いています...', retry: 'うまく聞き取れませんでした。もう一度お願いします。' }
  };
  let selectedLang = 'en-US';

  // The textarea is the single source of truth for the transcript —
  // kids/parents/staff can edit, delete, or clear it before anything is sent to AI.
  let baseTranscript = '';  // textarea content when the current recording started
  let sessionFinal = '';    // final text from the current recording
  let listening = false;
  let recognition = null;

  const joinText = (...parts) => parts.map((s) => s.trim()).filter(Boolean).join(' ');

  function micIdleLabel() { return `🎤 ${LANGS[selectedLang].speak}`; }
  function micListeningLabel() { return `🔴 ${LANGS[selectedLang].listening}`; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      sessionFinal = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) sessionFinal += res[0].transcript + ' ';
        else interim += res[0].transcript;
      }
      transcriptBox.value = joinText(baseTranscript, sessionFinal, interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        showToast('🎤 Please allow microphone access');
      } else if (event.error !== 'aborted') {
        showToast(LANGS[selectedLang].retry);
      }
    };

    // continuous = false: recognition ends by itself after one utterance
    recognition.onend = () => {
      if (sessionFinal.trim()) {
        transcriptBox.value = joinText(baseTranscript, sessionFinal);
      } else {
        transcriptBox.value = baseTranscript;
        if (listening) showToast(LANGS[selectedLang].retry);
      }
      finishListeningUI();
    };
  } else {
    btnMic.disabled = true;
    btnMic.textContent = '🎤 Speech not supported here — just draw!';
  }

  function startListening() {
    listening = true;
    sessionFinal = '';
    baseTranscript = transcriptBox.value.trim(); // new speech appends to existing text
    btnMic.classList.add('recording');
    btnMic.textContent = micListeningLabel();
    transcriptBox.readOnly = true; // lock while live results stream in
    recognition.lang = selectedLang;
    try { recognition.start(); } catch (_) { /* already started */ }
  }

  function stopListening() {
    if (recognition) try { recognition.stop(); } catch (_) {}
    finishListeningUI();
  }

  function finishListeningUI() {
    listening = false;
    btnMic.classList.remove('recording');
    btnMic.textContent = micIdleLabel();
    transcriptBox.readOnly = false;
  }

  btnMic.addEventListener('click', () => {
    if (!recognition) return;
    if (listening) stopListening();
    else startListening();
  });

  // Clear the whole transcript with one tap
  document.getElementById('btn-clear-text').addEventListener('click', () => {
    if (listening) stopListening();
    transcriptBox.value = '';
    baseTranscript = '';
    sessionFinal = '';
  });

  // Language selector — one tap to switch; stop any active recording first
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (listening) stopListening();
      selectedLang = btn.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (recognition) btnMic.textContent = micIdleLabel();
    });
  });

  // ---------- Loading messages ----------
  const loadingText = document.getElementById('loading-text');
  const LOADING_MESSAGES = [
    'Summoning your monster... 🪄',
    'Mixing magic colors... 🎨',
    'Your monster is hatching... 🥚',
    'Almost there... ✨',
    'Your monster is getting dressed... 👕'
  ];
  let loadingTimer = null;
  function startLoadingMessages() {
    let i = 0;
    loadingText.textContent = LOADING_MESSAGES[0];
    loadingTimer = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      loadingText.textContent = LOADING_MESSAGES[i];
    }, 2800);
  }
  function stopLoadingMessages() { clearInterval(loadingTimer); }

  // ---------- API ----------
  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  }

  // ---------- Background removal (white -> transparent, flood fill from edges) ----------
  function removeWhiteBackground(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const { width: w, height: h } = c;
    const imageData = cx.getImageData(0, 0, w, h);
    const d = imageData.data;

    const TOLERANCE = 28; // distance from white
    const isBg = (idx) => {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      return 255 - r < TOLERANCE && 255 - g < TOLERANCE && 255 - b < TOLERANCE;
    };

    // BFS flood fill from all edge pixels so white inside the monster is kept
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) { queue.push(x, (h - 1) * w + x); }
    for (let y = 0; y < h; y++) { queue.push(y * w, y * w + (w - 1)); }

    while (queue.length) {
      const p = queue.pop();
      if (visited[p]) continue;
      visited[p] = 1;
      if (!isBg(p * 4)) continue;
      d[p * 4 + 3] = 0; // transparent
      const x = p % w, y = (p / w) | 0;
      if (x > 0) queue.push(p - 1);
      if (x < w - 1) queue.push(p + 1);
      if (y > 0) queue.push(p - w);
      if (y < h - 1) queue.push(p + w);
    }

    cx.putImageData(imageData, 0, 0);
    return c;
  }

  // ---------- Turnaround sheet splitting (front view left, back view right) ----------
  function cropToContent(src, x0, x1) {
    const cx = src.getContext('2d');
    const { height: h } = src;
    const region = cx.getImageData(x0, 0, x1 - x0, h);
    const d = region.data;
    const rw = x1 - x0;
    let minX = rw, maxX = -1, minY = h, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rw; x++) {
        if (d[(y * rw + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null; // nothing in this half
    const pad = 14;
    const out = document.createElement('canvas');
    out.width = (maxX - minX + 1) + pad * 2;
    out.height = (maxY - minY + 1) + pad * 2;
    out.getContext('2d').drawImage(
      src,
      x0 + minX, minY, maxX - minX + 1, maxY - minY + 1,
      pad, pad, maxX - minX + 1, maxY - minY + 1
    );
    return out.toDataURL('image/png');
  }

  // Find the widest fully-transparent column gap near the middle and split there.
  // Returns [frontDataUrl, backDataUrl] or null if the sheet can't be split.
  function splitTurnaround(c) {
    const cx = c.getContext('2d');
    const { width: w, height: h } = c;
    const d = cx.getImageData(0, 0, w, h).data;

    const colHasInk = new Uint8Array(w);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        if (d[(y * w + x) * 4 + 3] > 10) { colHasInk[x] = 1; break; }
      }
    }

    let best = null;
    let runStart = -1;
    for (let x = 0; x <= w; x++) {
      const empty = x < w && !colHasInk[x];
      if (empty && runStart < 0) runStart = x;
      if (!empty && runStart >= 0) {
        const mid = (runStart + x) / 2;
        const len = x - runStart;
        if (mid > w * 0.25 && mid < w * 0.75 && (!best || len > best.len)) {
          best = { mid, len };
        }
        runStart = -1;
      }
    }

    if (!best || best.len < w * 0.02) return null;
    const split = Math.round(best.mid);
    const front = cropToContent(c, 0, split);
    const back = cropToContent(c, split, w);
    return front && back ? [front, back] : null;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ---------- Main flow ----------
  let monster = null; // { name, specialAbility, personality, ... }
  let stickerDataUrl = null;     // front view
  let backStickerDataUrl = null; // back view (null if the sheet couldn't be split)
  let showingBack = false;

  document.getElementById('btn-start').addEventListener('click', () => showScreen('create'));

  document.getElementById('btn-done').addEventListener('click', async () => {
    if (listening) stopListening();

    const imageBase64 = exportDrawing();
    // Always read from the textarea — the reviewed/edited text is what gets sent
    const transcript = transcriptBox.value.trim();
    if (!imageBase64 && !transcript) {
      showToast('Draw 🎨 or tell us 🎤 at least one thing first!');
      return;
    }

    showScreen('loading');
    startLoadingMessages();

    try {
      // 1) Flash Lite: extract monster attributes
      monster = await postJSON('/api/analyze', {
        imageBase64,
        transcript,
        language: transcript ? selectedLang : null
      });

      // 2) Image generation
      const gen = await postJSON('/api/generate', { prompt: monster.prompt });

      // 3) Make the white background transparent, then split the
      //    turnaround sheet into front (left) and back (right) stickers
      const rawImg = await loadImage(`data:${gen.mimeType};base64,${gen.imageBase64}`);
      const sheet = removeWhiteBackground(rawImg);
      const views = splitTurnaround(sheet);
      if (views) {
        [stickerDataUrl, backStickerDataUrl] = views;
      } else {
        stickerDataUrl = sheet.toDataURL('image/png');
        backStickerDataUrl = null;
      }
      showingBack = false;

      // 4) Fill the card
      document.getElementById('card-name').textContent = monster.name || 'Mystery Monster';
      document.getElementById('card-image').src = stickerDataUrl;
      document.getElementById('btn-flip').hidden = !backStickerDataUrl;
      document.getElementById('card-ability').textContent = monster.specialAbility || '-';
      document.getElementById('card-personality').textContent = monster.personality || '-';

      stopLoadingMessages();
      showScreen('result');
    } catch (err) {
      console.error(err);
      stopLoadingMessages();
      showScreen('create');
      showToast('Oops! The magic fizzled — try again! 🪄');
    }
  });

  // ---------- Save card as PNG ----------
  function wrapText(c2d, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (c2d.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  async function renderCardPNG() {
    const W = 720, H = 1000;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    // background
    const grad = x.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#fff8e7');
    grad.addColorStop(1, '#ffeef8');
    x.fillStyle = grad;
    x.fillRect(0, 0, W, H);

    // border
    x.strokeStyle = '#feca57';
    x.lineWidth = 16;
    x.strokeRect(8, 8, W - 16, H - 16);

    // name
    x.fillStyle = '#4834d4';
    x.font = 'bold 52px "Segoe UI", sans-serif';
    x.textAlign = 'center';
    x.fillText(monster.name || 'Monster', W / 2, 90);

    // sticker
    const img = await loadImage(stickerDataUrl);
    const size = 520;
    const ratio = Math.min(size / img.width, size / img.height);
    const iw = img.width * ratio, ih = img.height * ratio;
    x.drawImage(img, (W - iw) / 2, 130 + (size - ih) / 2, iw, ih);

    // info
    x.textAlign = 'left';
    let y = 720;
    const drawSection = (label, value) => {
      x.fillStyle = '#c2186b';
      x.font = 'bold 28px "Segoe UI", sans-serif';
      x.fillText(label, 60, y);
      y += 40;
      x.fillStyle = '#2d2a4a';
      x.font = '30px "Segoe UI", sans-serif';
      for (const line of wrapText(x, value || '-', W - 120)) {
        x.fillText(line, 60, y);
        y += 40;
      }
      y += 18;
    };
    drawSection('⚡ Special Ability', monster.specialAbility);
    drawSection('💖 Personality', monster.personality);

    // footer
    x.fillStyle = '#8d86b8';
    x.font = 'italic 22px "Segoe UI", sans-serif';
    x.textAlign = 'center';
    x.fillText('Created by a Young Monster Designer ⭐', W / 2, H - 40);

    return c.toDataURL('image/png');
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    if (!stickerDataUrl) return;
    try {
      const dataUrl = await renderCardPNG();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${(monster && monster.name) || 'monster'}-card.png`;
      a.click();
      showToast('Card saved! 💾✨');
    } catch (err) {
      console.error(err);
      showToast('Save failed — try again!');
    }
  });

  document.getElementById('btn-print').addEventListener('click', () => window.print());

  // Flip the card image between front and back views
  document.getElementById('btn-flip').addEventListener('click', () => {
    if (!backStickerDataUrl) return;
    showingBack = !showingBack;
    document.getElementById('card-image').src = showingBack ? backStickerDataUrl : stickerDataUrl;
  });

  document.getElementById('btn-again').addEventListener('click', () => {
    clearCanvas();
    transcriptBox.value = '';
    baseTranscript = '';
    sessionFinal = '';
    monster = null;
    stickerDataUrl = null;
    backStickerDataUrl = null;
    showingBack = false;
    showScreen('create');
  });
})();
