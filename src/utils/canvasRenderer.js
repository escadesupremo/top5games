// Canvas renderer — 1080x1920 vertical share card.
// Filmstrip of 5 game cover screenshots (from RAWG) with accent red rank
// numerals, bottom-anchored titles, sprocket holes, TOP5.GAMES header,
// hero kicker + slogan + @handle, watermark + QR sigil, corner brackets,
// and a subtle scanline overlay.

const W = 1080;
const H = 1920;
const SPROCKET_H = 44;

const ACCENT = '#ff3355';
const BG = '#0a0a0c';
const FG = '#f3f3f5';

const DISPLAY = "'Archivo Black', 'Space Grotesk', system-ui, sans-serif";
const MONO    = "'JetBrains Mono', ui-monospace, monospace";

/* ------------------------------- utils ------------------------------- */

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('no src'));
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => reject(new Error('timeout')), 6000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('load failed')); };
    img.src = src;
  });
}

function platformOf(g) {
  const p = g.platforms?.[0]?.platform?.name || g.platforms?.[0]?.name;
  return p || 'MULTI';
}
function genreOf(g) {
  return g.genres?.[0]?.name || 'GAME';
}
function yearOf(g) {
  return g.released ? String(g.released).slice(0, 4) : '—';
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const ox = x + (w - sw) / 2;
  const oy = y + (h - sh) / 2;
  ctx.drawImage(img, ox, oy, sw, sh);
}

function drawFallbackTex(ctx, x, y, w, h, seedStr) {
  const seed = hashStr(String(seedStr || 'fallback'));
  const hue = seed % 360;
  const angle = (seed % 4) * 45 * Math.PI / 180;
  const bg1 = `hsl(${hue} 40% 12%)`;
  const bg2 = `hsl(${hue} 55% 22%)`;
  ctx.save();
  ctx.fillStyle = bg1;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  const len = Math.sqrt(w * w + h * h);
  const stripe = 36;
  ctx.fillStyle = bg2;
  for (let i = -len; i < len; i += stripe * 2) {
    ctx.fillRect(i, -len, stripe, len * 2);
  }
  ctx.restore();
}

function drawTint(ctx, y, h, isHero) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  if (isHero) {
    // lighter tint — let the hero cover read through, only darken bottom for title legibility
    grad.addColorStop(0,    'rgba(10,10,12,0.05)');
    grad.addColorStop(0.55, 'rgba(10,10,12,0.30)');
    grad.addColorStop(0.85, 'rgba(10,10,12,0.82)');
    grad.addColorStop(1,    'rgba(10,10,12,0.94)');
  } else {
    grad.addColorStop(0,    'rgba(10,10,12,0.25)');
    grad.addColorStop(0.55, 'rgba(10,10,12,0.65)');
    grad.addColorStop(0.80, 'rgba(10,10,12,0.88)');
    grad.addColorStop(1,    'rgba(10,10,12,0.94)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, W, h);
}

/**
 * Shrink the font size until the text fits inside maxWidth. Returns the
 * chosen size. Caller should set ctx.font before calling (we rewrite it).
 */
function fitFontSize(ctx, text, maxWidth, startSize, minSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`.trim();
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`.trim();
  }
  return size;
}

/**
 * Accent-bordered cover chip — small square showing the game's cover art
 * cleanly, distinct from the tinted strip background.
 */
function drawCoverChip(ctx, img, x, y, size) {
  ctx.save();
  // accent border
  const border = 3;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(x - border, y - border, size + border * 2, size + border * 2);
  // inner black fallback
  ctx.fillStyle = BG;
  ctx.fillRect(x, y, size, size);
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    const s = Math.max(size / img.width, size / img.height);
    const sw = img.width * s;
    const sh = img.height * s;
    ctx.drawImage(img, x + (size - sw) / 2, y + (size - sh) / 2, sw, sh);
    ctx.restore();
  }
  ctx.restore();
}

function drawRank(ctx, y, isHero, rank) {
  ctx.save();
  const size = isHero ? 340 : 200;
  ctx.font = `${size}px ${DISPLAY}`;
  ctx.fillStyle = ACCENT;
  ctx.shadowColor = 'rgba(255,51,85,0.5)';
  ctx.shadowBlur = 30;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(String(rank).padStart(2, '0'), 56, y + 48);
  ctx.restore();
}

