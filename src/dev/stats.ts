/**
 * Statistics for tuning a sound system: what a language's words look and sound like in running
 * text, beside the source text they stand in for. The lab page (lab.html) shows them.
 */
import type { DocParagraph, DocWord } from '../engine/document';

export interface Tally {
  item: string;
  count: number;
  /** Its share of all the items counted, from 0 to 1. */
  share: number;
}

/** Items most common first (ties in alphabetical order), with their share of the whole. */
export function tally(items: Iterable<string>): Tally[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
    total++;
  }
  return [...counts]
    .map(([item, count]) => ({ item, count, share: count / total }))
    .sort((a, b) => b.count - a.count || (a.item < b.item ? -1 : a.item > b.item ? 1 : 0));
}

export interface TextStats {
  words: number;
  /** Distinct words, ignoring case. */
  vocabulary: number;
  /** Letters per word, on average. */
  letters: number;
  /** The share of words with one syllable, two, three, four, and five or more. Empty for real words. */
  syllables: number[];
  /** Sounds over all the words, most common first. Empty for real words. */
  sounds: Tally[];
  /** Letters, most common first, ignoring case. */
  alphabet: Tally[];
  /** Words, most common first, ignoring case. */
  common: Tally[];
  /** The share of syllables that end in a consonant. */
  closed: number;
  /** The share of words that start with a vowel sound. */
  vowelFirst: number;
  /** The share of words whose stress is marked, off where the rule puts it. */
  marked: number;
}

export function textStats(paragraphs: readonly DocParagraph[]): TextStats {
  const words: DocWord[] = [];
  for (const paragraph of paragraphs) {
    for (const sentence of paragraph.sentences) for (const token of sentence.tokens) if (token.kind === 'word') words.push(token);
  }
  const spoken = words.flatMap((word) => word.spoken ?? []);
  const syllables = spoken.flatMap((word) => word.syllables);
  const letters = words.map((word) => [...word.text.toLowerCase()].filter((char) => /\p{L}/u.test(char)));

  const histogram = [0, 0, 0, 0, 0];
  for (const word of spoken) histogram[Math.min(5, word.syllables.length) - 1]++;
  const share = (count: number, of: number) => (of === 0 ? 0 : count / of);

  return {
    words: words.length,
    vocabulary: new Set(words.map((word) => word.text.toLowerCase())).size,
    letters: share(
      letters.reduce((sum, word) => sum + word.length, 0),
      words.length,
    ),
    syllables: spoken.length === 0 ? [] : histogram.map((count) => share(count, spoken.length)),
    sounds: tally(syllables.flatMap((syllable) => [...syllable.onset, syllable.nucleus, ...syllable.coda])),
    alphabet: tally(letters.flat()),
    common: tally(words.map((word) => word.text.toLowerCase())),
    closed: share(syllables.filter((syllable) => syllable.coda.length > 0).length, syllables.length),
    vowelFirst: share(spoken.filter((word) => word.syllables[0]?.onset.length === 0).length, spoken.length),
    marked: share(spoken.filter((word) => word.marked).length, spoken.length),
  };
}
