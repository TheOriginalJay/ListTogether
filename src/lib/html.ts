// Minimal, dependency-free HTML sanitizer for note bodies.
// Note content comes from our own contentEditable editor + user paste, so we strip
// anything executable and keep a safe allowlist of formatting/structure tags.

const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON']);
const ATTR_ALLOW: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
};

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const all = Array.from(doc.body.querySelectorAll('*'));
  for (const el of all) {
    if (DROP_TAGS.has(el.tagName)) {
      el.remove();
      continue;
    }
    // strip non-allowlisted attributes (and all event handlers / styles)
    for (const attr of Array.from(el.attributes)) {
      const allowed = ATTR_ALLOW[el.tagName];
      const ok = allowed?.has(attr.name.toLowerCase());
      if (!ok) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (/^\s*(javascript:|data:)/i.test(href)) {
        el.removeAttribute('href');
      } else if (href) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }
  return doc.body.innerHTML;
}

export function htmlToText(html: string): string {
  if (!html) return '';
  // Already plain text (legacy notes)? return as-is.
  if (!/[<>]/.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/ /g, ' ').trim();
}

// Legacy notes were stored as plain text. Render them safely as HTML.
export function ensureHtml(body: string): string {
  if (!body) return '';
  if (/[<>]/.test(body)) return sanitizeHtml(body);
  return body
    .split('\n')
    .map(line => (line ? escapeHtml(line) : '<br>'))
    .join('<br>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
