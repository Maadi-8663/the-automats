export const BRAND = {
  'n8n': '#EA4B71',
  'TypeScript': '#3178C6',
  'Google Gemini': '#8E75B2',
  'Python': '#3776AB',
  'Next.js': '#000000',
  'PostgreSQL': '#4169E1',
  'React': '#61DAFB',
  'Supabase': '#3FCF8E',
  'Google Ads': '#4285F4',
  'Shopify': '#7AB55C',
  'Gmail': '#EA4335',
  'Google Sheets': '#34A853',
  'WhatsApp': '#25D366',
  'Stripe': '#635BFF',
  'Docker': '#2496ED',
  'Node.js': '#5FA04E',
  'Meta': '#0467DF',
  'Telegram': '#26A5E4',
  'ElevenLabs': '#000000',
};

export function withBrandColours(page) {
  let placed = 0;
  const out = page.replace(
    /<span class="tile" style="([^"]*)"([^>]*?) aria-label="([^"]+)">/g,
    (m, style, rest, name) => {
      const hex = BRAND[name];
      if (!hex) throw new Error(`brand colours: no colour for the cluster tile "${name}" — add it from Simple Icons`);
      placed++;
      return `<span class="tile" style="${style};--brand:${hex}"${rest} aria-label="${name}">`;
    },
  );
  if (!placed) throw new Error('brand colours: no cluster tiles found — the hero markup changed');
  return out;
}
