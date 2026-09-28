import type { InventedLanguageDef } from '../../engine/language';
import type { SpellingRule } from '../../engine/spelling';

/** Consonants after a long vowel at the end of a word, as the silent-e spelling writes them. */
const SILENT_E: readonly [string, string][] = [
  ['t', 't'],
  ['d', 'd'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['s', 'c'],
  ['v', 'v'],
  ['z', 's'],
  ['b', 'b'],
  ['f', 'f'],
  ['r', 'r'],
];

/**
 * A long vowel and a consonant ending a word, written with a silent e ("fate", "stone"), or with
 * the vowel's other spelling before the consonants English uses it with ("wait", "boat", "moon").
 */
function longEndings(vowel: string, silentE: string, other: string, otherWeight: number, withOther: string): SpellingRule[] {
  return SILENT_E.map(([sound, letter]) => {
    const choices = [`${silentE}${letter}e:3`];
    if (withOther.split(' ').includes(sound)) choices.push(`${other}${sound}:${otherWeight}`);
    return { sounds: `${vowel} ${sound}`, write: choices.join(' '), before: '#' };
  });
}

/** Consonants doubled after a short stressed vowel, before another vowel: "hammer", "bitter". */
const DOUBLED: readonly [string, string][] = [
  ['t', 'tt'],
  ['d', 'dd'],
  ['p', 'pp'],
  ['b', 'bb'],
  ['g', 'gg'],
  ['m', 'mm'],
  ['n', 'nn'],
  ['l', 'll'],
  ['r', 'rr'],
  ['s', 'ss'],
  ['f', 'ff'],
  ['z', 'zz'],
  ['k', 'ck'],
];

const SHORT = 'æ ɛ ɪ ɒ ʌ';

/**
 * Invented English: stressed first syllables, reduced vowels after them, clusters like str and
 * thr, and English's own spelling habits, from the silent e of "stone" to the ck of "back".
 */
const englishInvented: InventedLanguageDef = {
  kind: 'invented',
  id: 'english-invented',
  name: 'Invented English',
  flow: 'en-treasure-island',
  sounds: {
    classes: {
      C: 't:7 s:7 b:6 m:6 w:5 h:5 d:5 k:5 p:5 l:5 f:5 r:4 n:4 g:4 ð:3 θ:2 ʃ:2 tʃ:2 dʒ:2 v:2 j:1',
      M: 'r:6 l:6 t:6 n:6 d:5 s:4 m:4 k:4 v:3 p:3 b:3 ð:2 g:2 f:2 ʃ:2 tʃ:1 dʒ:1 w:1 z:1',
      // Clusters: br, cr, dr, fr, gr, pr, tr, thr, shr, bl, cl, fl, gl, pl, tw, dw, qu.
      O: 'b:3 p:3 k:3 f:3 g:2 t:2 d:2 θ:1 ʃ:0.5',
      L: 'r:5 l:3 w:1',
      // s clusters: st, sp, sc, sm, sn, sl, sw, and str, spr, scr, spl.
      S: 's',
      K: 't:4 p:3 k:3 l:2 m:1 n:1 w:1',
      T: 't:3 p:2 k:2',
      R: 'r:3 l:1',
      // Stressed vowels, short and long.
      V: 'ɪ:7 æ:6 ɛ:6 ɒ:5 ʌ:5 iː:3 eɪ:3 aɪ:3 oʊ:3 uː:2 ɔː:2 ɜː:1.5 aʊ:1 ɑː:1 ʊ:1 ɔɪ:0.5',
      // Unstressed vowels, mostly reduced.
      E: 'ə:8 ɪ:3 i:1 oʊ:0.3',
      // Consonants and clusters ending a stressed syllable.
      F: 'n:6 t:5 d:5 s:4 k:4 l:4 r:3 m:3 ŋ:2 z:2 p:2 n+d:2 n+t:2 s+t:2 v:1 θ:1 ʃ:1 tʃ:1 dʒ:1 f:1 g:1 l+d:1 l+t:1 k+s:1 m+p:1 ŋ+k:1 f+t:0.5 k+t:0.5',
      // …and an unstressed one: -en, -el, -er, -ing, -est.
      Q: 'n:5 l:4 r:4 s:2 t:2 d:2 ŋ:1.5 z:1 m:1',
    },
    first: 'CV:5 CVF:9 OLVF:3 OLV:1 SKVF:2 STRVF:1 VF:1.5 V:0.5',
    syllables: 'ME:6 MEQ:3',
    last: 'ME:4 MEQ:6',
    single: 'CVF:8 CV:4 VF:3 OLVF:2 SKVF:1 V:1',
    stress: 'initial',
    avoid: [
      'tl|dl|θl|ʃl|θw|ʃw|pw|bw|fw|vw|gw|stl|skl|spw|stw',
      '^ŋ',
      // A short vowel never ends an English word: "ba" would be "bah".
      '(æ|ɛ|ɪ|ɒ|ʌ|ʊ)$',
      // The ur of "bird" carries its own r, and inside a word a long vowel before r would be
      // spelled like a short one ("sarnis" for "sairnis").
      'ɜːr',
      '(eɪ|aɪ|oʊ|uː|aʊ|iː|ɔɪ)r\\.',
      'ʃ.*ʃ|tʃ.*tʃ|dʒ.*dʒ',
      // English doesn't double consonants in speech, or run n into r.
      '([ptkbdgmnlrsfvzθðʃ])\\.\\1',
      '[nmŋ]\\.r',
    ],
    maxSyllables: 4,
  },
  spelling: [
    // Unstressed endings: -tion, -ing, -le, -en, -er, -y.
    { sounds: 'ʃ ə n', write: 'tion:3 sion:1', before: '#' },
    { sounds: 'ɪ ŋ', write: 'ing', before: '#' },
    { sounds: 'ə l', write: 'le:3 el:2 al:1', before: '#' },
    { sounds: 'ə n', write: 'en:3 on:2 an:1', before: '#' },
    { sounds: 'ə r', write: 'er:5 or:1 ar:1', before: '#' },
    { sounds: 'ə s', write: 'us:2 ess:1 is:1', before: '#' },
    { sounds: 'ə', write: 'a:2 o:1', before: '#' },
    { sounds: 'i', write: 'y:5 ie:1 ey:1', before: '#' },
    { sounds: 'oʊ', write: 'ow:2 o:2', before: '# C', after: 'C' },

    // A long vowel and a consonant ending a word: "fate", "wait"; "bride", "night"; "stone",
    // "boat"; "rude", "moon"; "beat", "keen".
    ...longEndings('eɪ', 'a', 'ai', 2, 't d l m n r'),
    ...longEndings('aɪ', 'i', 'igh', 1, 't'),
    ...longEndings('oʊ', 'o', 'oa', 2, 't d l n k p m r'),
    ...longEndings('uː', 'u', 'oo', 3, 't d l n m p k f'),
    { sounds: 'iː t', write: 'eat:3 eet:3', before: '#' },
    { sounds: 'iː d', write: 'ead:2 eed:3', before: '#' },
    { sounds: 'iː', write: 'ea:3 ee:3', before: 'C', syllable: 'closed' },
    // Long vowels anywhere else.
    { sounds: 'iː', write: 'ee:4 ea:1', before: '#' },
    { sounds: 'iː', write: 'e:3 ea:2 ee:1' },
    { sounds: 'eɪ', write: 'ay', before: '#' },
    { sounds: 'eɪ', write: 'a:3 ai:1' },
    { sounds: 'aɪ', write: 'y:2 igh:1 ie:1', before: '#' },
    { sounds: 'aɪ', write: 'i:3 y:1' },
    { sounds: 'oʊ', write: 'ow:2 o:2 oe:0.5', before: '#' },
    { sounds: 'oʊ', write: 'o' },
    { sounds: 'uː', write: 'oo:3 ew:2 ue:1', before: '#' },
    { sounds: 'uː', write: 'oo:1 u:2' },
    { sounds: 'aʊ', write: 'ow', before: '#' },
    { sounds: 'aʊ', write: 'ou:3 ow:1' },
    { sounds: 'ɔɪ', write: 'oy', before: '#' },
    { sounds: 'ɔɪ', write: 'oi' },
    { sounds: 'ɔː', write: 'aw', before: '#' },
    { sounds: 'ɔː', write: 'a', before: 'l' },
    { sounds: 'ɔː', write: 'au:2 aw:1' },
    { sounds: 'ɜː', write: 'or', after: 'w' },
    { sounds: 'ɜː', write: 'ur:3 er:2 ir:2' },
    { sounds: 'ɑː r', write: 'ar' },
    { sounds: 'ɑː', write: 'a:2 ah:1' },
    // Short vowels, and unstressed ones.
    { sounds: 'æ', write: 'a' },
    { sounds: 'ɛ', write: 'e:6 ea:1' },
    { sounds: 'ɪ', write: 'i:6 y:0.5' },
    { sounds: 'ɒ', write: 'o' },
    { sounds: 'ʌ', write: 'u:5 o:1' },
    { sounds: 'ʊ', write: 'oo:2 u:2' },
    { sounds: 'ə', write: 'e:3 a:2 o:2 i:1 u:1' },

    // Consonants. After a short vowel, doubled before another vowel ("hammer") or at the end
    // of a word ("back", "cliff", "bell", "moss", "badge", "match").
    ...DOUBLED.map(([sound, doubled]): SpellingRule => ({ sounds: sound, write: `${doubled}:3 ${sound === 'k' ? 'c' : sound}:1`, after: SHORT, before: 'V' })),
    { sounds: 'k s', write: 'x:3 cks:1', before: '#' },
    { sounds: 'k w', write: 'qu' },
    { sounds: 'k', write: 'ck', after: SHORT, before: '#' },
    { sounds: 'f', write: 'ff:3 f:1', after: SHORT, before: '#' },
    { sounds: 'l', write: 'll:4 l:1', after: SHORT, before: '#' },
    { sounds: 's', write: 'ss:4 s:1', after: SHORT, before: '#' },
    { sounds: 'z', write: 'zz:1 s:2', after: SHORT, before: '#' },
    { sounds: 'dʒ', write: 'dge', after: SHORT, before: '#' },
    { sounds: 'tʃ', write: 'tch:3 ch:1', after: SHORT, before: '#' },
    { sounds: 'v', write: 've', before: '#' },
    { sounds: 'z', write: 's:3 z:1', before: '#' },
    { sounds: 'k', write: 'k', before: 'front' },
    { sounds: 'k', write: 'c:5 k:1' },
    { sounds: 's', write: 's:6 c:1', before: 'front' },
    { sounds: 'f', write: 'f:8 ph:1' },
    { sounds: 'dʒ', write: 'ge', before: '#' },
    { sounds: 'dʒ', write: 'j:3 g:1', before: 'front' },
    { sounds: 'dʒ', write: 'j' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'θ', write: 'th' },
    { sounds: 'ð', write: 'th' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'ŋ', write: 'n', before: 'k g' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'j', write: 'y' },
    { sounds: 'w', write: 'w:5 wh:1', after: '#' },
    { sounds: 'r', write: 'r:8 wr:0.5', after: '#' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing: 'Read it as you would any English: lean on the first syllable of each word and let the rest fall away.',
};

export default englishInvented;