function drawBadge(ctx, y) {
  ctx.save();
  const text = '★ #1 PICK';
  ctx.font = `700 18px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const padX = 14, padY = 8;
  const m = ctx.measureText(text);
  const w = Math.ceil(m.width + padX * 2);
  const h = 18 + padY * 2;
  const x = W - 56 - w;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(x, y + 52, w, h);
  ctx.fillStyle = BG;
  ctx.fillText(text, x + padX, y + 52 + padY);
  ctx.restore();
}

function drawTitle(ctx, y, h, isHero, g, rightReserve) {
  ctx.save();
  const padX = 56, padBottom = 36;
  const metaSize = isHero ? 24 : 20;
  const gap = 14;

  // meta (bottom)
  const metaText = `${yearOf(g)} · ${platformOf(g)} · ${genreOf(g)}`.toUpperCase();
  ctx.font = `${metaSize}px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${metaSize * 0.14}px`;
  ctx.fillStyle = 'rgba(243,243,245,0.75)';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  // meta is short enough that truncation is unlikely; shrink as a safety.
  const metaMaxW = W - padX * 2 - rightReserve;
  if (ctx.measureText(metaText).width > metaMaxW) {
    fitFontSize(ctx, metaText, metaMaxW, metaSize, 14, MONO);
  }
  ctx.fillText(metaText, padX, y + h - padBottom);

  // title (above meta) — scale font to fit instead of truncating.
  const titleStart = isHero ? 96 : 56;
  const titleMin   = isHero ? 52 : 30;
  const titleMaxW  = W - padX * 2 - rightReserve;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  fitFontSize(ctx, g.name, titleMaxW, titleStart, titleMin, DISPLAY);
  ctx.fillStyle = FG;
  ctx.fillText(g.name, padX, y + h - padBottom - metaSize - gap);

  ctx.restore();
}

function drawEmptyStrip(ctx, y, h, index) {
  ctx.save();
  ctx.fillStyle = '#141418';
  ctx.fillRect(0, y, W, h);
  // diagonal hatch
  ctx.beginPath();
  ctx.rect(0, y, W, h);
  ctx.clip();
  ctx.fillStyle = '#1b1b22';
  const stripe = 44;
  ctx.translate(W / 2, y + h / 2);
  ctx.rotate(Math.PI / 4);
  const len = Math.sqrt(W * W + h * h);
  for (let i = -len; i < len; i += stripe * 2) {
    ctx.fillRect(i, -len, stripe, len * 2);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(243,243,245,0.4)';
  ctx.font = `32px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3.8px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`// EMPTY SLOT ${index + 1}`, W / 2, y + h / 2);
  ctx.restore();
}

function drawSprockets(ctx, y) {
  ctx.save();
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, y, W, SPROCKET_H);
  ctx.strokeStyle = '#1a1a20';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5);
  ctx.moveTo(0, y + SPROCKET_H - 0.5); ctx.lineTo(W, y + SPROCKET_H - 0.5);
  ctx.stroke();

  const count = 9;
  const padSide = 32;
  const cellW = (W - padSide * 2) / count;
  const hw = 40, hh = 18;
  for (let i = 0; i < count; i++) {
    const cx = padSide + cellW * i + cellW / 2;
    ctx.fillStyle = BG;
    ctx.fillRect(cx - hw / 2, y + (SPROCKET_H - hh) / 2, hw, hh);
    ctx.strokeStyle = '#22222a';
    ctx.strokeRect(cx - hw / 2 + 0.5, y + (SPROCKET_H - hh) / 2 + 0.5, hw - 1, hh - 1);
  }
  ctx.restore();
}

function drawHeader(ctx) {
  ctx.save();
  const baselineY = SPROCKET_H + 36 + 12;

  // triangle mark
  const triW = 28, triH = 24;
  const triX = 56;
  const triY = baselineY - triH;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.moveTo(triX, triY + triH);
  ctx.lineTo(triX + triW / 2, triY);
  ctx.lineTo(triX + triW, triY + triH);
  ctx.closePath();
  ctx.fill();

  // wordmark — "TOP5.GAMES" with accent 5
  ctx.font = `36px ${DISPLAY}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let cx = triX + triW + 16;
  ctx.fillStyle = '#fff';
  ctx.fillText('TOP', cx, baselineY);
  cx += ctx.measureText('TOP').width;
  ctx.fillStyle = ACCENT;
  ctx.fillText('5', cx, baselineY);
  cx += ctx.measureText('5').width;
  ctx.fillStyle = '#fff';
  ctx.fillText('.GAMES', cx, baselineY);

  // date (right)
  const dateStr = new Date().toISOString().slice(0, 10);
  ctx.font = `18px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
  ctx.fillStyle = 'rgba(243,243,245,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 56, baselineY - 4);
  ctx.restore();
}

