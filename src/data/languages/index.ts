import { inventedWords, realWords, spokenSentence, vocabularyWords, type DocParagraph } from '../../engine/document';
import type { TextSource } from '../../engine/generate';
import { compileLanguage, type Language, type LanguageDef } from '../../engine/language';
import { Lexicon } from '../../engine/lexicon';
import { tokenizeParagraph, tokenizerFor, type Paragraph } from '../../engine/tokenize';
import { Vocabulary } from '../../engine/vocabulary';
import { loadCorpus, sourceText, type SourceText } from '../corpora';
import english from './english';
import french from './french';
import latin from './latin';
import loremIpsum from './lorem-ipsum';
import oldNorse from './old-norse';

export const LANGUAGES: readonly LanguageDef[] = [english, french, latin, loremIpsum, oldNorse];

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

export function loadLanguage(id: string): Promise<LoadedLanguage> {
  let language = loaded.get(id);
  if (!language) {
    language = Promise.resolve().then(() => build(languageDef(id)));
    language.catch(() => loaded.delete(id));
    loaded.set(id, language);
  }
  return language;
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
        words: (paragraphs: Paragraph[]): DocParagraph[] => {
          const converted = vocabularyWords(paragraphs, vocabulary, flow.options);
          if (!opening || converted.length === 0) return converted;
          const [first, ...rest] = converted;
          return [{ sentences: [opening, ...first.sentences] }, ...rest];
        },
      };
    }
  }
}
