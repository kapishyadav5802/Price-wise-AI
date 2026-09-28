# BGMI Scrims — 30s vertical video ad

A ready-to-post ad for **BGMI custom-room scrims**: 1080×1920, 30 fps, 30 s, Hindi voiceover,
synthesised royalty-free music bed, and swap-in placeholders for your own org details.

## The ad

| | |
|---|---|
| **Master** | `out/bgmi_scrims_ad_1080x1920.mp4` — 30 s, 1080×1920 (9:16), H.264 + AAC, −14 LUFS |
| **Teaser** | `out/bgmi_scrims_teaser_6s.mp4` — 6.5 s cut for statuses / pre-roll |
| **Thumbnails** | `out/thumbnail_hook.jpg`, `out/thumbnail_chicken_dinner.jpg`, `out/thumbnail_endcard.jpg` |
| **Runtime** | 29.97 s — 8 scenes, punchy 0.35 s cross-fades |

### Storyboard

| # | Time | Visual | On-screen | Voiceover (Hindi) |
|---|------|--------|-----------|-------------------|
| 1 | 0.0–3.5 | squad at golden hour | **BGMI SCRIMS**, आज रात…, स्क्वाड तैयार है? | स्क्वाड तैयार है? बीजीएमआई स्क्रिम्स शुरू होने वाले हैं! |
| 2 | 3.5–7.2 | night airdrop | रोज़ाना स्क्रिम्स + feature list | कस्टम रूम्स, असली कॉम्पिटिशन, और शानदार प्राइज़ पूल! |
| 3 | 7.2–11.3 | esports arena | असली कॉम्पिटिशन · प्राइज़ पूल | — |
| 4 | 11.3–15.1 | HUD panel | TIMING / ENTRY FEE / RULES cards | टाइमिंग, एंट्री फीस और सारे रूल्स — सब कुछ डिस्कॉर्ड पर। |
| 5 | 15.1–19.6 | prize burst | जीतो और कमाओ · डेली प्राइज़ पूल | — |
| 6 | 19.6–24.0 | chicken dinner | चिकन डिनर — अपने नाम करो | स्क्वाड बना, स्लॉट बुक कर, और चिकन डिनर अपने नाम कर! |
| 7 | 24.0–28.3 | close-up soldier | कैसे जॉइन करें? (3 steps + QR + link) | जॉइन करने के लिए डिस्कॉर्ड लिंक ओपन करो, स्क्वाड बनाओ और स्लॉट बुक करो। |
| 8 | 28.3–30.0 | end card | [YOUR ORG NAME] · जॉइन करो आज ही · link | जॉइन करो आज ही — लेट्स गो! |

## Put your own details in

All placeholders live in **`specs/content.json`** — nothing else needs editing:

```json
{
  "org": "[YOUR ORG NAME]",
  "time": "[TIME]",
  "entry": "[₹ ___]",
  "prize": "[₹ PRIZE POOL]",
  "rules": "[RULES]",
  "link": "[DISCORD LINK]",
  "handle": "@YOUR_HANDLE"
}
```

```bash
# 1. edit specs/content.json  (e.g. "org": "DELTA ESPORTS", "time": "रोज़ रात 8:00 बजे")
python3 tools/build_ad.py --overlays-only   # ~2 s: re-draw the text, check the layout report
python3 tools/build_ad.py                   # ~3 min: full rebuild of the mp4
```

`text.js` prints a **layout report** — text that had to be shrunk (or would wrap) is listed,
so you can see at a glance that a long org name still fits inside the frame.

### Things you can drop in

| To change… | Do this |
|---|---|
| **QR code** | save it as `assets/qr.png` — the next build replaces the `[QR CODE]` placeholder automatically |
| **Music** | replace `audio/bgm.wav` with your own track (it is ducked under the voice automatically) |
| **Voiceover** | replace `audio/vo*.mp3` and adjust the start times in `VO_TAKES` (`tools/build_ad.py`) |
| **Scene artwork** | swap `assets/0*.png` (any 9:16 image) |
| **Copy / layout** | `specs/scenes.json` — one layer per scene, elements are `text`, `rect`, `bar`, `brackets`, `scrim`, `image` |
| **Cut timings** | `SCENES` + `TRANSITIONS` in `tools/build_ad.py` (keep `sum(durations) − 0.35×7 = runtime`) |

## Rebuilding from scratch

```bash
pip install --break-system-packages imageio-ffmpeg numpy scipy pillow fonttools
npm install --prefix tools @napi-rs/canvas      # Skia — shapes Devanagari correctly

python3 tools/bgm.py            # regenerate the music bed (30 s)
python3 tools/build_ad.py       # render everything -> out/
```

Useful flags: `--overlays-only` (text only), `--skip-overlays`, `--skip-video`, `--video-only`.

## How it is built

```
specs/content.json ─┐
specs/scenes.json  ─┴─> tools/text.js (Skia)  ─> assets/tx/s*.png ─┐
                                                                   ├─> tools/build_ad.py ─> out/*.mp4
assets/0*.png (AI artwork) ──────────────────────────────────────┘
audio/vo*.mp3 (Hindi VO) + audio/bgm.wav (synthesised) ─> side-chain duck ─> loudnorm −14 LUFS
```

- **Text is rendered as PNG overlays, not with `drawtext`.** Two reasons: the bundled ffmpeg build
  has no `drawtext`, and Skia gives real font shaping — so Devanagari conjuncts and matras render
  correctly (ffmpeg's own renderer has no HarfBuzz, which produces broken Hindi).
- **Music is 100% synthesised** in `tools/bgm.py` (140 BPM trap-electro: kick/clap/hats, sub bass,
  pads, arp, risers, impacts and whooshes placed on the cut points) — no samples, no licensing.
- **The voice sits on top of the bed** via `sidechaincompress`, so the music ducks ~5 dB under the VO.
- **Colour + motion**: per-scene Ken Burns zoom (in/out), subtle handheld shake on the two hero shots,
  saturation/contrast grade, vignette and light film grain.
- **Delivery**: H.264 High, CRF 17, `+faststart`, AAC 192 kbps, two-pass loudness normalisation to
  **−14 LUFS / −1.5 dBTP** (the Instagram/YouTube short-form standard).
- **Safe zones**: all text stays inside x 70–1010 and above y 1470–1530, clear of the Reels/Shorts
  UI captions, like/share rail and the bottom CTA bar.

## Layout

```
ad/
├── out/          final mp4s + thumbnails        (deliverables)
├── audio/        vo1..vo6.mp3 (Hindi VO) + bgm.wav
├── assets/       0*.png artwork, tx/ text overlays, sheets/ contact sheets
├── fonts/        Anton, Bebas Neue, Montserrat, Teko, Rajdhani, Noto Sans Devanagari
├── specs/        content.json (your details) + scenes.json (layout)
└── tools/        text.js · bgm.py · build_ad.py
```

> Note: the artwork is AI-generated cinematic key art (no third-party game assets are used).
> BGMI is a trademark of its respective owner — add your own official brand assets if you have
> permission to use them.
