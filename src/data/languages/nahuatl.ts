import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Nahuatl, in the spelling of the colonial books: stress on the second-to-last syllable,
 * long words, tl as one sound that can start a word or end one, and no l at the start of a word.
 * Words end the way Nahuatl nouns and verbs do: -tl, -tli, -li, -tzin, -c, -n.
 */
const nahuatl: InventedLanguageDef = {
  kind: 'invented',
  id: 'nahuatl',
  name: 'Nahuatl',
  flow: 'nah-chimalpahin',
  sounds: {
    classes: {
      // No l at the start of a word, and no b, d, g, f or r at all.
      C: 'k:6 n:6 t:5 tɬ:5 m:5 w:4 j:4 s:3 ʃ:3 tʃ:3 p:3 ts:2 kʷ:2',
      M: 'l:6 t:5 tɬ:5 k:5 n:5 w:5 m:4 ts:4 p:4 lː:3 j:3 s:3 ʃ:3 tʃ:3 kʷ:2',
      V: 'a:10 i:7 o:6 e:5',
      // Syllables inside a word close with n, l, a catch in the throat, c, z or x…
      F: 'n:5 l:4 ʔ:2 k:2 s:1 ʃ:1',
      // …and words end in a vowel or -tl, -n, -c, -z, a catch, or -uh.
      Z: 'tɬ:6 n:5 k:3 ʔ:2 s:2 ʃ:0.5',
      // -tli, -li and -tzin, the endings of so many nouns.
      T: 'tɬ:3 l:2 lː:1',
      I: 'i',
      S: 'ts',
      N: 'n',
      // "auh", "cuauh-": a with w after it, where a syllable ends.
      W: 'au',
    },
    first: 'CV:8 CVF:3 V:2 VF:2 CW:0.5',
    syllables: 'MV:7 MVF:3 MW:0.4',
    last: 'MV:7 MVZ:6 TI:2 SIN:0.6 V:0.6',
    single: 'CV:4 CVZ:4 VZ:3 V:1 W:0.5',
    stress: 'penultimate',
    hiatus: true,
    avoid: [
      // Two vowels side by side only as in "tlatoa", "quiyahuia": o, i or e before a. A vowel
      // never starts a syllable after a consonant, or after "au".
      'a\\.[aeiou]|[eio]\\.[eio]|[^aeio]\\.[aeiou]',
      // A double l only after a vowel; no nl, ltl or tll.
      '[^aeiou]\\.lː|n\\.l|l\\.tɬ|tɬ\\.l',
      // Nothing closes a syllable after "au", and no ll follows it.
      'au[^.]|au\\.lː',
      // No c before ch, or before hu, where "chu" would read as ch.
      'ww|jj|wo|ji|kʷo|w\\.w|j\\.j|s\\.s|ʃ\\.ʃ|k\\.tʃ|k\\.w',
    ],
    // A word ending in tl is never the first part of a place's name before a consonant: real
    // names drop the tl ("xochitl" and "calco" make "Xochicalco").
    joins: ['tɬ\\.[^aeio]'],
    maxSyllables: 6,
  },
  spelling: [
    { sounds: 'tɬ', write: 'tl' },
    { sounds: 'ts', write: 'tz' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'ʃ', write: 'x' },
    { sounds: 'au', write: 'auh' },
    // kw and w are "cu" and "hu" before a vowel, "uc" and "uh" after one.
    { sounds: 'kʷ', write: 'cu', before: 'V' },
    { sounds: 'kʷ', write: 'uc' },
    { sounds: 'w', write: 'hu', before: 'V' },
    { sounds: 'w', write: 'uh' },
    // k and s as in Spanish: "qui", "que", but "ca", "co"; "ce", "ci", but "za", "zo".
    { sounds: 'k', write: 'qu', before: 'front' },
    { sounds: 'k', write: 'c' },
    { sounds: 's', write: 'c', before: 'front' },
    { sounds: 's', write: 'z' },
    { sounds: 'j', write: 'y' },
    // The catch in the throat is written h inside a word, and not at all at its end.
    { sounds: 'ʔ', write: '∅', before: '#' },
    { sounds: 'ʔ', write: 'h' },
    { sounds: 'lː', write: 'll' },
    { sounds: 'n', write: 'm', before: 'p' },
  ],
  say: {
    e: { sayClosed: 'e' },
  },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Stress the second-to-last syllable. tl is one sound, the t and l of “bottle” said together, and it can start a word as well as end one. x is sh, z is s, tz is ts, hu and uh are w, and qu is k before e and i. Say every vowel, as in Spanish.',
};

export default nahuatl;
