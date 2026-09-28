import { describe, expect, it } from 'vitest';
import { namesOf, personNames, placeNames, type NameRecipe } from './names';
import { mulberry32 } from './rng';
import { tokenize, tokenizerFor, type Corpus } from './tokenize';

const corpus = (language: string, text: string): Corpus => ({ ...tokenize(text, tokenizerFor(language)), language });

const english = corpus(
  'en',
  [
    ...Array.from({ length: 4 }, () => '“Ahoy,” said Silver, and Hawkins ran, and Livesey laughed, and Trelawney slept, and Smollett swore.'),
    ...Array.from({ length: 4 }, () => 'Then Morgan cried, and Gray fell, and Hunter sang, while Silver and Hawkins watched.'),
    'We sailed from Bristol to London, and from London to Bristol, and back to Bristol again, and in London we stayed.',
    'He read the Bible, and prayed to God, and the English cheered, and the English sang, and English songs rang out.',
    ...Array.from({ length: 70 }, (_, i) => `The lantern ${i} shone over the harbour, the rigging, the anchor, the barrel and the cabin.`),
  ].join('\n\n'),
);

const text = (recipe: NameRecipe) => recipe.words.join(recipe.kind === 'compound' ? recipe.joiner : ' ');

describe('namesOf', () => {
  it('sorts the names of people from places, and leaves out titles and nationalities', () => {
    const { people, places } = namesOf(english);
    expect(people).toEqual(expect.arrayContaining(['Silver', 'Hawkins', 'Smollett', 'Morgan', 'Gray', 'Hunter']));
    expect(places).toEqual(expect.arrayContaining(['Bristol', 'London']));
    for (const word of ['Bristol', 'London', 'Bible', 'English', 'God']) expect(people).not.toContain(word);
  });
});

describe('personNames', () => {
  it('names people after the text’s own, as many as asked for, none twice', () => {
    const names = personNames(english, 10, mulberry32(1));
    expect(names).toHaveLength(10);
    expect(new Set(names.map(text)).size).toBe(10);
    const people = new Set(namesOf(english).people);
    for (const name of names) for (const word of name.words) expect(people.has(word), word).toBe(true);
  });

  it('puts the language’s particle between names now and then', () => {
    const french = corpus(
      'fr',
      Array.from({ length: 12 }, () => 'Athos parla à Porthos, et Aramis répondit à Tréville; puis Planchet rit avec Grimaud.').join('\n\n'),
    );
    const names = personNames(french, 30, mulberry32(2)).map(text);
    expect(names.some((name) => / de /.test(name))).toBe(true);
    expect(names.every((name) => !/ à /.test(name))).toBe(true);
  });
});

describe('placeNames', () => {
  it('joins an ordinary word to an English place word', () => {
    const names = placeNames(english, 8, mulberry32(3));
    expect(names).toHaveLength(8);
    for (const name of names) {
      expect(name.kind).toBe('compound');
      expect(name.words[1]).toMatch(/^(?:ford|wood|hill|stone|port|mouth|cove|water|bay|head|well|bridge|field|haven|moor|marsh)$/);
      // Plurals and verbs make poor places.
      expect(name.words[0]).not.toMatch(/(?:ing|ed|[^s]s)$/);
    }
  });

  it('starts a place in the language’s own way: "Saint-" in French, "Puerto" in Spanish, "Llan" in Welsh', () => {
    const words = ['mardon', 'telvic', 'brune', 'kernol', 'vistul', 'dorin', 'palom', 'sirel', 'tobin', 'gavel', 'morin', 'lusk'];
    const text = (language: string) =>
      corpus(language, Array.from({ length: 90 }, (_, i) => `Then Gwen and Athos saw ${words.join(' ')} ${i}.`).join('\n\n'));
    const french = placeNames(text('fr'), 20, mulberry32(4));
    expect(french.some((name) => name.kind === 'compound' && name.joiner === '-' && /^(?:Saint|Sainte|Mont|Port|Val)$/.test(name.words[0]))).toBe(true);
    const spanish = placeNames(text('es'), 12, mulberry32(4));
    expect(spanish.every((name) => name.kind === 'words' && /^(?:Villa|Puerto|Monte|San|Valle|Sierra|Santa)$/.test(name.words[0]))).toBe(true);
    const welsh = placeNames(text('cy'), 12, mulberry32(4));
    expect(welsh.every((name) => name.kind === 'compound' && name.joiner === '' && /^(?:Aber|Llan|Pen|Tre|Caer|Nant|Bryn|Cwm)$/.test(name.words[0]))).toBe(true);
  });
});
