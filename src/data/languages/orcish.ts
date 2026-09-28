import type { InventedLanguageDef } from '../../engine/language';

/**
 * Orcish: short, harsh and clipped. Mostly closed syllables with back vowels, heavy on g, k, r,
 * z and the throaty kh and gh, with a catch in the throat between some syllables ("grash'nak").
 */
const orcish: InventedLanguageDef = {
  kind: 'invented',
  id: 'orcish',
  name: 'Orcish',
  flow: 'is-saefarinn',
  sounds: {
    classes: {
      C: 'g:7 k:6 r:6 z:5 d:5 b:4 t:4 x:4 m:3 n:3 ʃ:3 ʁ:2 s:2 l:2 h:2 v:1',
      // Inside a word, a syllable can start with a glottal stop.
      M: 'g:5 k:5 r:5 z:4 d:4 ʔ:3 b:3 t:3 x:3 m:2 n:3 ʃ:2 ʁ:2',
      O: 'g:4 k:3 b:3 d:3 x:1 ʃ:1 z:1',
      L: 'r:5 n:1 l:1',
      V: 'u:7 a:7 o:5 ɑ:2 i:2 ɔ:1 e:1',
      F: 'g:5 k:5 r:5 z:4 d:3 x:3 ʃ:2 t:2 n:2 m:2 b:1 l:1 r+k:1 r+g:1 z+g:1 n+k:1 n+g:1 k+t:0.5',
    },
    first: 'CVF:8 CV:3 OLVF:3 OLV:1 VF:2',
    syllables: 'MVF:5 MV:3',
    last: 'MVF:8 MV:2',
    single: 'CVF:6 OLVF:2 VF:2 CV:2',
    stress: 'initial',
    avoid: ['^ʔ', 'ʔ\\.ʔ', '[^.]ʔ', 'ʁ\\.ʁ|x\\.x'],
    maxSyllables: 3,
  },
  spelling: [
    { sounds: 'x', write: 'kh' },
    { sounds: 'ʁ', write: 'gh' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'ʔ', write: "'" },
    { sounds: 'ɑ', write: 'a' },
    { sounds: 'ɔ', write: 'o' },
    // Clipped endings are sometimes written doubled: "grukk", "muzz".
    { sounds: 'k', write: 'k:3 kk:1', before: '#' },
    { sounds: 'z', write: 'z:3 zz:1', before: '#' },
    { sounds: 'g', write: 'g:4 gg:1', before: '#' },
  ],
  // The throaty gh is a growl, not the French r the same symbol is for elsewhere.
  say: { ʁ: { say: 'gh' } },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Short and harsh. Bark the first syllable of every word, hit every consonant, and growl kh and gh at the back of the throat. An apostrophe is a catch in the throat, as in “uh-oh”.',
};

export default orcish;
