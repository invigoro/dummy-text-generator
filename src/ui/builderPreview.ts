/**
 * What the language builder shows as a language is edited: what's wrong with it, part by part, and
 * samples of it. Samples come from an excerpt of the flow text, so they're quick enough to redo
 * as you type; the whole text is used once the language is written in.
 */
import { sourceText } from '../data/corpora';
import { arrange } from '../engine/arrange';
import { inventedWords, sayWords, spokenText, writtenText, type DocWord } from '../engine/document';
import { compileLanguage, stressRule, type InventedLanguageDef } from '../engine/language';
import { Lexicon } from '../engine/lexicon';
import { mulberry32 } from '../engine/rng';
import { compileSounds } from '../engine/sounds/system';
import { inventWord } from '../engine/sounds/words';
import { compileSpelling, spell } from '../engine/spelling';
import { countWords, type Corpus } from '../engine/tokenize';
import { languageProblem } from './customLanguages';

export interface Problems {
  /** In the sound classes or syllable shapes. */
  sounds?: string;
  spelling?: string;
  /** Anything else, found when the language is tried out. */
  other?: string;
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** A spelling rule still being written, which counts for nothing until it's finished. */
export const unfinishedRule = (rule: { sounds: string; write: string }) => !rule.sounds.trim() || !rule.write.trim();

/**
 * What's wrong with a language, part by part, so each message can go beside its part. A spelling
 * rule that's only half written isn't wrong yet; it's left out until it's finished.
 */
export function problems(def: InventedLanguageDef): Problems {
  const found: Problems = {};
  const empty = Object.entries(def.sounds.classes).find(([, list]) => !list.trim());
  try {
    if (empty) throw new Error(`Class ${empty[0]} has no sounds yet`);
    if (!def.sounds.syllables.trim()) throw new Error('Syllables need a shape or two');
    compileSounds(def.sounds);
  } catch (error) {
    found.sounds = messageOf(error);
  }
  const spelling = def.spelling.filter((rule) => !unfinishedRule(rule));
  try {
    compileSpelling(spelling);
  } catch (error) {
    found.spelling = messageOf(error);
  }
  if (!found.sounds && !found.spelling) {
    const other = languageProblem({ ...def, spelling });
    if (other) found.other = other;
  }
  return found;
}

export const hasProblems = (found: Problems) => !!(found.sounds || found.spelling || found.other);

const EXCERPT_WORDS = 3000;
const excerpts = new WeakMap<Corpus, Corpus>();

/** The first few thousand words of a text, enough to show its flow. */
export function excerpt(corpus: Corpus): Corpus {
  let found = excerpts.get(corpus);
  if (!found) {
    const paragraphs = [];
    let words = 0;
    for (const paragraph of corpus.paragraphs) {
      if (words >= EXCERPT_WORDS) break;
      paragraphs.push(paragraph);
      words += countWords(paragraph.sentences);
    }
    found = { paragraphs, options: corpus.options };
    excerpts.set(corpus, found);
  }
  return found;
}

export interface SampleWord {
  written: string;
  say: string;
}

export interface Preview {
  /** Words straight from the sound system, of one to four syllables. */
  words: SampleWord[];
  /** A passage on the flow text's rhythm, once the text has loaded. */
  passage: { written: string; say: string } | null;
}

/** Samples of a language that works; null for one that doesn't. */
export function preview(def: InventedLanguageDef, flow: Corpus | null, seed: number): Preview | null {
  if (hasProblems(problems(def))) return null;
  const language = compileLanguage(def);
  if (language.kind !== 'invented') return null;
  const rule = stressRule(language)!;

  const words = Array.from({ length: 16 }, (_, i) => {
    const random = mulberry32(seed * 7919 + i);
    const sounds = inventWord(language.system, random, { syllables: 1 + (i % 4) });
    const word: DocWord = { kind: 'word', text: spell(sounds, language.rules, random), spoken: [sounds] };
    return { written: word.text, say: sayWords({ tokens: [word] }, rule, language.respell)[0]!.say };
  });
  if (!flow) return { words, passage: null };

  const text = excerpt(flow);
  const lexicon = new Lexicon(language, text, sourceText(def.flow).language);
  const paragraphs = arrange(text, 'sentences', { unit: 'words', count: 60 }, mulberry32(seed));
  const doc = inventedWords(paragraphs, lexicon, text.options, language.punctuation);
  return { words, passage: { written: writtenText(doc), say: spokenText(doc, rule, language.respell, 'say') } };
}
