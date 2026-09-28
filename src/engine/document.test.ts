import { describe, expect, it } from 'vitest';
import french from '../data/languages/french';
import latin from '../data/languages/latin';
import {
  countDocWords,
  inventedWords,
  inventWordToken,
  sayWords,
  spokenText,
  writtenText,
  type DocParagraph,
  type DocWord,
} from './document';
import { compileLanguage, type Language } from './language';
import { Lexicon } from './lexicon';
import { tokenize, tokenizerFor } from './tokenize';

function invented(def: typeof french, text: string, language: string) {
  const compiled = compileLanguage(def) as Extract<Language, { kind: 'invented' }>;
  const options = tokenizerFor(language);
  const corpus = tokenize(text, options);
  const lexicon = new Lexicon(compiled, corpus, language);
  return { compiled, corpus, lexicon, options, doc: inventedWords(corpus.paragraphs, lexicon, options, compiled.punctuation) };
}

const words = (doc: DocParagraph[]) =>
  doc.flatMap((p) => p.sentences.flatMap((s) => s.tokens.filter((t): t is DocWord => t.kind === 'word')));

describe('inventWordToken', () => {
  const { lexicon } = invented(french, 'Le château de Meung. Voilà l’homme.', 'fr');

  it('keeps the source word’s capitals', () => {
    const plain = inventWordToken('château', lexicon, 'before').text;
    expect(inventWordToken('Château', lexicon, 'before').text).toBe(plain[0].toUpperCase() + plain.slice(1));
    expect(inventWordToken('CHÂTEAU', lexicon, 'before').text).toBe(plain.toUpperCase());
  });

  it('keeps numbers, including Roman numerals', () => {
    expect(inventWordToken('1625', lexicon, 'before')).toEqual({ kind: 'word', text: '1625' });
    expect(inventWordToken('XIII', lexicon, 'before')).toEqual({ kind: 'word', text: 'XIII' });
  });

  it('says a hyphenated word as two words', () => {
    expect(inventWordToken('lie-de-vin', lexicon, 'before').spoken).toHaveLength(3);
  });

  it('writes a French elision with an apostrophe and says it with the next word', () => {
    const token = inventWordToken('l’homme', lexicon, 'before');
    const clitic = lexicon.clitic('l');
    expect(token.text).toBe(`${clitic.spelling}’${lexicon.word('homme').spelling}`);
    expect(token.spoken).toHaveLength(1);
    expect(token.spoken![0].syllables[0].onset[0]).toBe(clitic.consonants[0]);
  });

  it('says an English contraction’s consonant at the end of the word before it', () => {
    const english = invented(french, 'I don’t know.', 'en');
    const token = inventWordToken('don’t', english.lexicon, 'after');
    const clitic = english.lexicon.clitic('t');
    expect(token.spoken![0].syllables.at(-1)!.coda.at(-1)).toBe(clitic.consonants[0]);
  });
});

describe('kept words', () => {
  it('leaves a language’s kept words real, as written, with no "say it" form of their own', () => {
    const def = { ...french, keep: ['the', 'thou', "'tis"] };
    const { doc } = invented(def, '’Tis the hour, and thou art late. The night is cold.', 'en');
    const texts = words(doc).map((word) => word.text);
    expect(texts).toEqual(expect.arrayContaining(['’Tis', 'the', 'thou', 'The']));
    for (const word of words(doc)) {
      if (['’Tis', 'the', 'thou', 'The'].includes(word.text)) expect(word.spoken).toBeUndefined();
      else expect(word.spoken).toBeDefined();
    }
    expect(texts).not.toContain('hour');
  });
});

describe('inventedWords', () => {
  it('uses the language’s quotation marks and spacing', () => {
    const { doc } = invented(french, '« Où est-il? » dit-il. Quoi!', 'fr');
    const text = writtenText(doc);
    expect(text).toMatch(/^« \S.* \? » /u);
    expect(text).toMatch(/ !$/u);
  });

  it('keeps initials and titles', () => {
    const { doc } = invented(french, 'M. de Tréville parla. Mme Bonacieux attendit.', 'fr');
    const text = writtenText(doc);
    expect(text.startsWith('M. ')).toBe(true);
    expect(text).toContain('Mme ');
  });
});

describe('sayWords', () => {
  it('stresses only the end of each phrase in French', () => {
    const { compiled, doc } = invented(french, 'Le chevalier regarda le château, et le château regarda le chevalier.', 'fr');
    const said = sayWords(doc[0].sentences[0], 'phrase', compiled.respell).filter((word) => word !== null);
    const stressed = said.map((word) => /\p{Lu}/u.test(word!.say));
    expect(stressed.filter(Boolean)).toHaveLength(2);
  });

  it('stresses every longer word in Latin, and no single syllables', () => {
    const { compiled, doc } = invented(latin, 'Gallia est omnis divisa in partes tres.', 'la');
    const said = sayWords(doc[0].sentences[0], 'latin', compiled.respell);
    words(doc).forEach((word, i) => {
      const say = said.filter((s) => s !== null)[i]!.say;
      if (word.spoken![0].syllables.length > 1) expect(say).toMatch(/\p{Lu}/u);
      else expect(say).toBe(say.toLowerCase());
    });
  });
});

describe('spokenText and writtenText', () => {
  const { compiled, doc } = invented(french, '« Où est-il? » dit-il.\n\nPuis il partit.', 'fr');

  it('puts a blank line between paragraphs', () => {
    expect(writtenText(doc).split('\n\n')).toHaveLength(2);
    expect(spokenText(doc, 'phrase', compiled.respell, 'say').split('\n\n')).toHaveLength(2);
  });

  it('writes "say it" with plain quotation marks and no French spaces', () => {
    const say = spokenText(doc, 'phrase', compiled.respell, 'say');
    expect(say).not.toMatch(/[«» ]/u);
    expect(say).toMatch(/^“[a-z].*\?” /u);
  });

  it('counts words', () => {
    expect(countDocWords(doc)).toBe(words(doc).length);
  });
});