function drawHero(ctx, username) {
  ctx.save();
  const padX = 56;
  let y = 150;

  // kicker
  ctx.font = `22px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5.28px';
  ctx.fillStyle = 'rgba(243,243,245,0.85)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('// MY TOP 5 GAMES OF ALL TIME', padX, y);
  y += 22 + 14;

  // slogan — wrap lines first, then shrink the font if any line still overflows.
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff';
  const slogan = 'THE LIST. NO APOLOGIES.';
  const maxW = 820;
  let sloganSize = 72;
  const words = slogan.split(' ');
  const layout = (size) => {
    ctx.font = `${size}px ${DISPLAY}`;
    const out = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
    return out;
  };
  let lines = layout(sloganSize);
  while (
    sloganSize > 44 &&
    lines.some((ln) => {
      ctx.font = `${sloganSize}px ${DISPLAY}`;
      return ctx.measureText(ln).width > maxW;
    })
  ) {
    sloganSize -= 2;
    lines = layout(sloganSize);
  }
  ctx.font = `${sloganSize}px ${DISPLAY}`;
  const lineH = sloganSize * 0.95;
  for (const ln of lines) {
    ctx.fillText(ln, padX, y);
    y += lineH;
  }
  y += 10;

  // handle + avatar
  const handle = (username || 'your_handle').replace(/^@/, '');
  const avSize = 44;
  // avatar circle
  ctx.fillStyle = `hsl(${hashStr(handle) % 360} 65% 45%)`;
  ctx.beginPath();
  ctx.arc(padX + avSize / 2, y + avSize / 2, avSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  // initials
  ctx.fillStyle = BG;
  ctx.font = `16px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initials = (handle || '?').slice(0, 2).toUpperCase();
  ctx.fillText(initials, padX + avSize / 2, y + avSize / 2 + 1);
  // handle text
  ctx.fillStyle = '#fff';
  ctx.font = `22px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3.08px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('@' + handle, padX + avSize + 14, y + avSize / 2);

  ctx.restore();
}

function drawQR(ctx, x, y, size, seed) {
  ctx.save();
  const n = 9;
  const gap = 3;
  const cellSize = Math.floor((size - gap * (n - 1)) / n);
  const totalSize = n * cellSize + (n - 1) * gap;
  const ox = x + (size - totalSize) / 2;
  const oy = y + (size - totalSize) / 2;

  // random cells, mirrored
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < Math.ceil(n / 2); c++) {
      const bit = (hashStr(`${seed}|${r}|${c}`) >> 2) & 1;
      const cxl = ox + c * (cellSize + gap);
      const cxr = ox + (n - 1 - c) * (cellSize + gap);
      const cy  = oy + r * (cellSize + gap);
      ctx.fillStyle = bit ? FG : 'rgba(243,243,245,0.08)';
      ctx.fillRect(cxl, cy, cellSize, cellSize);
      if (c !== n - 1 - c) ctx.fillRect(cxr, cy, cellSize, cellSize);
    }
  }
  // three finder markers (TL, TR, BL)
  const drawMarker = (mx, my) => {
    const mSize = 3 * cellSize + 2 * gap;
    ctx.fillStyle = FG;
    ctx.fillRect(mx, my, mSize, mSize);
    ctx.fillStyle = BG;
    ctx.fillRect(mx + cellSize + gap, my + cellSize + gap, cellSize + gap * 0 + cellSize, cellSize + gap * 0 + cellSize);
    ctx.fillStyle = FG;
    ctx.fillRect(mx + 2 * (cellSize + gap), my + 2 * (cellSize + gap), cellSize, cellSize);
  };
  drawMarker(ox, oy);
  drawMarker(ox + (n - 3) * (cellSize + gap), oy);
  drawMarker(ox, oy + (n - 3) * (cellSize + gap));
  ctx.restore();
}

function drawFooter(ctx, username, selectedGames) {
  ctx.save();
  const padX = 56;
  const footY = H - 60;

  // QR box on the right (compute first so watermark can avoid it)
  const qrSize = 150;
  const qrPad = 14;
  const qrBoxW = qrSize + qrPad * 2;
  const qrBoxH = qrSize + qrPad + 10;
  const qrBoxX = W - padX - qrBoxW;
  const qrBoxY = footY - qrBoxH + 6;
  ctx.fillStyle = BG;
  ctx.fillRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ACCENT;
  ctx.strokeRect(qrBoxX + 1, qrBoxY + 1, qrBoxW - 2, qrBoxH - 2);

  const qrSeed = (username || 'anon') + '|' + selectedGames.map((g) => g?.id || '_').join('|');
  drawQR(ctx, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSeed);

  // QR caption
  ctx.fillStyle = 'rgba(243,243,245,0.7)';
  ctx.font = `14px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SCAN · RANK YOURS', qrBoxX + qrBoxW / 2, qrBoxY + qrBoxH + 10);

  // watermark (left)
  ctx.font = `20px ${MONO}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4.4px';
  ctx.fillStyle = 'rgba(243,243,245,0.7)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('VOTE · DEFEND · RANK', padX, footY - 56 - 6);

  ctx.font = `56px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = ACCENT;
  ctx.fillText('top5.games', padX, footY);

  ctx.restore();
}

