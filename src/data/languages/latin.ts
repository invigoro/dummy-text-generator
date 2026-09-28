import type { InventedLanguageDef } from '../../engine/language';
import type { SayOverrides } from '../../engine/respell';

/** Latin's short vowels in closed syllables, as English readers of Latin say them: "IP-sum", "AH-met". */
export const LATIN_SAY: SayOverrides = {
  e: { sayClosed: 'e' },
  i: { sayClosed: 'i' },
  o: { sayClosed: 'o' },
  u: { sayClosed: 'u' },
};

export const LATIN_VOICING =
  'Say every letter. C and G are always hard, V is said like w, and AE rhymes with eye. Stress the second-to-last syllable when it’s long, otherwise the one before.';

/**
 * Invented Latin, in classical pronunciation. Last syllables come from their own shapes, which is
 * where the endings come from: -us, -um, -ae, -is, -it, -ant.
 */
const latin: InventedLanguageDef = {
  kind: 'invented',
  id: 'latin',
  name: 'Latin',
  flow: 'la-de-bello-gallico',
  sounds: {
    classes: {
      C: 't:7 k:6 s:6 m:6 n:6 r:6 l:5 d:5 p:4 w:3 b:2 g:2 f:2 kw:2 j:1 h:1',
      O: 'p:2 t:2 k:2 b:1 g:1 f:1',
      L: 'r:3 l:1',
      V: 'a:8 i:8 e:7 u:7 o:6 aː:3 eː:3 oː:3 iː:2 uː:2 ae:2 au:1 oe:0.3',
      // Consonants that close a syllable inside a word: "mag-nus", "par-tes".
      F: 'n:4 s:4 r:3 l:2 m:1 k:1 t:1 p:0.5',
      // The vowels and consonants of endings.
      E: 'u:6 a:5 i:5 e:4 o:3 ae:2',
      Z: 's:8 m:6 t:4 n+t:2 r:2 n+s:1 k+s:1 s+t:1',
    },
    syllables: 'CV:10 CVF:5 OLV:1',
    first: 'CV:10 CVF:5 V:2 VF:2 OLV:1',
    last: 'CEZ:8 CE:4 CVZ:2',
    single: 'CV:4 CVZ:4 VZ:3 V:1',
    stress: 'latin',
    avoid: [
      'ww|jj|ji|wu|kwu',
      'kwoe|woe|joe',
      // No "-aes" or "-aem": ae ends its syllable.
      'ae[^.]',
      // The consonants Latin lets meet inside a word: n before t, d, c, g, s, f (never b, p, m:
      // those take m); m before p or b; s before t, c, p; c and p before t or s; l and r before most.
      'n\\.[rlmnbpwjh]',
      'm\\.[^pbm]',
      's\\.[^tkps]',
      'l\\.[rnjh]',
      'k\\.[^ts]',
      't\\.[^t]',
      'p\\.[^ts]',
      'r\\.[jh]',
    ],
    maxSyllables: 5,
  },
  spelling: [
    { sounds: 'kw', write: 'qu' },
    { sounds: 'k s', write: 'x' },
    { sounds: 'k', write: 'c:24 ch:0.5' },
    { sounds: 'w', write: 'v' },
    { sounds: 'j', write: 'i' },
    { sounds: 'f', write: 'f:6 ph:1' },
    { sounds: 't', write: 't:30 th:0.5' },
    // Latin as it's usually printed, without marks for long vowels.
    { sounds: 'aː', write: 'a' },
    { sounds: 'eː', write: 'e' },
    { sounds: 'iː', write: 'i' },
    { sounds: 'oː', write: 'o' },
    { sounds: 'uː', write: 'u' },
  ],
  say: LATIN_SAY,
  punctuation: { quotes: ['“', '”'] },
  voicing: LATIN_VOICING,
};

export default latin;
