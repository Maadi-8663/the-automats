const PHOTOS = {
  '/sectors/home-services/': 'workshop',
  '/work/#aesthetics-voice-agent': 'salon',
  '/work/#shopify-support-automation': 'parcels',
  '/work/#labor-law-outreach': 'lawbooks',
  '/work/#linkedin-lead-pipeline': 'contract',
  '/work/#product': 'storm',
};

const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const photo = (name) =>
  `<span class="sect-photo"><img src="/photos/${name}-400.webp" srcset="/photos/${name}-400.webp 400w, /photos/${name}-640.webp 640w" ` +
  `sizes="(max-width: 1000px) 46vw, 300px" width="400" height="500" alt="" loading="lazy" decoding="async"></span>`;

export function withSectorCards(page) {
  let placed = 0;
  const out = page.replace(
    /<a class="sect rv" href="([^"]+)"><span class="ring">[\s\S]*?<\/span><span>(<b>[\s\S]*?<\/b><i>[\s\S]*?<\/i>)<\/span><\/a>/g,
    (m, href, text) => {
      const name = PHOTOS[href];
      if (!name) throw new Error(`sector cards: no photo for the sector link ${href}`);
      placed++;
      return `<a class="sect rv" href="${href}">${photo(name)}<span class="tx">${text}</span><span class="go">${ARROW}</span></a>`;
    },
  );
  if (placed !== Object.keys(PHOTOS).length) {
    throw new Error(`sector cards: placed ${placed} of ${Object.keys(PHOTOS).length} — the sector markup changed`);
  }
  return out;
}
