/**
 * Cleans a Wikisource page's wikitext into a source text: its prose, a paragraph to a line with a
 * blank line between, without the templates (the header, notes, poems set as templates), the
 * links' markup, headings, lists, tables or categories.
 */

export interface WikiOptions {
  /** Corrections, as [pattern, replacement] pairs, made to each paragraph. */
  fixes?: readonly (readonly [RegExp, string])[];
}

const ENTITIES: Readonly<Record<string, string>> = {
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  thinsp: ' ',
  shy: '',
};

/** Blocks set apart from the prose: verse, centred lines, tables. They go, with what's in them. */
const SET_APART = /<(poem|center|table|gallery|math|score|div class="?(?:poem|verse)"?)[^>]*>[\s\S]*?<\/(?:poem|center|table|gallery|math|score|div)>/giu;

export function cleanWikitext(wikitext: string, options: WikiOptions = {}): string {
  let text = wikitext
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref\b[^>/]*\/>/giu, '')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/giu, '')
    .replace(SET_APART, '')
    .replace(/__[A-ZА-Я]+__/gu, '');
  // Templates, innermost first, since they nest.
  for (let before = ''; before !== text; ) {
    before = text;
    text = text.replace(/\{\{[^{}]*\}\}/g, '');
  }
  text = text
    .replace(/\{\|[\s\S]*?\|\}/g, '')
    // Categories, files and links to other wikis: any link whose target has a colon.
    .replace(/\[\[[^\]|]*:[^\]]*\]\]/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[(?:https?:)?\/\/\S+\s+([^\]]*)\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(\w+);/g, (entity, name: string) => ENTITIES[name] ?? entity);

  const paragraphs: string[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      // Headings, lists and the lines tables and templates leave behind.
      .filter((line) => line && !/^(?:=.*=|[*#;|!]|\{\||\|\}|-{4,})/u.test(line))
      .map((line) => line.replace(/^:+\s*/, ''));
    const paragraph = (options.fixes ?? []).reduce((joined, [pattern, replacement]) => joined.replace(pattern, replacement), lines.join(' '));
    const tidy = paragraph.replace(/\s+/g, ' ').trim();
    if (/\p{L}/u.test(tidy)) paragraphs.push(tidy);
  }
  return paragraphs.join('\n\n') + '\n';
}
