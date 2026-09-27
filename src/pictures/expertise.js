const K = {
  win: '#FBFAF7', win2: '#F1F0EB', line: '#E3E2DD', mute: '#DAD9D3',
  ink: '#1B1B19', ink2: '#3A3A37', ink3: '#77766F',
  oxide: '#9C3712', oxideHi: '#E07A4F', wash: '#F0E4DC',
  night: '#252421', nightTop: '#1D1C1A', nightNode: '#34332F', nightEdge: '#5E5D57',
  nightLine: '#3E3D38', nightInk: '#EDECE6', nightInk2: '#A7A69E',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function T(x, y, s, o = {}) {
  const a = [`x="${x}"`, `y="${y}"`, `font-size="${o.size ?? 11}"`, `fill="${o.fill ?? K.ink}"`];
  if (o.cls) a.push(`class="${o.cls}"`);
  if (o.w) a.push(`font-weight="${o.w}"`);
  if (o.a) a.push(`text-anchor="${o.a}"`);
  if (o.ls) a.push(`letter-spacing="${o.ls}"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
const R = (x, y, w, h, fill, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o.r ? ` rx="${o.r}"` : ''} fill="${fill}"` +
  `${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"` : ''}/>`;
const bar = (x, y, w, fill = K.mute, h = 6) => R(x, y, w, h, fill, { r: h / 2 });
const shadow = (id) =>
  `<filter id="${id}-sh" x="-20%" y="-20%" width="140%" height="160%">` +
  `<feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#141311" flood-opacity=".34"/></filter>`;

function frame(id, { x, y, w, h, dark = false, title = '', mono = false, r = 10, bh = 26 }) {
  const top = dark ? K.nightTop : K.win2;
  const dot = dark ? '#4A4944' : '#CFCEC8';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${dark ? K.night : K.win}" filter="url(#${id}-sh)"/>` +
    `<path d="M${x} ${y + bh}V${y + r}a${r} ${r} 0 0 1 ${r}-${r}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + bh}Z" fill="${top}"/>` +
    `<path d="M${x} ${y + bh + 0.5}H${x + w}" stroke="${dark ? K.nightLine : K.line}"/>` +
    [14, 25, 36].map((d) => `<circle cx="${x + d}" cy="${y + bh / 2}" r="3.1" fill="${dot}"/>`).join('') +
    (title ? T(x + 50, y + bh / 2 + 3.5, title, { size: 10, fill: dark ? K.nightInk2 : K.ink3, cls: mono ? 'm' : '' }) : '');
}

function mark(page, label, x, y, size, fill) {
  const m = page.match(new RegExp(`aria-label="${label}"><svg class="br"[^>]*viewBox="([^"]+)"[^>]*>([\\s\\S]*?)</svg>`));
  if (!m) throw new Error(`expertise pictures: no "${label}" mark in home.html`);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${m[1]}" fill="${fill}">${m[2]}</svg>`;
}

const INVOICE = {
  name: 'Invoice Extraction & Validation Core',
  nodes: [ // name, kind, x, y — as exported
    ['Receive From Intake', 'trigger', 240, 440],
    ['Extract Invoice Fields', 'llm', 460, 340],
    ['Extraction Model', 'model', 400, 580],
    ['Invoice Schema (Locked)', 'parser', 580, 580],
    ['Flatten Extraction Output', 'code', 680, 340],
    ['Validate Arithmetic', 'code', 900, 340],
    ['Arithmetic OK?', 'if', 1120, 340],
    ['Log Arithmetic Exception', 'sheets', 1340, 560],
    ['Notify AP — Arithmetic Mismatch', 'slack', 1560, 560],
    ['Call PO Matching', 'exec', 1340, 180],
    ['Matched And Auto-Approved?', 'if', 1560, 180],
    ['Send To Posting (Auto)', 'exec', 1780, 80],
    ['Send To Approval Queue', 'exec', 1780, 300],
  ],
  main: [ // from, to, output (0 = true / only, 1 = false)
    ['Receive From Intake', 'Extract Invoice Fields', 0],
    ['Extract Invoice Fields', 'Flatten Extraction Output', 0],
    ['Flatten Extraction Output', 'Validate Arithmetic', 0],
    ['Validate Arithmetic', 'Arithmetic OK?', 0],
    ['Arithmetic OK?', 'Call PO Matching', 0],
    ['Arithmetic OK?', 'Log Arithmetic Exception', 1],
    ['Log Arithmetic Exception', 'Notify AP — Arithmetic Mismatch', 0],
    ['Call PO Matching', 'Matched And Auto-Approved?', 0],
    ['Matched And Auto-Approved?', 'Send To Posting (Auto)', 0],
    ['Matched And Auto-Approved?', 'Send To Approval Queue', 1],
  ],
  sub: [['Extraction Model', 'Extract Invoice Fields', 0], ['Invoice Schema (Locked)', 'Extract Invoice Fields', 1]],
  exception: new Set(['Arithmetic OK?>Log Arithmetic Exception', 'Log Arithmetic Exception>Notify AP — Arithmetic Mismatch']),
};

function glyph(kind, cx, cy) {
  const s = `fill="none" stroke="${K.nightInk}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'llm': return `<path d="M${cx} ${cy - 8}c1 5 3 7 8 8c-5 1-7 3-8 8c-1-5-3-7-8-8c5-1 7-3 8-8z" fill="${K.nightInk}"/>`;
    case 'model': return `<path d="M${cx} ${cy - 6}l5.2 3v6l-5.2 3l-5.2-3v-6z" ${s}/>`;
    case 'parser': return T(cx, cy + 3.5, '{ }', { size: 10, fill: K.nightInk, cls: 'm', a: 'middle' });
    case 'code': return T(cx, cy + 3.5, '</>', { size: 9.5, fill: K.nightInk, cls: 'm', a: 'middle' });
    case 'if': return `<path d="M${cx - 7} ${cy}h4M${cx - 3} ${cy}l6-5.5h4M${cx - 3} ${cy}l6 5.5h4" ${s}/>`;
    case 'sheets': return `<path d="M${cx - 5} ${cy - 7}h10v14h-10zM${cx - 5} ${cy - 2}h10M${cx - 5} ${cy + 2.5}h10M${cx} ${cy - 2}v9" ${s}/>`;
    case 'slack': return T(cx, cy + 4, '#', { size: 12, fill: K.nightInk, cls: 'm', a: 'middle' });
    case 'exec': return `<path d="M${cx - 8} ${cy - 5}h6v10h-6zM${cx + 2} ${cy - 5}h6v10h-6zM${cx - 2} ${cy}h4" ${s}/>`;
    default: return `<path d="M${cx - 3} ${cy - 5}l7 5l-7 5z" fill="${K.nightInk}"/>`;
  }
}

function pictureAutomation() {
  const id = 'px1', s = 0.4, ox = 400, oy = 180, wx = 46, wy = 46, cx0 = wx + 12, cy0 = wy + 54;
  const at = (x, y) => [cx0 + (x - ox) * s, cy0 + (y - oy) * s];
  const N = 40, byName = new Map(INVOICE.nodes.map(([n, k, x, y]) => [n, { n, k, p: at(x, y) }]));
  let edges = '', nodes = '', labels = '';
  for (const [a, b, out] of INVOICE.main) {
    const A = byName.get(a), B = byName.get(b);
    const x1 = A.p[0] + N, y1 = A.p[1] + (A.k === 'if' ? (out ? 27 : 13) : N / 2);
    const x2 = B.p[0], y2 = B.p[1] + N / 2, dx = Math.max(16, (x2 - x1) / 2);
    const hot = INVOICE.exception.has(`${a}>${b}`);
    edges += `<path d="M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}" fill="none" stroke="${hot ? K.oxideHi : '#76756E'}" stroke-width="${hot ? 1.7 : 1.3}"/>` +
      `<circle cx="${x1}" cy="${y1}" r="2.3" fill="${hot ? K.oxideHi : '#8E8D86'}"/>` +
      `<rect x="${x2 - 2.5}" y="${y2 - 4}" width="2.5" height="8" rx="1" fill="${hot ? K.oxideHi : '#8E8D86'}"/>`;
    if (A.k === 'if') edges += T(x1 + 5, y1 + (out ? 9 : -4), out ? 'false' : 'true', { size: 6.5, fill: hot ? K.oxideHi : K.nightInk2, cls: 'm' });
  }
  for (const [a, b, slot] of INVOICE.sub) {
    const A = byName.get(a), B = byName.get(b);
    const x1 = A.p[0] + N / 2, y1 = A.p[1] + 4, x2 = B.p[0] + 12 + slot * 16, y2 = B.p[1] + N;
    edges += `<path d="M${x1} ${y1}C${x1} ${y1 - 18} ${x2} ${y2 + 18} ${x2} ${y2}" fill="none" stroke="#76756E" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  }
  for (const { n, k, p: [x, y] } of byName.values()) {
    const c = [x + N / 2, y + N / 2];
    if (k === 'model' || k === 'parser') {
      nodes += `<circle cx="${c[0]}" cy="${c[1]}" r="15" fill="${K.nightNode}" stroke="${K.nightEdge}"/>` + glyph(k, ...c);
    } else {
      nodes += k === 'trigger'
        ? `<path d="M${x + 16} ${y}H${x + N - 5}a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H${x + 16}a16 20 0 0 1 0-40z" fill="${K.nightNode}" stroke="${K.nightEdge}"/>`
        : `<rect x="${x}" y="${y}" width="${N}" height="${N}" rx="5" fill="${K.nightNode}" stroke="${n === 'Log Arithmetic Exception' ? K.oxideHi : K.nightEdge}"/>`;
      nodes += glyph(k, ...c);
      if (k === 'llm') nodes += [12, 28].map((d) => `<rect x="${x + d - 2.2}" y="${y + N - 2.2}" width="4.4" height="4.4" transform="rotate(45 ${x + d} ${y + N})" fill="#8E8D86"/>`).join('');
    }
    const words = n.split(' '), lines = [''];
    for (const w of words) (lines.at(-1) + ' ' + w).trim().length > 18 && lines.at(-1) ? lines.push(w) : (lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim());
    // The LLM node's sub-node wires leave from its bottom edge, so its name sits above it.
    const shown = lines.slice(0, 2);
    const ly = k === 'llm' ? y - 6 - (shown.length - 1) * 9 : (k === 'model' || k === 'parser') ? y + N + 9 : y + N + 11;
    shown.forEach((l, i) => { labels += T(c[0], ly + i * 9, l, { size: 7.5, fill: K.nightInk2, a: 'middle' }); });
  }
  return `<defs>${shadow(id)}<pattern id="${id}-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".85" fill="#3D3C37"/></pattern>` +
    `<clipPath id="${id}-cv"><rect x="${wx}" y="${wy + 27}" width="${480 - wx}" height="${360 - wy}"/></clipPath></defs>` +
    `<g class="lift">${frame(id, { x: wx, y: wy, w: 480, h: 360, dark: true, title: INVOICE.name })}` +
    `<g clip-path="url(#${id}-cv)"><rect x="${wx}" y="${wy + 27}" width="${480 - wx}" height="${360 - wy}" fill="url(#${id}-dots)"/>${edges}${nodes}${labels}</g></g>` +
    `<g><rect x="58" y="328" width="132" height="24" rx="12" fill="${K.win}"/>` +
    `<circle cx="72" cy="340" r="3.2" fill="${K.oxide}"/>${T(81, 343.5, '13 nodes, as exported', { size: 8.5, fill: K.ink2, cls: 'm' })}</g>`;
}

function pictureVoice() {
  const id = 'px2', px = 38, py = 34, pw = 148, cx = px + pw / 2;
  const wave = [5, 9, 15, 8, 21, 13, 27, 17, 23, 11, 19, 8, 14, 9, 6, 8, 4];
  const w0 = cx - (wave.length * 6.2) / 2;
  const phone =
    `<rect x="${px}" y="${py}" width="${pw}" height="340" rx="24" fill="#151513" filter="url(#${id}-sh)"/>` +
    `<rect x="${px + 6}" y="${py + 6}" width="${pw - 12}" height="330" rx="19" fill="#272522"/>` +
    `<rect x="${cx - 21}" y="${py + 14}" width="42" height="11" rx="5.5" fill="#151513"/>` +
    T(cx, py + 50, 'INBOUND CALL', { size: 7.5, fill: K.nightInk2, cls: 'm', a: 'middle', ls: '1.4' }) +
    T(cx, py + 68, 'AI Front Desk', { size: 13, fill: K.nightInk, w: 500, a: 'middle' }) +
    `<circle cx="${cx}" cy="${py + 106}" r="24" fill="#35332F"/>` +
    `<circle cx="${cx}" cy="${py + 100}" r="7" fill="#6D6B65"/><path d="M${cx - 12} ${py + 121}a12 10 0 0 1 24 0z" fill="#6D6B65"/>` +
    wave.map((h, i) => R((w0 + i * 6.2).toFixed(1), py + 160 - h / 2, 3, h, K.oxideHi, { r: 1.5 })).join('') +
    T(cx, py + 192, 'qualifying the job', { size: 7.5, fill: K.nightInk2, cls: 'm', a: 'middle' }) +
    [cx - 34, cx].map((x) => `<circle cx="${x}" cy="${py + 244}" r="14" fill="#3A3834"/>`).join('') +
    `<path d="M${cx - 38} ${py + 241}v6M${cx - 34} ${py + 238}v12M${cx - 30} ${py + 241}v6" stroke="${K.nightInk2}" stroke-width="1.5" stroke-linecap="round"/>` +
    [-4, 0, 4].map((dx) => [-4, 0, 4].map((dy) => `<circle cx="${cx + dx}" cy="${py + 244 + dy}" r="1.1" fill="${K.nightInk2}"/>`).join('')).join('') +
    `<circle cx="${cx + 34}" cy="${py + 244}" r="15" fill="${K.oxide}"/>` +
    `<path d="M${cx + 26} ${py + 246}q8-7 16 0l-2 3.5-3.5-1.5v-2.5q-5-1.5-5 0v2.5l-3.5 1.5z" fill="${K.win}"/>`;
  const rows = [
    ['Re-Check Slot Still Free', 'before anything is booked', 'ok'],
    ['Record Booking', 'into the field-service CRM', 'ok'],
    ['Refuse — Not In Table', 'no price the table does not hold', 'no'],
    ['Alert Human Now', 'escalation goes to a person', 'up'],
  ];
  const cardX = 204, cardY = 66;
  let list = '';
  rows.forEach(([name, sub, st], i) => {
    const y = cardY + 82 + i * 34, no = st === 'no';
    list += `<circle cx="${cardX + 24}" cy="${y - 4}" r="8.5" fill="${no ? K.wash : '#E8E7E2'}"/>` +
      (st === 'ok' ? `<path d="M${cardX + 20} ${y - 4}l3 3l5-6" fill="none" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
        : st === 'no' ? `<path d="M${cardX + 20.5} ${y - 7.5}l7 7m0-7l-7 7" stroke="${K.oxide}" stroke-width="1.6" stroke-linecap="round"/>`
          : `<path d="M${cardX + 20.5} ${y - 0.5}l7-7m-4.5 0h4.5v4.5" fill="none" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`) +
      T(cardX + 42, y - 2, name, { size: 11, fill: no ? K.oxide : K.ink, w: 500 }) +
      T(cardX + 42, y + 10, sub, { size: 7.5, fill: K.ink3, cls: 'm' });
  });
  return `<defs>${shadow(id)}</defs>` +
    `<path d="M${px + pw} ${py + 160}H${cardX}" stroke="${K.win}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".8"/>` +
    `<circle cx="${cardX}" cy="${py + 160}" r="3" fill="${K.win}"/>` +
    `<g class="lift">${phone}</g>` +
    `<g><rect x="${cardX}" y="${cardY}" width="300" height="212" rx="10" fill="${K.win}" filter="url(#${id}-sh)"/>` +
    T(cardX + 18, cardY + 26, 'TOOL CALLS', { size: 7.5, fill: K.ink3, cls: 'm', ls: '1.3' }) +
    T(cardX + 18, cardY + 44, 'Agent Tools & Guardrails', { size: 12, fill: K.ink, w: 600 }) +
    `<path d="M${cardX} ${cardY + 57.5}H${cardX + 300}" stroke="${K.line}"/>${list}</g>`;
}

function pictureLLM() {
  const id = 'px3', x = 50, y = 50, w = 396, tx = x + 44;
  return `<defs>${shadow(id)}</defs><g class="lift">` +
    frame(id, { x, y, w, h: 360, title: 'Knowledge Assistant' }) +
    `<circle cx="${x + 26}" cy="${y + 52}" r="11" fill="#D6D5CF"/>` + bar(tx, y + 42, 64, '#D6D5CF', 7) +
    T(tx, y + 67, 'Which workflow is allowed to write to the Leads tab?', { size: 11.5, fill: K.ink }) +
    R(x + 15, y + 88, 22, 22, K.ink, { r: 6 }) + `<circle cx="${x + 26}" cy="${y + 99}" r="5" fill="none" stroke="${K.oxideHi}" stroke-width="2"/>` +
    T(tx, y + 98, 'Knowledge Assistant', { size: 11, fill: K.ink, w: 600 }) +
    R(tx + 116, y + 89, 24, 12, '#E6E5E0', { r: 3 }) + T(tx + 128, y + 97.5, 'APP', { size: 6.5, fill: K.ink3, a: 'middle', cls: 'm', w: 500 }) +
    T(tx, y + 118, 'One: Update Leads Sheets. Every source calls it.', { size: 11.5, fill: K.ink }) +
    R(tx, y + 130, 2.5, 42, K.oxide) +
    T(tx + 12, y + 146, '“…it is the only thing permitted to', { size: 11, fill: K.ink2, cls: 's' }) +
    T(tx + 12, y + 163, 'write to the Leads tab.”', { size: 11, fill: K.ink2, cls: 's' }) +
    R(tx, y + 184, 168, 22, K.win2, { r: 6, stroke: K.line }) +
    `<path d="M${tx + 10} ${y + 189}h7l3 3v9h-10z" fill="none" stroke="${K.ink3}" stroke-width="1.2" stroke-linejoin="round"/>` +
    T(tx + 26, y + 198.5, 'lead-to-cash-crm / README.md', { size: 8.5, fill: K.ink2, cls: 'm' }) +
    R(tx, y + 214, 152, 22, K.wash, { r: 6 }) +
    `<path d="M${tx + 10} ${y + 225}l3 3l5-6" fill="none" stroke="${K.oxide}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    T(tx + 24, y + 228.5, 'quote verified verbatim', { size: 8.5, fill: K.oxide, cls: 'm', w: 500 }) +
    `</g>`;
}

function pictureWeb(brand) {
  const id = 'px4', x = 28, y = 38, w = 396, h = 300, cy = y + 27;
  const tex = `<pattern id="${id}-tex" patternUnits="userSpaceOnUse" width="250" height="185"><image href="/texture.webp" width="250" height="185" preserveAspectRatio="none"/></pattern>`;
  const discs = [[330, 150, 13], [300, 118, 8], [352, 110, 8], [372, 146, 9], [305, 178, 9], [350, 188, 8], [282, 148, 7], [328, 96, 6], [385, 175, 6], [276, 116, 6], [322, 206, 6], [290, 200, 5]];
  const browser = frame(id, { x, y, w, h }) +
    R(x + 60, y + 7, 230, 13, '#E7E6E1', { r: 6.5 }) +
    `<path d="M${x + 70} ${y + 12.5}v3.5h5v-3.5zM${x + 71} ${y + 12.5}v-1.8a1.5 1.5 0 0 1 3 0v1.8" fill="none" stroke="${K.ink3}" stroke-width="1"/>` + bar(x + 82, y + 11, 110, '#D3D2CC', 5) +
    `<rect x="${x}" y="${cy}" width="${w}" height="${h - 27}" fill="url(#${id}-tex)"/>` +
    `<circle cx="${x + 22}" cy="${cy + 18}" r="3" fill="none" stroke="${K.oxide}" stroke-width="1.4"/>` +
    T(x + 30, cy + 21, brand.mark, { size: 8.5, fill: K.ink, cls: 's' }) +
    [0, 1, 2, 3].map((i) => bar(x + 258 + i * 32, cy + 16, 24, '#B9B8B2', 3.5)).join('') +
    bar(x + 20, cy + 46, 118, '#A9A8A2', 3.5) +
    // the name, one line per entry, centred on the three-line block it was drawn for
    brand.lines.map((l, i) => T(x + 19, cy + 78 + (3 - brand.lines.length) * 14 + i * 28, l, { size: 29, fill: K.ink, cls: 's' })).join('') +
    T(x + 20, cy + 160, 'I automate the work', { size: 9.5, fill: K.ink, cls: 'm' }) +
    T(x + 20, cy + 173, 'nobody wants to do twice.', { size: 9.5, fill: K.ink, cls: 'm' }) +
    R(x + 164, cy + 165, 5, 10, K.oxide) +
    [0, 1, 2].map((i) => `<circle cx="${x + 22 + i * 52}" cy="${cy + 192}" r="2.2" fill="${K.oxide}"/>` + bar(x + 28 + i * 52, cy + 190, 36, '#B4B3AD', 4)).join('') +
    discs.map(([dx, dy, r]) => `<circle cx="${x + dx - 60}" cy="${cy + dy - 40}" r="${r}" fill="${K.win2}" stroke="#C9C8C2" stroke-width=".8"/>`).join('');
  const qx = 344, qy = 120, qw = 110;
  const phone = `<rect x="${qx}" y="${qy}" width="${qw}" height="236" rx="18" fill="#151513" filter="url(#${id}-sh)"/>` +
    `<rect x="${qx + 5}" y="${qy + 5}" width="${qw - 10}" height="226" rx="14" fill="url(#${id}-tex)"/>` +
    `<rect x="${qx + qw / 2 - 15}" y="${qy + 11}" width="30" height="8" rx="4" fill="#151513"/>` +
    `<circle cx="${qx + 16}" cy="${qy + 34}" r="2.3" fill="none" stroke="${K.oxide}" stroke-width="1.1"/>` + T(qx + 22, qy + 36.5, brand.mark, { size: 7, fill: K.ink, cls: 's' }) +
    brand.lines.map((l, i) => T(qx + 13, qy + 64 + (3 - brand.lines.length) * 8.5 + i * 17, l, { size: 17, fill: K.ink, cls: 's' })).join('') +
    bar(qx + 14, qy + 110, 66, '#9E9D97', 3.5) + bar(qx + 14, qy + 118, 54, '#9E9D97', 3.5) +
    [0, 1].map((i) => R(qx + 12 + i * 45, qy + 136, 41, 58, K.win2, { r: 6, stroke: '#D2D1CB', sw: 0.8 }) +
      R(qx + 18 + i * 45, qy + 142, 11, 11, K.wash, { r: 3 }) + bar(qx + 18 + i * 45, qy + 162, 26, '#8F8E88', 3.5) + bar(qx + 18 + i * 45, qy + 171, 30, '#C7C6C0', 3) + bar(qx + 18 + i * 45, qy + 178, 22, '#C7C6C0', 3)).join('');
  return `<defs>${shadow(id)}${tex}</defs><g class="lift">${browser}</g>${phone}` +
    `<g><rect x="40" y="316" width="118" height="24" rx="12" fill="${K.ink}"/>` +
    `<circle cx="54" cy="328" r="3.2" fill="${K.oxideHi}"/>${T(63, 331.5, '0 KB JavaScript', { size: 8.5, fill: K.nightInk, cls: 'm' })}</g>`;
}

function picturePlatform() {
  const id = 'px5', x = 48, y = 48, sx = x + 86;
  const nav = ['Campaigns', 'Weather', 'Spend', 'Workspaces'];
  const tiles = [['23', 'workspaces'], ['90', 'campaigns'], ['~$234K', 'ad spend tracked']];
  const feats = ['Bids on weather', 'Holds spend to the plan', 'Publishes campaigns', 'Books revenue to the click'];
  return `<defs>${shadow(id)}</defs><g class="lift">` +
    frame(id, { x, y, w: 470, h: 360, title: 'adwash.ai', mono: true }) +
    `<rect x="${x}" y="${y + 27}" width="86" height="333" fill="${K.win2}"/><path d="M${sx + 0.5} ${y + 27}V${y + 360}" stroke="${K.line}"/>` +
    R(x + 14, y + 44, 14, 14, K.ink, { r: 4 }) + T(x + 34, y + 55, 'AdWash', { size: 10, fill: K.ink, w: 600 }) +
    nav.map((n, i) => {
      const ny = y + 86 + i * 24, on = i === 3;
      return (on ? R(x + 8, ny - 12, 70, 20, K.wash, { r: 5 }) + R(x + 8, ny - 12, 2.5, 20, K.oxide, { r: 1 }) : '') +
        R(x + 16, ny - 6, 7, 7, on ? K.oxide : '#BDBCB6', { r: 2 }) + T(x + 29, ny + 0.5, n, { size: 8.5, fill: on ? K.oxide : K.ink2, w: on ? 600 : 400 });
    }).join('') +
    T(sx + 16, y + 56, 'Workspaces', { size: 13, fill: K.ink, w: 600 }) +
    R(sx + 196, y + 42, 96, 20, K.win, { r: 6, stroke: K.line }) + bar(sx + 205, y + 49, 52, '#D0CFC9', 6) +
    `<path d="M${sx + 272} ${y + 50}l3.5 3.5 3.5-3.5" fill="none" stroke="${K.ink3}" stroke-width="1.2"/>` +
    tiles.map(([n, l], i) => {
      const tx = sx + 14 + i * 100;
      return R(tx, y + 76, 92, 60, K.win, { r: 8, stroke: K.line }) +
        T(tx + 11, y + 106, n, { size: 21, fill: K.ink, cls: 'n' }) + T(tx + 11, y + 124, l, { size: 7.5, fill: K.ink3, cls: 'm' });
    }).join('') +
    R(sx + 14, y + 148, 292, 180, K.win, { r: 8, stroke: K.line }) +
    T(sx + 28, y + 170, 'Automation', { size: 10.5, fill: K.ink, w: 600 }) +
    T(sx + 292, y + 170, '2,393 events', { size: 8.5, fill: K.ink3, cls: 'm', a: 'end' }) +
    `<path d="M${sx + 14} ${y + 180.5}H${sx + 306}" stroke="${K.line}"/>` +
    feats.map((f, i) => {
      const fy = y + 200 + i * 23;
      return `<circle cx="${sx + 33}" cy="${fy - 3.5}" r="3" fill="${K.oxide}"/>` + T(sx + 44, fy, f, { size: 9.5, fill: K.ink2 });
    }).join('') +
    T(sx + 28, y + 302, 'measured against the live database, 2026-09-04', { size: 7, fill: K.ink3, cls: 'm' }) +
    `</g>`;
}

function pictureCRM(page) {
  const id = 'px6', x = 46, y = 64, cols = [x + 18, x + 84, x + 212, x + 272];
  const rows = [
    ['Website form', 'Hot'], ['Tracked call', 'Warm'], ['Facebook Lead Ads', 'Hot'], ['Chat widget', 'Cold'],
    ['Calendar booking', 'Warm'], ['Hosted form', 'Hot'], ['Social comment', 'Cold'],
  ];
  const chip = (g, cx, cy) => g === 'Hot'
    ? R(cx, cy - 9, 34, 13, K.wash, { r: 6.5 }) + T(cx + 17, cy, g, { size: 7.5, fill: K.oxide, a: 'middle', cls: 'm', w: 500 })
    : g === 'Warm' ? R(cx, cy - 9, 34, 13, '#E8E7E2', { r: 6.5 }) + T(cx + 17, cy, g, { size: 7.5, fill: K.ink2, a: 'middle', cls: 'm' })
      : R(cx + 0.5, cy - 8.5, 33, 12, 'none', { r: 6, stroke: '#CFCEC8' }) + T(cx + 17, cy, g, { size: 7.5, fill: K.ink3, a: 'middle', cls: 'm' });
  const marks = ['Google Sheets', 'n8n', 'Gmail', 'Google Ads', 'Meta'];
  const hub = marks.map((m, i) => {
    const mx = 272 + i * 38;
    return `<circle cx="${mx}" cy="44" r="13" fill="${K.win}"/>` + mark(page, m, mx - 7.5, 36.5, 15, K.ink);
  }).join('');
  return `<defs>${shadow(id)}</defs><g class="lift">` +
    frame(id, { x, y, w: 470, h: 360, title: '[COMPANY] · Leads · served by webhook', mono: true }) +
    ['REF', 'SOURCE', 'GRADE', 'STAGE'].map((h, i) => T(cols[i], y + 50, h, { size: 7, fill: K.ink3, cls: 'm', ls: '1.2' })).join('') +
    `<path d="M${x} ${y + 60.5}H${x + 470}" stroke="${K.line}"/>` +
    rows.map(([src, g], i) => {
      const ry = y + 82 + i * 26;
      return bar(cols[0], ry - 7, 44, '#D6D5CF', 7) + T(cols[1], ry, src, { size: 10, fill: K.ink }) + chip(g, cols[2], ry) +
        bar(cols[3], ry - 7, [58, 74, 50, 66, 44, 70, 56][i], '#E1E0DB', 7) + `<path d="M${x} ${ry + 9.5}H${x + 470}" stroke="#EDECE8"/>`;
    }).join('') +
    `</g>` +
    `<g filter="url(#${id}-sh)"><rect x="250" y="25" width="218" height="38" rx="19" fill="#262522"/></g>` +
    `<path d="M272 44H424" stroke="#57564F" stroke-width="1.4"/>${hub}` +
    `<g><rect x="40" y="316" width="146" height="24" rx="12" fill="${K.ink}"/>` +
    `<path d="M50 328l3 3l5-6" fill="none" stroke="${K.oxideHi}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `${T(64, 331.5, 'Dedupe Guard → pass', { size: 8.5, fill: K.nightInk, cls: 'm' })}</g>`;
}

const svg = (body) => `<svg viewBox="0 0 480 360" aria-hidden="true" focusable="false">${body}</svg>`;

export function withPictures(page, brand) {
  const pictures = {
    'AI Automation': [1, pictureAutomation()],
    'Voice &amp; Chat Agents': [2, pictureVoice()],
    'LLM Systems': [3, pictureLLM()],
    'Web Development': [4, pictureWeb(brand)],
    'Platform Engineering': [5, picturePlatform()],
    'CRM &amp; API Integration': [6, pictureCRM(page)],
  };
  let placed = 0;
  const out = page.replace(/<article class="skill rv"><span class="g">[\s\S]*?<\/span><h3>([^<]+)<\/h3>/g, (m, title) => {
    const p = pictures[title];
    if (!p) throw new Error(`expertise pictures: no picture for the card "${title}"`);
    placed++;
    return `<article class="skill rv"><div class="pic pic--${p[0]}">${svg(p[1])}</div><h3>${title}</h3>`;
  });
  if (placed !== Object.keys(pictures).length) {
    throw new Error(`expertise pictures: placed ${placed} of ${Object.keys(pictures).length} — the card markup changed`);
  }
  return out;
}
