/**
 * Cleans the OCR text of a scanned book, such as the Internet Archive's full text of one, into a
 * source text: paragraphs of prose, each on one line, with a blank line between them.
 *
 * OCR text keeps the printed page as it was: its line breaks and the hyphens that split words
 * across them, its running heads and page numbers, and anything printed beside the text, such as
 * a translation in the facing column, which comes out as blocks of its own. A paragraph that runs
 * over a page comes out in pieces, with the other column's blocks between them, and is put back
 * together.
 */

export interface ScanOptions {
  /** The first line of the text proper. Everything before it is front matter. */
  startAt?: RegExp;
  /** A line to stop before, such as the index's heading. */
  endBefore?: RegExp;
  /**
   * Lines to drop wherever they fall. Lines without a lowercase letter always go: headings, running
   * heads and page numbers.
   */
  dropLines?: RegExp;
  /** Misreadings to correct in each line, as [pattern, replacement] pairs, before lines are joined. */
  misreadings?: readonly (readonly [RegExp, string])[];
  /**
   * A language printed alongside the text, such as a translation: its commonest little words
   * ("le", "et", "qui"), any letters only it uses (French é and è), and the share of a block's
   * words that marks the block as its. Such blocks are left out, and so are its footnotes.
   */
  otherLanguage?: { words: readonly string[]; letters?: RegExp; share: number };
  /** How a new paragraph starts, even where the one before seems to stop partway through a sentence. */
  paragraphStart?: RegExp;
  /** Corrections, as [pattern, replacement] pairs, made to each paragraph once it's put together. */
  fixes?: readonly (readonly [RegExp, string])[];
}

/** A block with fewer words than this can't be told apart by its words; it goes with the block before it. */
const FEW_WORDS = 4;

const WORDS = /\p{L}+/gu;

/** A paragraph that ends a sentence, perhaps inside quotation marks or brackets. */
const ENDS_SENTENCE = /[.!?…][”’"')\]]*$/u;

export function cleanScan(raw: string, options: ScanOptions = {}): string {
  const { startAt, endBefore, dropLines, misreadings = [], otherLanguage, paragraphStart, fixes = [] } = options;
  let lines = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  if (startAt) {
    const first = lines.findIndex((line) => startAt.test(line.trim()));
    if (first === -1) throw new Error(`No line matches ${startAt}`);
    lines = lines.slice(first);
  }
  if (endBefore) {
    const last = lines.findIndex((line, i) => i > 0 && endBefore.test(line.trim()));
    if (last === -1) throw new Error(`No line matches ${endBefore}`);
    lines = lines.slice(0, last);
  }
  lines = lines
    .map((line) => line.trim())
    // Lines without a lowercase letter are headings, running heads and page numbers.
    .filter((line) => !line || (/\p{Ll}/u.test(line) && !dropLines?.test(line)))
    .map((line) => misreadings.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), line));

  const paragraphs: string[] = [];
  let keptLast = true;
  for (const block of splitBlocks(lines)) {
    const text = joinLines(block);
    const words = text.match(WORDS) ?? [];
    const kept: boolean =
      words.length < FEW_WORDS
        ? keptLast && !words.some((word) => !!otherLanguage && isOtherWord(word, otherLanguage))
        : !otherLanguage || !isOther(words, otherLanguage);
    keptLast = kept;
    if (!kept || words.length === 0) continue;
    const last = paragraphs.length - 1;
    const starts = !!paragraphStart?.test(text);
    if (last >= 0 && !starts && !ENDS_SENTENCE.test(paragraphs[last])) {
      paragraphs[last] = carryOn(paragraphs[last], text);
    } else {
      // A paragraph that stopped short, before a new one that plainly starts, ends where it stopped.
      if (last >= 0 && !ENDS_SENTENCE.test(paragraphs[last])) paragraphs[last] = paragraphs[last].replace(/[\s,;:-]*$/u, '.');
      paragraphs.push(text);
    }
  }

  return (
    paragraphs
      .map((paragraph) => fixes.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), paragraph))
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter((paragraph) => /\p{L}/u.test(paragraph))
      .join('\n\n') + '\n'
  );
}

type OtherLanguage = NonNullable<ScanOptions['otherLanguage']>;

/** Whether a word is one of the other language's little words, or has one of its letters. */
const isOtherWord = (word: string, other: OtherLanguage) => other.words.includes(word.toLowerCase()) || !!other.letters?.test(word);

/** Whether enough of a block's words are the other language's to call the block its. */
function isOther(words: readonly string[], other: OtherLanguage): boolean {
  return words.filter((word) => isOtherWord(word, other)).length >= words.length * other.share;
}

/** Runs of non-blank lines. */
function splitBlocks(lines: readonly string[]): string[][] {
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const line of lines) {
    if (line) {
      block.push(line);
    } else if (block.length > 0) {
      blocks.push(block);
      block = [];
    }
  }
  if (block.length > 0) blocks.push(block);
  return blocks;
}

const BROKEN = /\p{L}[-¬]$/u;

/**
 * A block's lines as one, rejoining the words the printer split across them ("aci-" and "co"). A
 * hyphen before a capital stays: that's a compound, like "Chalco-Atenco".
 */
function joinLines(lines: readonly string[]): string {
  const joined = lines.reduce((text, line) => {
    if (!text) return line;
    if (!BROKEN.test(text)) return `${text} ${line}`;
    return /^\p{Lu}/u.test(line) ? text + line : text.slice(0, -1) + line;
  }, '');
  return joined.replace(/\s+/g, ' ').trim();
}

/**
 * A paragraph carried on in the next block, after a page break. A word split there is rejoined,
 * unless the block starts with a capital: then the word's end was lost with the page, and only
 * its start is left.
 */
function carryOn(paragraph: string, block: string): string {
  if (!BROKEN.test(paragraph)) return `${paragraph} ${block}`;
  return /^\p{Lu}/u.test(block) ? `${paragraph.slice(0, -1)} ${block}` : paragraph.slice(0, -1) + block;
}
