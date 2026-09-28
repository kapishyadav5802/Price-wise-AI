#!/usr/bin/env node
/*
 * text.js — renders transparent PNG text/graphic overlays for the BGMI scrims ad.
 * Skia (via @napi-rs/canvas) gives us real font shaping, so Devanagari renders correctly.
 *
 * Usage: node text.js <spec.json> [outDir]
 * Spec:  { "layers": [ { "id": "hook", "w": 1080, "h": 1920, "elements": [ ... ] } ] }
 */
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');

const FONT_DIR = path.join(__dirname, '..', 'fonts');
const registered = [];
for (const f of fs.readdirSync(FONT_DIR).sort()) {
  if (!f.toLowerCase().endsWith('.ttf')) continue;
  try {
    GlobalFonts.registerFromPath(path.join(FONT_DIR, f), null);
    registered.push(f);
  } catch (e) {
    console.error('  ! could not register', f, e.message);
  }
}
console.error(`fonts registered: ${registered.length}`);

const specPath = process.argv[2];
if (!specPath) {
  console.error('usage: node text.js <spec.json> [outDir]');
  process.exit(1);
}
const LINT = [];
let layerId = '?';
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const outDir = process.argv[3] || path.join(__dirname, '..', 'assets', 'tx');
fs.mkdirSync(outDir, { recursive: true });

/* ---------- helpers ---------- */
function fillStyle(ctx, el, x, y, w, h) {
  if (!el.gradient) return el.color || '#ffffff';
  const g = el.gradient;
  let grad;
  if (g.type === 'radial') {
    grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) / 2);
  } else {
    const a = ((g.angle ?? 90) * Math.PI) / 180;
    const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2;
    grad = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r,
                                    cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  for (const [pos, col] of g.stops) grad.addColorStop(pos, col);
  return grad;
}

function fontString(el, size) {
  const weight = el.weight || 400;
  const family = el.font || 'Anton';
  const style = el.italic ? 'italic ' : '';
  return `${style}${weight} ${size}px "${family}"`;
}

/* Shrink the type until the text renders on a single line inside maxWidth.
   Wrap-aware: it re-runs the real word-wrap at each candidate size, so the
   result matches what actually gets drawn. */
function fitSize(ctx, el, size) {
  if (el.fit !== 'shrink' || !el.maxWidth) return size;
  const min = el.minSize || 24;
  const overflows = (candidate) => {
    ctx.font = fontString(el, candidate);
    const lines = layoutLines(ctx, el);
    if (lines.length > 1) return true;
    return ctx.measureText(lines[0] || '').width > el.maxWidth;
  };
  let s = size, guard = 0;
  while (s > min && overflows(s) && guard++ < 200) s -= 1;
  return s;
}

