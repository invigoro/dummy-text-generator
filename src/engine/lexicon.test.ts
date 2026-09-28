import { describe, expect, it } from 'vitest';
import french from '../data/languages/french';
import { isOffensive } from './blocklist';
import { compileLanguage } from './language';
import { estimateSyllables, Lexicon, pieces } from './lexicon';
import { tokenize, tokenizerFor } from './tokenize';

const parts = (text: string, elision: 'before' | 'after') =>
  pieces(text, elision).map((piece) => (piece.kind === 'join' ? piece.text : `${piece.text}${piece.clitic ? '*' : ''}${piece.vowelFirst ? '^' : ''}`));

describe('pieces', () => {
  it('finds French elisions before the apostrophe, and the vowel-first word after', () => {
    expect(parts('l’auteur', 'before')).toEqual(['l*', '’', 'auteur^']);
    expect(parts('qu’il', 'before')).toEqual(['qu*', '’', 'il^']);
    expect(parts('jusqu’à', 'before')).toEqual(['jusqu', '’', 'à']);
  });

  it('finds English contractions after the apostrophe', () => {
    expect(parts('don’t', 'after')).toEqual(['don', '’', 't*']);
    expect(parts('he’ll', 'after')).toEqual(['he', '’', 'll*']);
    expect(parts('’em', 'after')).toEqual(['’', 'em']);
    expect(parts('o’', 'after')).toEqual(['o', '’']);
  });

  it('splits compounds at hyphens', () => {
    expect(parts('sea-chest', 'after')).toEqual(['sea', '-', 'chest']);
  });
});

describe('estimateSyllables', () => {
  it('counts vowel groups', () => {
    expect(estimateSyllables('de', 'fr')).toBe(1);
    expect(estimateSyllables('maison', 'fr')).toBe(2);
    expect(estimateSyllables('Helvetii', 'la')).toBe(3);
    expect(estimateSyllables('sjóskrímsl', 'is')).toBe(2);
  });

  it('knows final e is silent in French and English', () => {
    expect(estimateSyllables('porte', 'fr')).toBe(1);
    expect(estimateSyllables('parlent', 'fr')).toBe(1);
    expect(estimateSyllables('stone', 'en')).toBe(1);
    expect(estimateSyllables('stone', 'la')).toBe(2);
  });

  it('gives a word with no vowels one syllable', () => {
    expect(estimateSyllables('l', 'fr')).toBe(1);
  });
});

describe('Lexicon', () => {
  const language = compileLanguage(french);
  if (language.kind !== 'invented') throw new Error('French should be invented');
  const text = [
    'Le chevalier regarda le château. Le château était grand, et le chevalier était petit.',
    'Il vit l’homme et l’arbre. L’homme parla au chevalier.',
    'Un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize.',
  ].join('\n\n');
  const corpus = tokenize(text, tokenizerFor('fr'));
  const lexicon = new Lexicon(language, corpus, 'fr');

  it('gives the same invented word every time, whatever the case', () => {
    expect(lexicon.word('château')).toEqual(lexicon.word('CHÂTEAU'));
    expect(new Lexicon(language, corpus, 'fr').word('chevalier')).toEqual(lexicon.word('chevalier'));
  });

  it('gives different words different invented words', () => {
    const words = ['le', 'chevalier', 'château', 'était', 'et', 'grand', 'petit', 'homme', 'arbre', 'un', 'deux', 'trois'];
    expect(new Set(words.map((word) => lexicon.word(word).spelling)).size).toBe(words.length);
  });

  it('keeps short words short and long words long', () => {
    expect(lexicon.word('le').sounds.syllables).toHaveLength(1);
    expect(lexicon.word('chevalier').sounds.syllables.length).toBeGreaterThanOrEqual(3);
  });

  it('starts a word that follows an elision with a vowel', () => {
    for (const word of ['homme', 'arbre']) expect(lexicon.word(word).sounds.syllables[0].onset).toEqual([]);
  });

  it('gives clitics a single consonant', () => {
    const clitic = lexicon.clitic('l');
    expect(clitic.consonants).toHaveLength(1);
    expect(clitic.spelling).toMatch(/^\p{L}{1,3}$/u);
  });

  it('never invents an offensive word', () => {
    for (let i = 0; i < 2000; i++) {
      const word = lexicon.word(`mot${i}`);
      expect(isOffensive(word.spelling, language.respell.say(word.sounds, null), 'fr')).toBe(false);
    }
  });
});
