import { arrange, MAX_LENGTH, type Arrangement, type Length } from './arrange';
import type { DocParagraph, DocSentence, DocWord } from './document';
import { conversation, inscription, SPEAKERS, type Form } from './forms';
import { stressRule, type Language } from './language';
import { personNames, placeNames, type NameKind, type NameRecipe } from './names';
import { mulberry32 } from './rng';
import { stressOf, type WordSounds } from './sounds/system';
import type { Corpus, Paragraph, Token } from './tokenize';

export interface GenerateOptions {
  arrangement: Arrangement;
  length: Length;
  /** The same seed and options always give the same text. */
  seed: number;
  /** Prose unless it says otherwise. */
  form?: Form;
  /** How many speakers a conversation has: two to four. */
  speakers?: number;
  /** What the names form names: people or places. */
  names?: NameKind;
}

export interface WordsOptions {
  /** Whether to start with the language's set opening, if it has one (lorem ipsum's). Prose does. */
  opening?: boolean;
}

/** Where a language's text comes from: a flow to arrange, and a way to put it in the language's words. */
export interface TextSource {
  flow: Corpus;
  words(paragraphs: Paragraph[], options?: WordsOptions): DocParagraph[];
  /** The language, for where a name made of two words is stressed. */
  language?: Language;
}

export function generate(source: TextSource, options: GenerateOptions): DocParagraph[] {
  const random = mulberry32(options.seed);
  const { arrangement, length } = options;
  switch (options.form ?? 'prose') {
    case 'prose':
      return source.words(arrange(source.flow, arrangement, length, random));
    case 'inscription':
      return source.words(inscription(source.flow, arrangement, length, random), { opening: false });
    case 'names': {
      const count = Math.min(MAX_LENGTH.paragraphs, Math.max(0, Math.floor(length.count)));
      // Two source names can come out as one (lorem ipsum has few words), so there are spares.
      const spares = count * 3;
      const recipes =
        options.names === 'places' ? placeNames(source.flow, spares, random) : personNames(source.flow, spares, random);
      const rule = source.language ? stressRule(source.language) : null;
      const seen = new Set<string>();
      return recipes
        .map((recipe) => nameFrom(recipe, source, rule))
        .filter((name) => {
          const written = name.sentences.map((sentence) => sentence.tokens.map((token) => token.text).join('')).join(' ').toLowerCase();
          if (seen.has(written)) return false;
          seen.add(written);
          return true;
        })
        .slice(0, count);
    }
    case 'conversation': {
      const talk = conversation(source.flow, arrangement, length, options.speakers ?? SPEAKERS.min, random);
      const names = speakerNames(source, talk.names, Math.max(0, ...talk.order) + 1);
      return source.words(talk.lines, { opening: false }).map((line, i) => ({ ...line, speaker: names[talk.order[i]] }));
    }
  }
}

/**
 * Names for the speakers, in the language: source names turned into its words, each followed by a
 * colon ("Athos:" in French is "Ouvanis :"). Two source names can come out as one word, as in lorem
 * ipsum's small vocabulary, so each is checked against those already taken.
 */
function speakerNames(source: TextSource, candidates: readonly string[], count: number): DocSentence[] {
  const names: DocSentence[] = [];
  const taken = new Set<string>();
  for (const candidate of candidates) {
    if (names.length === count) break;
    const [paragraph] = source.words([{ sentences: [{ tokens: [{ kind: 'word', text: candidate }, { kind: 'punct', text: ':' }] }] }], {
      opening: false,
    });
    const name = paragraph?.sentences[0];
    const written = name?.tokens.find((token) => token.kind === 'word')?.text;
    if (!name || !written || taken.has(written.toLowerCase())) continue;
    taken.add(written.toLowerCase());
    names.push(name);
  }
  // Short of names (a text with almost no words), speakers are lettered.
  for (let i = names.length; i < count; i++) {
    names.push({ tokens: [{ kind: 'word', text: String.fromCharCode(65 + i) }, { kind: 'punct', text: ':' }] });
  }
  return names;
}

const SPACE: Token = { kind: 'space', text: ' ' };

/** A source word in the language's words. */
function wordOf(source: TextSource, word: string): DocWord {
  const [paragraph] = source.words([{ sentences: [{ tokens: [{ kind: 'word', text: word }] }] }], { opening: false });
  const found = paragraph?.sentences[0]?.tokens.find((token) => token.kind === 'word');
  return found?.kind === 'word' ? found : { kind: 'word', text: word };
}

/**
 * A name in the language's words. Two words made one run their syllables together, stressed by
 * the language's rule: "Doumé" and "voren" make "Doumévoren", said as one word.
 */
function nameFrom(recipe: NameRecipe, source: TextSource, rule: ReturnType<typeof stressRule>): DocParagraph {
  if (recipe.kind === 'words') {
    const tokens = recipe.words.flatMap((word, i): Token[] => (i === 0 ? [{ kind: 'word', text: word }] : [SPACE, { kind: 'word', text: word }]));
    const [paragraph] = source.words([{ sentences: [{ tokens }] }], { opening: false });
    return { sentences: paragraph?.sentences ?? [] };
  }
  const [first, second] = recipe.words.map((word) => wordOf(source, word));
  const hyphened = recipe.joiner === '-';
  const joined = hyphened ? `${first.text}-${second.text}` : (first.text + second.text.toLowerCase()).replace(/\p{L}/u, (letter) => letter.toUpperCase());
  // Where the two meet, no letter comes three times: "Pwll" and "lidd" make "Pwllidd".
  const text = joined.replace(/(\p{L})\1\1+/gu, '$1$1');
  let spoken: WordSounds[] | undefined;
  if (first.spoken && second.spoken) {
    const syllables = [...first.spoken, ...second.spoken].flatMap((part) => part.syllables);
    spoken = hyphened ? [...first.spoken, ...second.spoken] : [{ syllables, stress: rule ? stressOf(rule, syllables) : null }];
  }
  return { sentences: [{ tokens: [spoken ? { kind: 'word', text, spoken } : { kind: 'word', text }] }] };
}
