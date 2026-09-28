import type { InventedLanguageDef } from '../../engine/language';

/**
 * Infernal: precise and legalistic, the language of contracts. Crisp consonants, clipped closed
 * syllables, and stress that lands on the last syllable like a gavel.
 */
const infernal: InventedLanguageDef = {
  kind: 'invented',
  id: 'infernal',
  name: 'Infernal',
  flow: 'la-de-bello-gallico',
  sounds: {
    classes: {
      C: 'k:6 t:5 r:5 z:4 v:4 m:4 n:4 s:4 d:3 g:3 l:3 x:2 ts:2 b:2 p:2 ʃ:1 j:1',
      O: 'k:3 t:2 v:2 d:2 g:2 b:1 p:1 z:1',
      L: 'r:5 l:1',
      V: 'a:6 e:5 o:5 i:4 u:4 ɛ:2 aɪ:1 au:1',
      F: 'x:4 z:4 k:4 t:4 r:4 m:3 n:3 s:3 θ:2 l:2 ts:1',
    },
    first: 'CV:6 CVF:6 OLV:2 VF:1',
    syllables: 'CV:6 CVF:4',
    last: 'CVF:8 CV:2',
    single: 'CVF:6 CV:3 VF:2',
    stress: 'final',
    avoid: ['jj|ji', 'x\\.x|z\\.z|k\\.k|t\\.t'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'ts', write: 'tz' },
    { sounds: 'θ', write: 'th' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'k', write: 'k:3 c:1' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'au', write: 'au' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Precise and cold, like reading a contract aloud to someone who will regret signing it. Clip every consonant, rush nothing, and put the stress on the last syllable of each word. tz is “ts”; x is a throaty “kh”.',
};

export default infernal;
