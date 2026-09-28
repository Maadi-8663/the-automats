function wrapWords(inner) {
  let i = 0;
  return inner
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<')
      ? part
      : part.replace(/\S+/g, (w) => `<span class="w"><span style="--i:${i++}">${w}</span></span>`)))
    .join('');
}

function addClass(open, cls) {
  return /\sclass="/.test(open)
    ? open.replace(/\sclass="([^"]*)"/, (m, c) => ` class="${c} ${cls}"`)
    : open.replace(/^<([a-zA-Z0-9]+)/, `<$1 class="${cls}"`);
}

export function withWords(page, opens, mode = 'scroll') {
  const cls = mode === 'load' ? 'wsplit wload' : 'wsplit';
  for (const re of opens) {
    const g = new RegExp(re.source, 'g');
    let out = '', last = 0, n = 0, m;
    while ((m = g.exec(page))) {
      const open = m[0];
      const tag = open.match(/^<([a-zA-Z0-9]+)/)[1];
      const close = `</${tag}>`;
      const end = page.indexOf(close, m.index + open.length);
      if (end === -1) throw new Error(`words: ${open} never closes`);
      out += page.slice(last, m.index) + addClass(open, cls) + wrapWords(page.slice(m.index + open.length, end)) + close;
      last = g.lastIndex = end + close.length;
      n++;
    }
    if (!n) throw new Error(`words: nothing matched ${re}`);
    page = out + page.slice(last);
  }
  return page;
}
