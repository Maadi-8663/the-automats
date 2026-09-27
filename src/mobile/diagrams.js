const ICON = (inner) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${inner}</svg>`;

export function withSectorFlow(page) {
  const strip = page.indexOf('<div class="strip">');
  if (strip === -1) throw new Error('sector flow: no .strip');
  const stripEnd = page.indexOf('</svg>', strip);
  const closeDiv = page.indexOf('</div>', stripEnd);
  const svg = page.slice(strip, stripEnd);

  const nodes = [...svg.matchAll(/<g class="node n(\d+)"><rect class="plate" x="([\d.]+)"[\s\S]*?<g class="glyph"[^>]*>([\s\S]*?)<\/g>([\s\S]*?)<\/g>/g)]
    .map(([, n, x, glyph, tail]) => ({
      n: +n, x: +x, glyph,
      name: [...tail.matchAll(/<text class="nl"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' '),
    }));
  if (nodes.length !== 13) throw new Error(`sector flow: expected 13 nodes, found ${nodes.length}`);

  const log = [...page.matchAll(/<div class="l(\d)">&gt; ([^<]*)<\/div>/g)].map((m) => m[2]);
  if (log.length !== 8) throw new Error(`sector flow: expected 8 log lines, found ${log.length}`);
  const key = (s) => s.replace(/^Call /, '').replace(/['‘’]/g, '').trim().toLowerCase();
  const outcome = new Map();
  for (const line of log.slice(1)) {
    for (const part of line.split(' · ')) {
      const [name, result] = part.split(' → ');
      if (result) outcome.set(key(name), result);
    }
  }
  const fanX = Math.max(...nodes.map((d) => d.x));

  const items = nodes.map((d, i) => {
    const note = i === 0 ? log[0] : outcome.get(key(d.name));
    return `<li class="${d.x === fanX ? 'fan' : 'step'}"><span class="mf-ico">${ICON(d.glyph)}</span>` +
      `<span class="mf-t"><b>${d.name}</b>${note ? `<i>${i === 0 ? '' : '→ '}${note}</i>` : ''}</span></li>`;
  }).join('');
  const list = `<ol class="mflow" aria-label="The hub workflow, step by step">${items}</ol>`;
  return page.slice(0, closeDiv + 6) + list + page.slice(closeDiv + 6);
}

export function withSystemArch(page) {
  const a = page.indexOf('<svg class="arch"');
  if (a === -1) throw new Error('system arch: no .arch svg');
  const b = page.indexOf('</svg>', a);
  const svg = page.slice(a, b);
  // The arch-track that holds the SVG closes three </div>s after it.
  let end = b;
  for (let k = 0; k < 3; k++) end = page.indexOf('</div>', end + 1);
  if (end === -1) throw new Error('system arch: arch-track does not close');
  end += 6;

  const glyphs = [...svg.matchAll(/<g class="gl( st)?" transform="translate\(([\d.]+) ([\d.]+)\)[^"]*">([\s\S]*?)<\/g>/g)]
    .map(([, st, x, y, inner]) => ({ st: !!st, x: +x, y: +y, inner }));
  const texts = [...svg.matchAll(/<text class="([^"]*)"[^>]*>([^<]*)<\/text>/g)].map(([, c, t]) => ({ c, t }));

  // Texts come column by column, each column closed by its capital caption.
  const cols = [[]];
  for (const t of texts) {
    if (t.c === 'cap') { cols.at(-1).cap = t.t; cols.push([]); } else cols.at(-1).push(t);
  }
  cols.pop();
  if (cols.length !== 4) throw new Error(`system arch: expected 4 captioned columns, found ${cols.length}`);
  const [src, hub, router, fam] = cols;

  const srcNames = src.filter((t) => t.c === 't13').map((t) => t.t);
  const extra = src.filter((t) => t.c.includes('dim')).map((t) => t.t).join(' — ');
  const srcGlyphs = glyphs.filter((g) => g.x < 300);
  const famGlyphs = glyphs.filter((g) => g.x > 800);
  const famNames = fam.filter((t) => t.c.includes('b')).map((t) => t.t);
  const famNotes = fam.filter((t) => t.c.includes('dim')).map((t) => t.t);
  if (srcNames.length !== srcGlyphs.length || famNames.length !== famGlyphs.length || famNames.length !== famNotes.length) {
    throw new Error('system arch: names and icons no longer pair up');
  }
  const icon = (g) => `<span class="ma-ico${g.st ? ' st' : ''}">${ICON(g.inner)}</span>`;
  const title = (col) => col.find((t) => t.c === 't14').t;
  const sub = (col) => col.find((t) => t.c === 't12').t;
  const steps = (col) => col.filter((t) => t.c.includes('t10')).map((t) => `<li>${t.t}</li>`).join('');

  const html = `<div class="march">` +
    `<p class="ma-cap">${src.cap}</p><ul class="ma-src">` +
    srcNames.map((n, i) => `<li>${icon(srcGlyphs[i])}<span>${n}</span></li>`).join('') +
    `<li class="ma-extra"><span class="ma-ico dash"></span><span>${extra}</span></li></ul>` +
    `<p class="ma-cap">${hub.cap}</p><div class="ma-node"><b>${title(hub)}</b><i>${sub(hub)}</i><ol>${steps(hub)}</ol></div>` +
    `<p class="ma-cap">${router.cap}</p><div class="ma-node"><b>${title(router)}</b><i>${sub(router)}</i><ul>${steps(router)}</ul></div>` +
    `<p class="ma-cap">${fam.cap}</p><ul class="ma-fam">` +
    famNames.map((n, i) => `<li>${icon(famGlyphs[i])}<span><b>${n}</b><i>${famNotes[i]}</i></span></li>`).join('') +
    `</ul></div>`;
  return page.slice(0, end) + html + page.slice(end);
}

export function withTouchCopy(page) {
  const phrase = 'Hover a mark';
  const n = page.split(phrase).length - 1;
  if (n !== 1) throw new Error(`touch copy: expected one "${phrase}", found ${n}`);
  return page.replace(phrase, `<span class="if-hover">${phrase}</span><span class="if-touch">Tap a mark</span>`);
}
