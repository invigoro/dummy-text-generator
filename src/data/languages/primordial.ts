import type { InventedLanguageDef } from '../../engine/language';

/** Primordial, the tongue of the elements, in its four dialects. */

/** Aquan, of water: liquid consonants, long vowels poured out, no hard stops. */
export const aquan: InventedLanguageDef = {
  kind: 'invented',
  id: 'aquan',
  name: 'Aquan',
  flow: 'it-promessi-sposi',
  sounds: {
    classes: {
      C: 'l:7 m:5 n:5 w:5 j:3 v:3 s:3 r:3 h:2 ʃ:1',
      V: 'a:6 u:5 o:4 e:3 i:3 aː:3 uː:2 oː:2 au:2 ei:1',
      F: 'l:3 n:3 m:1',
    },
    first: 'CV:10 V:4 CVF:2',
    syllables: 'CV:10 V:2 CVF:2',
    last: 'CV:10 V:1 CVF:2',
    single: 'CV:6 V:3 CVF:2',
    stress: 'penultimate',
    hiatus: true,
    // No "aaae" or "ooo": a vowel doesn't meet itself across a syllable break.
    avoid: ['jj|ww|ji|wu', '(.)\\1\\1', '([aoueiɛ])ː?\\.\\1'],
    maxSyllables: 5,
  },
  spelling: [
    { sounds: 'aː', write: 'aa' },
    { sounds: 'uː', write: 'uu' },
    { sounds: 'oː', write: 'oo' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'j', write: 'y' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing: 'Let it flow like water: no hard stops, long vowels poured out, and every syllable melting into the next.',
};

/** Auran, of air: breathy, more air than voice, lifting at the end of every word. */
export const auran: InventedLanguageDef = {
  kind: 'invented',
  id: 'auran',
  name: 'Auran',
  flow: 'fr-trois-mousquetaires',
  sounds: {
    classes: {
      C: 'h:6 f:5 s:5 w:4 θ:3 ʃ:3 v:2 l:2 r:1 x:1',
      O: 'h:2 f:2 s:2 θ:1',
      L: 'w:3 r:1 l:1',
      V: 'i:5 e:4 a:4 iː:2 eː:2 aɪ:2 u:2 ɛ:2',
      F: 's:4 θ:2 ʃ:2 f:2 l:1 r:1',
    },
    first: 'CV:8 OLV:3 CVF:3 V:2',
    syllables: 'CV:8 CVF:3 V:1',
    last: 'CV:5 CVF:5',
    single: 'CV:5 OLV:2 CVF:3 V:1',
    stress: 'final',
    hiatus: true,
    avoid: ['(.)\\1\\1', 'hw.*hw', '([θʃsf])\\.\\1'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'θ', write: 'th' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'x', write: 'kh' },
    { sounds: 'iː', write: 'ie' },
    { sounds: 'eː', write: 'ee' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'ɛ', write: 'e' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing: 'Breathy and light, more air than voice: let h, f, s and th hiss out, and lift the last syllable of each word like a gust.',
};

/** Ignan, of fire: quick crackling syllables, sharp consonants, short vowels. */
export const ignan: InventedLanguageDef = {
  kind: 'invented',
  id: 'ignan',
  name: 'Ignan',
  flow: 'es-don-quijote',
  sounds: {
    classes: {
      C: 'k:6 t:5 s:5 ts:3 tʃ:3 p:3 r:3 ʃ:2 x:2 z:2 f:2',
      V: 'a:5 i:5 e:4 ɛ:2 ɪ:2 aɪ:2',
      F: 'k:5 t:4 s:4 ts:2 k+s:2 x:2 r:2 tʃ:1',
    },
    first: 'CVF:7 CV:4',
    syllables: 'CVF:5 CV:4',
    last: 'CVF:7 CV:3',
    single: 'CVF:7 CV:3',
    stress: 'initial',
    avoid: ['(.)\\1\\1', 'tʃ.*tʃ.*tʃ', '(ts|tʃ|[kts])\\.\\1'],
    maxSyllables: 3,
  },
  spelling: [
    { sounds: 'k s', write: 'x' },
    { sounds: 'ts', write: 'tz' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'ʃ', write: 'sh' },
    { sounds: 'x', write: 'kh' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'ɪ', write: 'i' },
    { sounds: 'aɪ', write: 'ai' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing: 'Quick and crackling: spit out the consonants, keep the vowels short, and never let a word linger.',
};

/** Terran, of earth: slow, low and heavy, rumbling vowels, every word landing hard. */
export const terran: InventedLanguageDef = {
  kind: 'invented',
  id: 'terran',
  name: 'Terran',
  flow: 'de-verwandlung',
  sounds: {
    classes: {
      C: 'g:5 d:5 b:5 r:5 m:5 n:3 k:3 t:2 z:2 v:2 l:2 ʒ:1 h:1',
      O: 'g:3 b:3 d:2 k:2',
      L: 'r:5 l:1',
      V: 'o:6 u:6 a:4 oː:3 uː:3 aː:2 ɔ:2 ʊ:2',
      F: 'r:5 m:4 n:4 d:3 g:3 k:2 b:2 z:1 r+d:1 r+m:1 n+d:1 m+b:1',
    },
    first: 'CVF:6 CV:3 OLVF:2 OLV:1',
    syllables: 'CVF:4 CV:4',
    last: 'CVF:6 CV:2',
    single: 'CVF:6 OLVF:2 CV:2',
    stress: 'initial',
    avoid: ['(.)\\1\\1', '([bdgmnrz])\\.\\1'],
    maxSyllables: 3,
  },
  spelling: [
    { sounds: 'oː', write: 'oo' },
    { sounds: 'uː', write: 'uu' },
    { sounds: 'aː', write: 'aa' },
    { sounds: 'ɔ', write: 'o' },
    { sounds: 'ʊ', write: 'u' },
    { sounds: 'ʒ', write: 'zh' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing: 'Slow, low and heavy, like stone grinding on stone: long rumbling vowels, and every word landing hard on its first syllable.',
};
