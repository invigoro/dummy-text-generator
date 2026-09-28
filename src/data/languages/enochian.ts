import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Enochian, after the angelic language John Dee recorded in the 1580s: short words like
 * "ol", "od" and "ds", z, q and v everywhere, vowels running together ("iaida"), and the slow
 * evenness of an incantation. Project Gutenberg has no Enochian, so it borrows Latin's flow.
 */
const enochian: InventedLanguageDef = {
  kind: 'invented',
  id: 'enochian',
  name: 'Enochian',
  flow: 'la-de-bello-gallico',
  sounds: {
    classes: {
      C: 'z:4 d:4 n:4 l:4 r:4 s:4 m:4 k:4 t:3 g:3 b:3 p:3 v:3 h:3 f:2 ʃ:1 tʃ:1 j:1',
      V: 'o:8 a:8 i:6 e:5 u:3 aɪ:0.5',
      F: 'n:4 r:4 l:3 s:3 d:2 z:2 m:2 t:2 g:1 k:1 f:1 p:1 r+s:0.4 s+g:0.3 l+p:0.3 n+g:0.3',
    },
    first: 'CV:6 CVF:5 V:2 VF:2',
    syllables: 'CV:6 CVF:4 V:1',
    last: 'CV:4 CVF:6 V:0.5',
    single: 'CV:3 VF:3 CVF:3 V:2',
    stress: 'penultimate',
    hiatus: true,
    avoid: ['jj|ji', '(.)\\1\\1'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'k', write: 'c:3 q:2 k:1' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'j', write: 'i' },
    { sounds: 'aɪ', write: 'ai' },
  ],
  say: {
    e: { sayClosed: 'e' },
    i: { sayClosed: 'i' },
    o: { sayClosed: 'o' },
  },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Slowly and evenly, as an incantation, giving every letter its sound and every vowel its own beat, even where two meet. Stress the second-to-last syllable. z and q are said plainly, as z and k.',
};

export default enochian;
