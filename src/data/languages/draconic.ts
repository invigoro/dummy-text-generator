import type { InventedLanguageDef } from '../../engine/language';

/**
 * Draconic: hissing and grand. Long vowels, s, th and the throaty x, trilled r's, and words
 * that end on a consonant as if closing a jaw: "Vaeris", "Thuxar", "Irthos".
 */
const draconic: InventedLanguageDef = {
  kind: 'invented',
  id: 'draconic',
  name: 'Draconic',
  flow: 'la-de-bello-gallico',
  sounds: {
    classes: {
      C: 's:5 θ:4 v:4 d:4 k:4 r:4 x:3 z:3 t:3 l:3 ʃ:2 j:2 m:2 n:2 h:2 g:2',
      O: 'θ:3 k:2 d:2 v:2 s:2 x:1',
      L: 'r:5 l:1',
      V: 'a:7 i:4 e:3 o:3 aː:3 iː:2 eː:2 oː:2 u:2 aɪ:2 au:1',
      F: 'r:5 s:5 x:4 θ:3 l:3 n:3 k:2 z:2 m:1 ʃ:1 r+x:0.5 r+θ:0.5',
    },
    first: 'CV:6 CVF:6 V:2 VF:2 OLV:2 OLVF:1',
    syllables: 'CV:6 CVF:4 V:1',
    last: 'CVF:7 CV:3',
    single: 'CVF:5 CV:3 VF:3 V:1',
    stress: 'penultimate',
    hiatus: true,
    avoid: ['jj|ji', 'x\\.x|θ\\.θ|s\\.s', '(.)\\1\\1', 'aː\\.a|a\\.aː'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'θ', write: 'th' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'j', write: 'y:2 i:1' },
    { sounds: 'aː', write: 'aa:2 a:1' },
    { sounds: 'iː', write: 'i' },
    { sounds: 'eː', write: 'e' },
    { sounds: 'oː', write: 'o' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'au', write: 'au' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Slow and imperious, as if every word costs the listener something. Draw out the long vowels, hiss the s and th, trill the r, and let x (a throaty “kh”) linger. Stress the second-to-last syllable.',
};

export default draconic;
