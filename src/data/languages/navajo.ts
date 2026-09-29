import type { InventedLanguageDef } from '../../engine/language';
import type { SpellingRule } from '../../engine/spelling';

const HIGH = '́';
const NASAL = '̃';

/**
 * Navajo's vowels, each short or long, high in pitch or not, said through the nose or not: IPA,
 * then the letter Navajo writes, plain and with its hook for a nasal vowel. Short i is ɪ.
 */
const VOWELS = [
  { short: 'a', long: 'a', letter: 'a', nasal: 'ą' },
  { short: 'ɛ', long: 'ɛ', letter: 'e', nasal: 'ę' },
  { short: 'ɪ', long: 'i', letter: 'i', nasal: 'į' },
  { short: 'o', long: 'o', letter: 'o', nasal: 'ǫ' },
];

/** Writing each vowel: doubled when long ("aa"), with an accent when high ("á", "áá"), with a hook when nasal ("ą"). */
const VOWEL_SPELLING: SpellingRule[] = VOWELS.flatMap(({ short, long, letter, nasal }) =>
  [false, true].flatMap((isNasal) =>
    [false, true].flatMap((isHigh) => {
      const mark = (isNasal ? NASAL : '') + (isHigh ? HIGH : '');
      const written = (isNasal ? nasal : letter) + (isHigh ? HIGH : '');
      return [
        { sounds: `${long}${mark}ː`, write: written.repeat(2) },
        { sounds: `${short}${mark}`, write: written },
      ];
    }),
  ),
);

/**
 * Invented Navajo, in its standard spelling: high pitch marked with an accent (á), nasal vowels
 * with a hook (ą), long ones written twice, ł for the breathy l, and an apostrophe for a catch in
 * the throat or a popped consonant (t’, ch’, tł’). b, d, g, dz, j and dl are the plain p, t, k,
 * ts, ch and tl; t, k, ts, ch and tł have a puff of air. No syllable starts with a vowel after the
 * first, and words end the way Navajo verbs do, on a stressed stem: -ʼ, -h, -ł, -d.
 */
const navajo: InventedLanguageDef = {
  kind: 'invented',
  id: 'navajo',
  name: 'Navajo',
  flow: 'nv-narratives',
  sounds: {
    classes: {
      C: 'n:6 p:6 t:5 j:5 h:5 ʃ:4 tʰ:3 k:3 tʼ:3 tʃʰ:3 tʃʼ:3 tʃ:3 l:3 ɬ:3 s:3 kʰ:2 ts:2 tsʰ:2 tsʼ:2 z:2 ʒ:2 ɣ:2 m:2 w:2 tɬʼ:2 kʼ:1 tɬʰ:1 tɬ:1',
      M: 'n:5 t:5 p:4 j:4 h:4 ʔ:3 ʃ:3 tʰ:3 k:3 tʼ:3 tʃʰ:2 tʃʼ:3 tʃ:2 l:4 ɬ:3 s:3 kʰ:2 ts:2 tsʰ:2 tsʼ:2 z:2 ʒ:2 ɣ:2 m:1 w:2 tɬʼ:1 kʼ:1 tɬ:1',
      V: [
        'a:8 ɪ:7 o:5 ɛ:4 á:5 ɪ́:5 ó:3 ɛ́:3',
        'aː:3 iː:3 oː:2 ɛː:2 áː:2 íː:2 óː:2 ɛ́ː:1',
        'ã:1 ɪ̃:1 õ:0.5 ɛ̃:0.5 ã́:0.5 ɪ̃́:0.5 ãː:0.6 ĩ́ː:0.4 ɛ̃́ː:0.3 ṍː:0.2',
      ].join(' '),
      // Inside a word, syllables close with h, s, sh, ł, a catch, or z…
      F: 'h:4 s:3 ʃ:3 ɬ:3 ʔ:2 z:1 n:1',
      // …and words end in a catch, h, ł, d, s, sh, z or n.
      Z: 'ʔ:5 h:4 ɬ:3 t:2 s:2 ʃ:1 z:1 n:1',
    },
    first: 'CV:7 CVF:3 V:1.5 VF:0.5',
    syllables: 'MV:7 MVF:3',
    last: 'MVZ:6 MV:5',
    single: 'CVZ:4 CV:4 VZ:1',
    stress: 'final',
    avoid: [
      // A catch in the throat starts a syllable only after a vowel.
      '[hsʃɬznt]\\.ʔ|ʔ\\.ʔ',
      // gh only before a and o, as Navajo writes it.
      'ɣ[ɛɪi]',
      'ww|jj|([hsʃɬzn])\\.\\1',
    ],
    maxSyllables: 5,
  },
  spelling: [
    ...VOWEL_SPELLING,
    // Plain stops and affricates: b, d, g, dz, j, dl. With a puff of air: t, k, ts, ch, tł.
    { sounds: 'p', write: 'b' },
    { sounds: 't', write: 'd' },
    { sounds: 'k', write: 'g' },
    { sounds: 'ts', write: 'dz' },
    { sounds: 'tʃ', write: 'j' },
    { sounds: 'tɬ', write: 'dl' },
    { sounds: 'tʰ', write: 't' },
    { sounds: 'kʰ', write: 'k' },
    { sounds: 'tsʰ', write: 'ts' },
    { sounds: 'tʃʰ', write: 'ch' },
    { sounds: 'tɬʰ', write: 'tł' },
    { sounds: 'tʼ', write: 't’' },
    { sounds: 'kʼ', write: 'k’' },
    { sounds: 'tsʼ', write: 'ts’' },
    { sounds: 'tʃʼ', write: 'ch’' },
    { sounds: 'tɬʼ', write: 'tł’' },
    { sounds: 'ʔ', write: '’' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'ʒ', write: 'zh' },
    { sounds: 'ɬ', write: 'ł' },
    { sounds: 'ɣ', write: 'gh' },
    { sounds: 'j', write: 'y' },
  ],
  say: {
    // The plain stops sound like English b, d and g to an English ear.
    p: { say: 'b' },
    t: { say: 'd' },
    k: { say: 'g' },
    ts: { say: 'dz' },
    tʃ: { say: 'j' },
    tɬ: { say: 'dl' },
    ɛ̃: { say: 'ehn', sayClosed: 'en' },
  },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Lean on the last syllable, and let your voice rise on an accented vowel: pitch matters in Navajo more than stress. A double vowel is long; a hook under one sends it through the nose. ł is a breathy l (put your tongue where l goes and blow), gh is a soft growl in the throat, and an apostrophe is a catch in the throat, or, after t, k, ts, ch or tł, makes it popped. b, d, g and j are crisp and unvoiced; t, k and ch come with a puff of air.',
};

export default navajo;