function drawCorners(ctx) {
  ctx.save();
  const inset = 56;
  const armLen = 40;
  const thick = 3;
  ctx.fillStyle = ACCENT;
  // TL
  ctx.fillRect(inset, inset, armLen, thick);
  ctx.fillRect(inset, inset, thick, armLen);
  // TR
  ctx.fillRect(W - inset - armLen, inset, armLen, thick);
  ctx.fillRect(W - inset - thick, inset, thick, armLen);
  // BL
  ctx.fillRect(inset, H - inset - thick, armLen, thick);
  ctx.fillRect(inset, H - inset - armLen, thick, armLen);
  // BR
  ctx.fillRect(W - inset - armLen, H - inset - thick, armLen, thick);
  ctx.fillRect(W - inset - thick, H - inset - armLen, thick, armLen);
  ctx.restore();
}

function drawScanlines(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }
  ctx.restore();
}

/* ------------------------------ main ------------------------------ */

export const generateTop5Image = async (selectedGames, _theme, username, _showUsernameInImage, cachedImages) => {
  // Wait for Google Fonts to be ready so canvas text uses the right faces.
  try { await document.fonts.ready; } catch (_) { /* noop */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // base fill
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // 5-strip grid inside sprocket area (hero is 2.2x)
  const innerTop = SPROCKET_H;
  const innerH = H - SPROCKET_H * 2;
  const ratios = [2.2, 1, 1, 1, 1];
  const total = ratios.reduce((a, b) => a + b, 0);
  const heights = ratios.map((r) => Math.round((innerH * r) / total));
  heights[0] += innerH - heights.reduce((a, b) => a + b, 0); // fix rounding drift

  // Preload cover images in parallel so draw order is deterministic.
  const covers = await Promise.all(
    Array.from({ length: 5 }).map(async (_, i) => {
      const g = selectedGames[i];
      if (!g) return null;
      const src = cachedImages[g.id] || g.background_image;
      if (!src) return null;
      try { return await loadImage(src); } catch { return null; }
    })
  );

  // draw strips
  let y = innerTop;
  for (let i = 0; i < 5; i++) {
    const g = selectedGames[i];
    const h = heights[i];
    const isHero = i === 0;

    if (g) {
      if (covers[i]) drawCover(ctx, covers[i], 0, y, W, h);
      else drawFallbackTex(ctx, 0, y, W, h, g.id || String(i));

      drawTint(ctx, y, h, isHero);

      // Cover chip — un-tinted, accent-bordered thumbnail of the cover.
      // Hero strip uses the full bg as its cover already, so skip there.
      const chipSize = 200;
      const chipInset = 56;
      let rightReserve = 0;
      if (!isHero) {
        const chipX = W - chipInset - chipSize;
        const chipY = y + Math.round((h - chipSize) / 2);
        drawCoverChip(ctx, covers[i], chipX, chipY, chipSize);
        rightReserve = chipSize + 40; // chip width + gutter for text
      }

      drawRank(ctx, y, isHero, i + 1);
      if (isHero) drawBadge(ctx, y);
      drawTitle(ctx, y, h, isHero, g, rightReserve);
    } else {
      drawEmptyStrip(ctx, y, h, i);
    }

    // 2px black separator between strips (matches the reference film-cut)
    ctx.fillStyle = BG;
    ctx.fillRect(0, y + h - 2, W, 2);
    y += h;
  }

  // sprockets
  drawSprockets(ctx, 0);
  drawSprockets(ctx, H - SPROCKET_H);

  // overlay layers
  drawHeader(ctx);
  drawHero(ctx, username);
  drawFooter(ctx, username, selectedGames);
  drawCorners(ctx);
  drawScanlines(ctx);

  return canvas.toDataURL('image/png');
};
