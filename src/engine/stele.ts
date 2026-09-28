/**
 * "Open in Stele": a link that opens Stele (https://stele.invigoro.me/) with the generated text
 * already on the object. It uses Stele's own share-link format: "#s=", then the settings as JSON,
 * deflate-raw compressed and base64url encoded. Stele fills in everything left out from the
 * medium's defaults. If Stele's format changes, this is the one place to update.
 */

export const STELE_URL = 'https://stele.invigoro.me/';

/** Stele keeps at most this much text from a link. */
export const STELE_MAX_TEXT = 4000;

export type SteleMedium = 'marble' | 'sandstone' | 'granite' | 'slate' | 'clay' | 'bronze' | 'wood' | 'paper' | 'parchment' | 'papyrus';
export type SteleScript = 'latin' | 'elder-futhark' | 'younger-futhark' | 'futhorc' | 'cuneiform';

export interface SteleOptions {
  medium: SteleMedium;
  script?: SteleScript;
  /** Roman lettering: capitals, V for U, I for J, dots between words. */
  roman?: boolean;
  /** One of Stele's fonts, such as 'unifrakturmaguntia' (blackletter) or 'uncial-antiqua'. */
  font?: string;
}

/**
 * Text Stele can write in runes. Its rune tables cover the Latin alphabet, so Old Norse letters
 * are spelled out first: þ and ð as th (the thorn rune), æ and œ as ae and oe. Quotation marks
 * don't belong on a runestone; Stele drops English ones, and these drop the rest.
 */
export function forRunes(text: string): string {
  return text
    .replace(/[„«»‹›]/g, '')
    .replace(/ /g, ' ')
    .replace(/[þð]/g, 'th')
    .replace(/[ÞÐ]/g, 'Th')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe');
}

/** The text cut to what Stele keeps, at the end of a sentence if it has to be cut at all. */
export function trimForStele(text: string): { text: string; trimmed: boolean } {
  if (text.length <= STELE_MAX_TEXT) return { text, trimmed: false };
  const head = text.slice(0, STELE_MAX_TEXT);
  const end = Math.max(head.lastIndexOf('\n\n'), ...['. ', '! ', '? ', '» ', '” '].map((mark) => head.lastIndexOf(mark) + 1));
  return { text: (end > 0 ? head.slice(0, end) : head).trimEnd(), trimmed: true };
}

async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const input = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = input.pipeThrough(new CompressionStream('deflate-raw')).getReader();
  const chunks: Uint8Array[] = [];
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) chunks.push(chunk.value);
  const out = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The Stele settings for a text: one text block, on the medium, marked as edited so Stele keeps it. */
export function steleSettings(text: string, options: SteleOptions): Record<string, unknown> {
  const script = options.script ?? 'latin';
  const block: Record<string, unknown> = {
    kind: 'text',
    role: 'main',
    text: trimForStele(script === 'latin' ? text : forRunes(text)).text,
  };
  if (script !== 'latin') block.script = script;
  if (options.roman) block.roman = true;
  if (options.font) block.font = options.font;
  return { v: 1, medium: options.medium, textEdited: true, blocks: [block] };
}

export async function steleLink(text: string, options: SteleOptions): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(steleSettings(text, options)));
  return `${STELE_URL}#s=${base64Url(await deflate(json))}`;
}