function layoutLines(ctx, el) {
  const raw = String(el.text ?? '');
  const transformed = el.uppercase === false ? raw : raw.toUpperCase();
  const paragraphs = transformed.split('\n');
  const maxW = el.maxWidth || 0;
  const out = [];
  for (const p of paragraphs) {
    if (!maxW) { out.push(p); continue; }
    const words = p.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

function roundedPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/* ---------- element renderers ---------- */
function drawText(ctx, el) {
  // letter-spacing widens rendered text, so set it before we measure for auto-fit
  try { if ('letterSpacing' in ctx) ctx.letterSpacing = `${el.letterSpacing || 0}px`; } catch (_) {}
  const size = fitSize(ctx, el, el.size || 100);
  if (size !== (el.size || 100)) LINT.push(`fit  ${(el.text || '').slice(0, 28)}  ${el.size}->${size}px`);
  ctx.font = fontString(el, size);
  if (el.maxWidth) {
    const lines = layoutLines(ctx, el);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length > 1 || w > el.maxWidth) {
      LINT.push(`WRAP ${layerId}/${(el.text || '').slice(0, 30)} -> ${lines.length} line(s), ${w.toFixed(0)}px vs ${el.maxWidth}px`);
    }
  }
  const lines = layoutLines(ctx, el);
  const lineH = size * (el.lineHeight || 1.12);
  const boxH = lineH * lines.length;
  const widths = lines.map((l) => ctx.measureText(l).width);
  const boxW = Math.max(...widths, 1);
  const align = el.align || 'center';
  const anchorX = el.x ?? ctx.canvas.width / 2;
  let leftX = anchorX - boxW / 2;
  if (align === 'left') leftX = anchorX;
  if (align === 'right') leftX = anchorX - boxW;

  ctx.save();
  if (el.opacity != null) ctx.globalAlpha = el.opacity;
  if (el.rotate) {
    ctx.translate(anchorX, (el.y ?? 0) + boxH / 2);
    ctx.rotate((el.rotate * Math.PI) / 180);
    ctx.translate(-anchorX, -((el.y ?? 0) + boxH / 2));
  }

  // optional plate / pill behind the text block
  if (el.plate) {
    const padX = el.plate.padX ?? 36, padY = el.plate.padY ?? 18;
    const px = leftX - padX, py = (el.y ?? 0) - padY;
    const pw = boxW + padX * 2, ph = boxH + padY * 2;
    ctx.save();
    if (el.plate.shadow) {
      ctx.shadowColor = el.plate.shadow.color || 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = el.plate.shadow.blur ?? 30;
      ctx.shadowOffsetY = el.plate.shadow.y ?? 0;
    }
    roundedPath(ctx, px, py, pw, ph, el.plate.radius ?? 16);
    ctx.fillStyle = fillStyle(ctx, el.plate, px, py, pw, ph);
    ctx.fill();
    if (el.plate.stroke) {
      ctx.lineWidth = el.plate.stroke.width ?? 3;
      ctx.strokeStyle = el.plate.stroke.color || '#fff';
      ctx.stroke();
    }
    ctx.restore();
  }

  const baselineFirst = (el.y ?? 0) + size * 0.82;
  lines.forEach((line, i) => {
    let x = anchorX;
    if (align === 'left') x = leftX;
    if (align === 'right') x = leftX + boxW;
    const y = baselineFirst + i * lineH;
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    if (el.shadow) {
      ctx.shadowColor = el.shadow.color || 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = el.shadow.blur ?? 24;
      ctx.shadowOffsetX = el.shadow.x ?? 0;
      ctx.shadowOffsetY = el.shadow.y ?? 6;
    }
    if (el.glow) {
      ctx.save();
      ctx.shadowColor = el.glow.color || '#ffcc00';
      ctx.shadowBlur = el.glow.blur ?? 60;
      ctx.fillStyle = fillStyle(ctx, el, x - boxW / 2, y - size, boxW, size);
      for (let g = 0; g < (el.glow.passes ?? 2); g++) ctx.fillText(line, x, y);
      ctx.restore();
    }
    if (el.stroke) {
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = (el.stroke.width ?? 8) * 2; // stroke is centred, double inside fill
      ctx.strokeStyle = el.stroke.color || '#000';
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = fillStyle(ctx, el, x - boxW / 2, y - size, boxW, size);
    ctx.fillText(line, x, y);
    ctx.restore();
  });
  ctx.restore();
}

function drawRect(ctx, el) {
  ctx.save();
  if (el.opacity != null) ctx.globalAlpha = el.opacity;
  if (el.shadow) {
    ctx.shadowColor = el.shadow.color;
    ctx.shadowBlur = el.shadow.blur ?? 30;
    ctx.shadowOffsetY = el.shadow.y ?? 0;
  }
  roundedPath(ctx, el.x, el.y, el.w, el.h, el.radius || 0);
  if (el.color || el.gradient) {
    ctx.fillStyle = fillStyle(ctx, el, el.x, el.y, el.w, el.h);
    ctx.fill();
  }
  if (el.stroke) {
    ctx.lineWidth = el.stroke.width ?? 3;
    ctx.strokeStyle = el.stroke.color || '#fff';
    ctx.stroke();
  }
  ctx.restore();
}

function drawImage(ctx, el) {
  const base = path.join(__dirname, '..', 'assets');
  const src = path.isAbsolute(el.src) ? el.src : path.join(base, el.src);
  if (!fs.existsSync(src)) { console.error('  ! image not found:', src); return; }
  const img = loadImage(src);
  const w = el.w || img.width, h = el.h || img.height;
  ctx.save();
  if (el.opacity != null) ctx.globalAlpha = el.opacity;
  if (el.radius != null) { roundedPath(ctx, el.x, el.y, w, h, el.radius); ctx.clip(); }
  ctx.drawImage(img, el.x, el.y, w, h);
  ctx.restore();
}

function drawScrim(ctx, el) {
  const x = el.x ?? 0, y = el.y ?? 0;
  const w = el.w ?? ctx.canvas.width, h = el.h ?? ctx.canvas.height;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  const stops = el.stops || [[0, "rgba(4,8,16,0)"], [0.14, "rgba(4,8,16,0.55)"],
                             [0.86, "rgba(4,8,16,0.55)"], [1, "rgba(4,8,16,0)"]];
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawBrackets(ctx, el) {
  const { x, y, w, h, color = '#22d3ee', len = 70, width = 8 } = el;
  ctx.save();
  if (el.opacity != null) ctx.globalAlpha = el.opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  const corners = [
    [x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * len, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBar(ctx, el) {
  const { x, y, w, h = 6, color = '#f59e0b' } = el;
  ctx.save();
  if (el.opacity != null) ctx.globalAlpha = el.opacity;
  const g = el.gradient2
    ? fillStyle(ctx, { gradient: el.gradient2 }, x, y, w, h)
    : color;
  ctx.fillStyle = g;
  roundedPath(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- main ---------- */
for (const layer of spec.layers) {
  layerId = layer.id;
  const w = layer.w || 1080, h = layer.h || 1920;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  for (const el of layer.elements) {
    switch (el.type) {
      case 'text': drawText(ctx, el); break;
      case 'rect': drawRect(ctx, el); break;
      case 'image': drawImage(ctx, el); break;
      case 'scrim': drawScrim(ctx, el); break;
      case 'brackets': drawBrackets(ctx, el); break;
      case 'bar': drawBar(ctx, el); break;
      default: console.error('  ! unknown element type', el.type);
    }
  }
  const out = path.join(outDir, `${layer.id}.png`);
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log(`rendered ${out}`);
}

if (LINT.length) {
  console.log('\nlayout report:');
  for (const l of LINT) console.log('  ' + l);
} else {
  console.log('\nlayout report: all text fits its maxWidth on one line');
}
