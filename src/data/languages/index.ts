import { inventedWords, realWords, spokenSentence, vocabularyWords, type DocParagraph } from '../../engine/document';
import type { TextSource, WordsOptions } from '../../engine/generate';
import { compileLanguage, type Language, type LanguageDef } from '../../engine/language';
import { Lexicon } from '../../engine/lexicon';
import { tokenizeParagraph, tokenizerFor, type Paragraph } from '../../engine/tokenize';
import { Vocabulary } from '../../engine/vocabulary';
import { loadCorpus, sourceText, type SourceText } from '../corpora';
import abyssal from './abyssal';
import draconic from './draconic';
import english from './english';
import englishInvented from './english-invented';
import enochian from './enochian';
import finnish from './finnish';
import french from './french';
import german from './german';
import infernal from './infernal';
import italian from './italian';
import latin from './latin';
import loremIpsum from './lorem-ipsum';
import oldEnglish from './old-english';
import oldNorse from './old-norse';
import orcish from './orcish';
import portuguese from './portuguese';
import { aquan, auran, ignan, terran } from './primordial';
import spanish from './spanish';
import welsh from './welsh';

export const LANGUAGES: readonly LanguageDef[] = [
  english,
  englishInvented,
  french,
  spanish,
  portuguese,
  italian,
  german,
  latin,
  loremIpsum,
  finnish,
  welsh,
  oldEnglish,
  oldNorse,
  enochian,
  orcish,
  draconic,
  infernal,
  abyssal,
  aquan,
  auran,
  ignan,
  terran,
];

export function languageDef(id: string): LanguageDef {
  const def = LANGUAGES.find((language) => language.id === id);
  if (!def) throw new Error(`No language "${id}"`);
  return def;
}

/** A language ready to write in: compiled, with its flow text loaded and its vocabulary built. */
export interface LoadedLanguage extends TextSource {
  language: Language;
  /** The text whose flow it borrows, for crediting. */
  source: SourceText;
}

const loaded = new Map<string, Promise<LoadedLanguage>>();

/** How many languages made in the builder stay loaded; each version of one is a language of its own. */
const MADE_KEPT = 6;

/**
 * A language ready to write in: a built-in one by its id, or any language by its definition, as
 * one made in the builder is. A definition is known by its whole content, so an edited language
 * is built afresh.
 */
export function loadLanguage(language: string | LanguageDef): Promise<LoadedLanguage> {
  const key = typeof language === 'string' ? language : languageKey(language);
  let found = loaded.get(key);
  if (!found) {
    const def = typeof language === 'string' ? languageDef(language) : language;
    found = Promise.resolve().then(() => build(def));
    found.catch(() => loaded.delete(key));
    loaded.set(key, found);
    // Maps keep their order, so the oldest made languages are the first keys with a definition.
    const made = [...loaded.keys()].filter((known) => known.startsWith('{'));
    for (const old of made.slice(0, Math.max(0, made.length - MADE_KEPT))) loaded.delete(old);
  }
  return found;
}

/** What identifies a language: a built-in one's id, or the whole of any other's definition. */
export function languageKey(def: LanguageDef): string {
  return LANGUAGES.includes(def) ? def.id : JSON.stringify(def);
}

async function build(def: LanguageDef): Promise<LoadedLanguage> {
  const language = compileLanguage(def);
  const source = sourceText(def.flow);
  const flow = await loadCorpus(def.flow);
  const base = { language, source, flow };

  switch (language.kind) {
    case 'real':
      return { ...base, words: realWords };
    case 'invented': {
      const lexicon = new Lexicon(language, flow, source.language);
      return { ...base, words: (paragraphs: Paragraph[]) => inventedWords(paragraphs, lexicon, flow.options, language.punctuation) };
    }
    case 'vocabulary': {
      const vocabularySource = sourceText(language.vocabulary);
      const vocabulary = new Vocabulary(language, flow, await loadCorpus(language.vocabulary), source.language);
      const opening = language.opening
        ? spokenSentence(tokenizeParagraph(language.opening, tokenizerFor(vocabularySource.language)).sentences[0].tokens, language.pronounce)
        : null;
      return {
        ...base,
        words: (paragraphs: Paragraph[], options: WordsOptions = {}): DocParagraph[] => {
          const converted = vocabularyWords(paragraphs, vocabulary, flow.options);
          if (!opening || options.opening === false || converted.length === 0) return converted;
          const [first, ...rest] = converted;
          return [{ sentences: [opening, ...first.sentences] }, ...rest];
        },
      };
    }
  }
}
