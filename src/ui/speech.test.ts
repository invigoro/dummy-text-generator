import { describe, expect, it } from 'vitest';
import { chunks, readingOf, voiceFor } from './speech';

const voice = (name: string, lang: string) => ({ name, lang });
const french = voice('Amélie', 'fr-FR');
const quebec = voice('Chantal', 'fr_CA');
const english = voice('Daniel', 'en-GB');

describe('voiceFor', () => {
  it('prefers the exact tag, then any voice of the language', () => {
    expect(voiceFor([quebec, french, english], ['fr-FR', 'fr'])).toBe(french);
    expect(voiceFor([quebec, english], ['fr-FR', 'fr'])).toBe(quebec);
    expect(voiceFor([english], ['fr-FR', 'fr'])).toBeNull();
  });
});

describe('readingOf', () => {
  it('reads a language spelled like a real one in a voice for it, from its written text', () => {
    expect(readingOf('french', [english, french], 'Oui, dit-il.', 'WEE, dee EEL.')).toEqual({
      text: 'Oui, dit-il.',
      voice: french,
      lang: 'fr-FR',
      describe: 'Read by Amélie',
    });
  });

  it('reads the "say it" line in English where there’s no such voice, in lowercase so no capital is spelled out', () => {
    for (const [id, voices] of [['french', [english]], ['orcish', [french, english]], ['my-grukk-abcde', [english]]] as const) {
      expect(readingOf(id, voices, 'Grukk!', 'GROOK!')).toEqual({
        text: 'grook!',
        voice: english,
        lang: 'en-GB',
        describe: 'Read from the “say it” line by Daniel',
      });
    }
  });

  it('reads real English as it is, and makes do without voices', () => {
    expect(readingOf('english', [english], 'Ahoy.', null).text).toBe('Ahoy.');
    expect(readingOf('orcish', [], 'Grukk!', 'GROOK!')).toEqual({ text: 'grook!', voice: null, lang: 'en', describe: 'Read from the “say it” line' });
  });
});

describe('chunks', () => {
  it('splits text into sentences', () => {
    expect(chunks('One. Two! Three?\n\nFour… Five')).toEqual(['One.', 'Two!', 'Three?', 'Four…', 'Five']);
  });

  it('breaks a long sentence at a comma, or else at a space', () => {
    const long = `${'word '.repeat(12).trim()}, ${'more '.repeat(30).trim()}.`;
    const pieces = chunks(long, 100);
    expect(pieces[0]).toBe(`${'word '.repeat(12).trim()},`);
    for (const piece of pieces) expect(piece.length).toBeLessThanOrEqual(100);
    expect(pieces.join(' ')).toBe(long);
    expect(pieces.length).toBeGreaterThan(2);
  });
});
