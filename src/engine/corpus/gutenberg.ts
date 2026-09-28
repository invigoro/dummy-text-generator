/**
 * Turns a Project Gutenberg plain-text download into a clean source text: prose paragraphs only,
 * separated by blank lines.
 *
 * What goes: the Project Gutenberg header and footer (they carry its trademark and license, not
 * the work), front matter, headings, indented blocks (songs, letters, tables of contents) and
 * footnotes. What changes: double hyphens become em dashes, underscores marking italics go, and
 * words set in capitals get ordinary case.
 *
 * This module has no imports, so scripts/import-gutenberg.ts can run it directly under Node.
 */

export interface CleanOptions {
  /** The first line of the text proper, such as its first heading. Everything before it is front matter. */
  startAt?: RegExp;
  /** A line to stop before, such as a later chapter's heading, to keep only part of a long text. */
  endBefore?: RegExp;
  /** Characters to remove, such as the square brackets an edition puts round doubtful words. */
  remove?: RegExp;
  /**
   * Words the edition sets in capitals (often for italics) and what to write instead, such as
   * { HISPANIOLA: 'Hispaniola' }. Any other word in capitals becomes lowercase, with a capital
   * at the start of a sentence.
   */
  capitals?: Readonly<Record<string, string>>;
}

const WORD = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu;
const ROMAN = /^M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;

export function cleanGutenberg(raw: string, options: CleanOptions = {}): string {
  let lines = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG/i.test(line));
  const end = lines.findIndex((line) => /^\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG/i.test(line));
  lines = lines.slice(start + 1, end === -1 ? undefined : end);

  const { startAt, endBefore, remove, capitals = {} } = options;
  if (startAt) {
    const first = lines.findIndex((line) => startAt.test(line));
    if (first === -1) throw new Error(`No line matches ${startAt}`);
    lines = lines.slice(first);
  }
  if (endBefore) {
    const last = lines.findIndex((line, i) => i > 0 && endBefore.test(line));
    if (last === -1) throw new Error(`No line matches ${endBefore}`);
    lines = lines.slice(0, last);
  }

  const paragraphs: string[] = [];
  let dropped = false;
  for (const block of splitBlocks(lines)) {
    if (isDropped(block)) {
      dropped = true;
      continue;
    }
    const joined = block.join(' ');
    const text = cleanProse(remove ? joined.replace(remove, '') : joined, capitals);
    if (!text) continue;
    if (/^\p{Ll}/u.test(text) && paragraphs.length > 0) {
      // A paragraph starting in lowercase carries on a sentence from before a dropped block (a song).
      paragraphs[paragraphs.length - 1] += ` ${text}`;
    } else {
      if (dropped) endIntroduction(paragraphs);
      paragraphs.push(text);
    }
    dropped = false;
  }
  if (dropped) endIntroduction(paragraphs);
  return paragraphs.join('\n\n') + '\n';
}

/** "He began his song:" introduced a block that's gone, so it ends the paragraph instead. */
function endIntroduction(paragraphs: string[]): void {
  const last = paragraphs.length - 1;
  if (last >= 0) paragraphs[last] = paragraphs[last].replace(/:$/, '.');
}

/** Runs of non-blank lines. */
function splitBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const line of lines) {
    if (line.trim()) {
      block.push(line);
    } else if (block.length > 0) {
      blocks.push(block);
      block = [];
    }
  }
  if (block.length > 0) blocks.push(block);
  return blocks;
}

function isDropped(block: string[]): boolean {
  const first = block[0];
  const heading = first.trim();
  return (
    // Indented: songs, verse, letters, lists, tables of contents.
    /^(?: {2}|\t)/.test(first) ||
    // Footnotes and rows of asterisks.
    heading.startsWith('*') ||
    // The closing line older editions put just inside the end marker.
    /^End of (?:the )?Project Gutenberg/i.test(heading) ||
    // PART ONE, CHAPTER I (in several languages), a chapter number on its own line, THE END.
    /^(?:PART|BOOK|CHAPTER|VOLUME|CHAPITRE|LIVRE|TOME|KAPITEL|CAPITOLO|CAP[IÍ]TULO|LIBRO|LUKU|PENNOD|KAFLI)\b/iu.test(heading) ||
    (ROMAN.test(heading.replace(/\.$/, '')) && heading.length > 0) ||
    /^THE END\.?$/i.test(heading) ||
    // A heading in capitals.
    block.every((line) => !/\p{Ll}/u.test(line))
  );
}

function cleanProse(text: string, capitals: Readonly<Record<string, string>>): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    // Notes where a picture was: [Illustration: …], [Illustrazione: …]
    .replace(/\[(?:Illustra|Ilustra|Picture|Image|Imagem|Bild|Gravura)[^\]]*\]/giu, '')
    // Transcribers' conventions: superscripts (M.^{me} for Mme) and ligatures ([oe] for œ).
    .replace(/\.?\^\{([^}]*)\}/g, '$1')
    .replace(/\[(oe|OE|ae|AE)\]/g, (_, pair: string) => ({ oe: 'œ', OE: 'Œ', ae: 'æ', AE: 'Æ' })[pair]!)
    .replace(/ \*(?= |$)/g, '') // footnote markers
    .replace(/ ?-{2,} ?/g, '—')
    .replace(/_/g, '')
    // A typo that runs two sentences together: "misit.Renuntiatum".
    .replace(/(\p{Ll})([.!?])(\p{Lu})/gu, '$1$2 $3')
    .trim();
  return cleaned.replace(WORD, (word, offset: number) => ordinaryCase(word, capitals, atSentenceStart(cleaned, offset)));
}

/** A word in capitals, in ordinary case. Anything else comes back unchanged. */
function ordinaryCase(word: string, capitals: Readonly<Record<string, string>>, sentenceStart: boolean): string {
  const uppercase = word.match(/\p{Lu}/gu)?.length ?? 0;
  if (word !== word.toUpperCase() || uppercase < 2 || ROMAN.test(word)) return word;

  if (capitals[word]) return capitals[word];
  // HISPANIOLA’S: look the word up without its ending.
  const [, stem, apostrophe, ending] = word.match(/^(.+?)(['’])(.*)$/u) ?? [];
  if (stem && capitals[stem]) return capitals[stem] + apostrophe + ending.toLowerCase();

  // I’LL keeps the pronoun’s capital; anything else gets one only at the start of a sentence.
  const lower = word.toLowerCase();
  if (/^I['’]/u.test(word)) return `I${lower.slice(1)}`;
  return sentenceStart ? lower[0].toUpperCase() + lower.slice(1) : lower;
}

/** Whether `offset` is at the start of a sentence: after a full stop, or the start, and any opening quotes. */
function atSentenceStart(text: string, offset: number): boolean {
  return /(?:^|[.!?…][”’"')\]]* )[“‘"'([]*$/u.test(text.slice(0, offset));
}
