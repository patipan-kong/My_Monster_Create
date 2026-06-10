# CLAUDE.MD

## Project: My Monster Creator

เด็กสร้างมอนสเตอร์จากจินตนาการด้วยการวาดรูปและ/หรือเล่าเรื่อง จากนั้น AI จะสร้างมอนสเตอร์สไตล์เกมสะสมมอนสเตอร์เป็น PNG Sticker พร้อมการ์ดสะสมที่สามารถบันทึกหรือพิมพ์กลับบ้านได้

---

## Goal

สร้าง Interactive Demo สำหรับเด็กอายุประมาณ 5–12 ปี โดยใช้ AI เป็น "ผู้ช่วยแปลงจินตนาการให้เป็นภาพ"

ประสบการณ์ใช้งานควรใช้เวลาไม่เกิน 1–2 นาทีต่อคน

Flow ต้องเรียบง่าย สนุก และไม่ต้องมีการพิมพ์ข้อความ

---

## User Flow

1. หน้าเริ่มต้น

   * แสดงข้อความ "สร้างมอนสเตอร์ในจินตนาการของคุณ"
   * ปุ่ม Start

2. สร้างไอเดียมอนสเตอร์
   ผู้ใช้เลือกได้อิสระ

   Option A

   * วาดรูปบน Canvas

   Option B

   * กดปุ่มไมโครโฟนและเล่าเกี่ยวกับมอนสเตอร์

   Option C

   * ใช้ทั้งการวาดและการพูดร่วมกัน

3. AI วิเคราะห์

   * แปลงเสียงเป็นข้อความด้วย Web Speech API
   * ส่งภาพวาดและข้อความไปยัง Gemini 2.5 Flash Lite
   * Flash Lite สรุปลักษณะมอนสเตอร์เป็น Structured Prompt

4. Generate Monster

   * ส่ง Prompt ไปยัง Image Generation Model
   * ได้ภาพมอนสเตอร์ PNG Sticker

5. Result Screen
   แสดง

   * มอนสเตอร์
   * ชื่อมอนสเตอร์
   * ความสามารถพิเศษ
   * คำอธิบายสั้น ๆ

6. Save / Print

   * Save PNG
   * Print Monster Card

---

## Design Principles

* เด็กที่วาดรูปไม่เก่งก็เล่นได้
* เด็กที่ไม่กล้าพูดก็เล่นได้
* ไม่มีคำตอบผิด
* ใช้เวลาสั้น
* UI ต้องกดง่ายด้วยนิ้ว
* อ่านออกหรือไม่อ่านออกก็ใช้งานได้

---

## Tech Stack

Frontend

* HTML
* CSS
* Vanilla JavaScript

Browser APIs

* Canvas API
* Web Speech API
* MediaDevices (optional future use)

AI

* Gemini 2.5 Flash Lite
* Image Generation API

Output

* PNG Sticker
* Printable Monster Card

Deployment

* Vercel

---

## Architecture

Canvas Drawing
+
Speech Recognition
↓
Normalize Inputs
↓
Gemini 2.5 Flash Lite
(Extract Monster Features)
↓
Structured JSON
↓
Image Generation API
↓
Transparent PNG
↓
Monster Card Renderer
↓
Save / Print

---

## Gemini Flash Lite Responsibilities

Flash Lite should NOT generate images.

Flash Lite is responsible for:

* Understanding children's speech.
* Understanding rough sketches.
* Combining multiple inputs.
* Extracting monster attributes.
* Producing safe prompts.

Expected output:

{
"name": "",
"appearance": "",
"colors": [],
"specialAbility": "",
"personality": "",
"prompt": ""
}

---

## Flash Lite Prompt

You are helping children turn their imagination into original fantasy monsters.

Input may include:

* A child's drawing.
* A speech transcript.
* Both.

Your tasks:

1. Understand the child's intent.
2. Infer missing details creatively.
3. Keep the result suitable for children.
4. Avoid copyrighted characters.
5. Produce a concise structured JSON response.

Return JSON only.

---

## Image Generation Prompt Rules

Generate an ORIGINAL fantasy monster inspired by children's imagination.

Requirements:

* Cute and friendly.
* Suitable for ages 5–12.
* Bright colors.
* Sticker style.
* Transparent background.
* Full body visible.
* High visual clarity.
* No copyrighted characters.
* No text.
* PNG output.

---

## Monster Card Layout

Top

* Monster Name

Center

* PNG Sticker

Bottom

* Special Ability
* Personality Description

Footer

* "Created by [Child Name]"
  or
* "Created by a Young Monster Designer"

Optional:

* QR Code linking to downloaded image.

---

## Future Extensions

Phase 2

* Animated idle monster.
* Monster evolution.
* Random habitat backgrounds.

Phase 3

* Phaser 3 integration.
* Monster battle mini game.
* Collectible monster gallery.
* Save to local leaderboard.

Phase 4

* AR monster appearance.
* Voice interaction with monster.
* Multiplayer monster exhibition.

---

## Constraints

* Entire demo should run within approximately 60–90 seconds.
* Keep API costs low.
* Minimize latency.
* Prioritize responsiveness over perfect image fidelity.
* Ensure generated content remains child-friendly.

---

## Success Criteria

A successful experience means:

* The child smiles when seeing the monster.
* The child recognizes elements from their own imagination.
* The child wants to create another monster.
* Parents want to save or print the card.
* The full experience feels magical but understandable.
