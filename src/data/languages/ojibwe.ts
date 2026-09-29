import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Ojibwe, the Algonquian language of the Great Lakes, in the double-vowel spelling it's
 * mostly written in today ("Anishinaabe", "miigwech"): long vowels written twice, a single a, i
 * and o short, and e always long. Stress on the second-to-last syllable, and words that end the
 * way Ojibwe's do: -ag, -an, -ing, -win, -aa.
 */
const ojibwe: InventedLanguageDef = {
  kind: 'invented',
  id: 'ojibwe',
  name: 'Ojibwe',
  flow: 'oj-catechism',
  sounds: {
    classes: {
      C: 'n:6 g:6 b:5 m:5 w:5 d:4 z:3 ʒ:3 ʃ:3 dʒ:2 tʃ:1 k:1 s:1 j:1',
      M: 'n:6 g:5 w:5 b:4 m:4 d:4 k:3 z:3 ʒ:3 ʃ:3 j:3 dʒ:2 tʃ:2 p:2 t:2 s:2 ʔ:1',
      // gw, bw and kw, as in "gwiiwizens", "bwaan" and "makwa".
      Q: 'g+w:3 b+w:1 k+w:1',
      V: 'ə:6 ɪ:6 aː:5 iː:4 o:3 oː:3 eː:3',
      // n before d, g, j or z ("nandawaabam"), and sh or s before k, p or t ("mashkiki").
      F: 'n:5 ʃ:3 s:1',
      // Words end in -g, -n, -ng, -d, -s, -sh or a vowel.
      Z: 'g:6 n:6 d:2 ŋ:2 s:1 ʃ:1',
      // -win, the ending that makes a verb a noun: "bimaadiziwin", "anamiewin".
      W: 'w',
      I: 'ɪ',
      N: 'n',
    },
    first: 'CV:6 V:3 CVF:2 VF:1 QV:1',
    syllables: 'MV:7 MVF:3 QV:1',
    last: 'MVZ:6 MV:5 WIN:1',
    single: 'CV:4 CVZ:3 VZ:2 V:1',
    stress: 'penultimate',
    avoid: [
      // n only before d, g, b, z or zh (j and nj too), and sh or s only before k, p or t.
      'n\\.[^dgbzʒ]|[ʃs]\\.(?:[^kpt]|tʃ)',
      // A catch in the throat only between vowels ("zaaga'igan").
      '[^əɪoːe]\\.ʔ',
      'ww|jj|j[ɪi]|w[oʊ]|ŋ\\.',
    ],
    // A place's name runs a word into the next as a word's own syllables would: "Aagag" and
    // "zhena" don't make one, and n goes only before the sounds it does inside a word.
    joins: ['[gdŋsʃ]\\.[^əɪoaie]', 'n\\.[^dgzʒəɪoaie]'],
    maxSyllables: 6,
  },
  spelling: [
    { sounds: 'aː', write: 'aa' },
    { sounds: 'iː', write: 'ii' },
    { sounds: 'oː', write: 'oo' },
    { sounds: 'eː', write: 'e' },
    { sounds: 'ə', write: 'a' },
    { sounds: 'ɪ', write: 'i' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'dʒ', write: 'j' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'ʒ', write: 'zh' },
    { sounds: 'j', write: 'y' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'ʔ', write: "'" },
    { sounds: 'n', write: 'm', before: 'b p' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Stress the second-to-last syllable. A double vowel is long: aa as in “father”, ii as in “see”, oo as in “go”. A single a is “uh”, i is the i of “sit”, and e is always long, as in “say”. zh is the s of “measure”, j as in “jam”, and an apostrophe is a catch in the throat.',
};

export default ojibwe;
