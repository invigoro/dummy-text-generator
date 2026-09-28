import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Finnish: stress on the first syllable, no clusters at the start of a word, long vowels
 * and double consonants written double, and vowel harmony: a word uses a, o and u, or ä, ö and y,
 * never both (e and i go with either).
 */
const finnish: InventedLanguageDef = {
  kind: 'invented',
  id: 'finnish',
  name: 'Finnish',
  flow: 'fi-seitseman-veljesta',
  sounds: {
    classes: {
      C: 'k:7 t:6 s:6 h:5 m:5 v:5 l:5 p:4 n:4 j:3 r:3',
      M: 'n:6 l:6 t:6 k:5 s:5 r:5 m:4 v:4 j:3 h:3 d:2 p:2',
      // Double consonants: "kukka", "katto", "tuuli" has none, "villa" has ll.
      G: 'tː:6 kː:5 lː:5 nː:4 sː:4 pː:3 mː:2 rː:2',
      V: 'a:8 i:7 e:6 o:5 u:5 æ:4 y:2 ø:1 aː:2 æː:1 iː:1 eː:1 oː:1 uː:1 yː:0.5 øː:0.3 ei:1 aɪ:1 au:1 ɔɪ:0.5',
      // Syllables close with n, l, s, r, t, h or k inside a word…
      F: 'n:5 l:4 s:4 r:3 t:2 h:2 k:1',
      // …and words end in a vowel, or n, t, s.
      Z: 'n:6 t:3 s:3 l:1',
    },
    first: 'CV:10 CVF:4 V:2 VF:1',
    syllables: 'MV:8 GV:4 MVF:2',
    last: 'MV:8 GV:3 MVZ:3',
    single: 'CV:4 CVZ:3 V:2 VZ:2 CVF:1',
    stress: 'initial',
    avoid: [
      // Vowel harmony: back vowels and front vowels never share a word.
      '[aouɔ].*[æøy]|[æøy].*[aouɔ]',
      // A double consonant only follows a vowel.
      '[nlsrthk]\\.[ktplnsmr]ː',
      'jj|ji',
    ],
    maxSyllables: 5,
  },
  spelling: [
    { sounds: 'æː', write: 'ää' },
    { sounds: 'æ', write: 'ä' },
    { sounds: 'øː', write: 'öö' },
    { sounds: 'ø', write: 'ö' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'ɔɪ', write: 'oi' },
  ],
  say: {
    æː: { say: 'a' },
  },
  punctuation: { quotes: ['”', '”'] },
  voicing:
    'Stress the first syllable of every word, and say every letter. Double letters are held longer: tt is a little pause before the t, aa a longer a. Keep ä as in “cat”, and y like the French u.',
};

export default finnish;
