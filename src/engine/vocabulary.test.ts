import { describe, expect, it } from 'vitest';
import loremIpsum from '../data/languages/lorem-ipsum';
import { compileLanguage, type Language } from './language';
import { tokenize, tokenizerFor } from './tokenize';
import { Vocabulary } from './vocabulary';

const language = compileLanguage(loremIpsum) as Extract<Language, { kind: 'vocabulary' }>;
const latin = tokenizerFor('la');
const vocabulary = tokenize('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', latin);
const flow = tokenize('Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.', latin);
const known = new Set(vocabulary.paragraphs[0].sentences[0].tokens.filter((t) => t.kind === 'word').map((t) => t.text.toLowerCase()));

describe('Vocabulary', () => {
  const words = new Vocabulary(language, flow, vocabulary, 'la');

  it('only uses words from the vocabulary', () => {
    for (const source of ['gallia', 'est', 'omnis', 'appellantur', 'something-else', 'zzz']) expect(known).toContain(words.word(source).spelling);
  });

  it('gives every word its own vocabulary word while there are enough to go round', () => {
    const short = tokenize('Gallia est omnis divisa in partes tres.', latin);
    const own = new Vocabulary(language, short, vocabulary, 'la');
    const flowWords = ['gallia', 'est', 'omnis', 'divisa', 'in', 'partes', 'tres'];
    expect(new Set(flowWords.map((word) => own.word(word).spelling)).size).toBe(flowWords.length);
  });

  it('matches words by length', () => {
    expect(words.word('in').sounds.syllables).toHaveLength(1);
    expect(words.word('appellantur').sounds.syllables.length).toBeGreaterThanOrEqual(3);
  });

  it('is the same every time', () => {
    expect(new Vocabulary(language, flow, vocabulary, 'la').word('omnis')).toEqual(words.word('omnis'));
  });
});
