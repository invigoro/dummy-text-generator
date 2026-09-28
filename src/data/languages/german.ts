import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented German: stress on the first syllable, consonant clusters (schw, schl, pf, tz), the
 * throaty ch, long vowels written ah, ie and oo, endings in -en, -er and -el, and a capital for
 * every noun, which the flow text supplies.
 */
const german: InventedLanguageDef = {
  kind: 'invented',
  id: 'german',
  name: 'German',
  flow: 'de-verwandlung',
  sounds: {
    classes: {
      C: 'h:6 d:6 b:5 g:5 v:5 z:5 m:5 l:5 f:4 k:4 t:4 n:4 r:4 ʃ:3 ts:2 p:2 pf:1 j:1',
      M: 'n:6 t:5 l:5 r:5 d:4 s:4 g:3 b:3 m:3 k:3 f:2 v:2 x:1 ts:1 ʃ:1',
      // Clusters: br, dr, fr, gr, kr, pr, tr, bl, fl, gl, kl, pl, kn…
      O: 'b:3 g:3 k:3 f:3 d:2 t:2 p:2',
      L: 'r:4 l:3 n:0.5',
      // …and sch- clusters: st, sp, schw, schr, schl, schm, schn.
      S: 'ʃ',
      K: 't:4 p:3 v:2 r:1 l:1 m:1 n:1',
      V: 'ɪ:6 a:6 ɛ:5 ɔ:4 ʊ:4 aː:3 eː:3 iː:3 oː:3 aɪ:3 uː:2 aʊ:2 ɔɪ:1 y:1 yː:1 œ:0.5 øː:0.5',
      // The unstressed e of endings.
      R: 'ə',
      F: 'n:5 r:4 l:3 s:3 t:3 x:2 k:2 m:2 f:1 ŋ:1 ʃ:1 ts:1 p:1 n+t:1 n+d:1 l+t:1 s+t:2 x+t:1 r+t:1 r+k:0.5 ŋ+k:0.5',
      // Endings: -en, -er, -el, -es, -et, -em.
      Z: 'n:6 r:4 l:2 s:1 t:1 m:1',
    },
    first: 'CV:5 CVF:7 OLVF:2 OLV:1 SKV:1 SKVF:2 V:1 VF:2',
    syllables: 'MV:5 MVF:4 MR:2',
    last: 'MR:5 MRZ:6 MVF:2',
    single: 'CVF:6 CV:3 VF:3 OLVF:1 SKVF:1',
    stress: 'initial',
    avoid: [
      'tl|dl|jj',
      '^ŋ',
      'ə[^.]*\\.[^.]*ə',
      '(aː|eː|iː|oː|uː|yː|øː|aɪ|aʊ|ɔɪ)[^.]{3,}',
      // German doesn't say a consonant twice across syllables: "Mutter" is one t, written double.
      '([ptkbdgfvszmnlrʃx])\\.\\1',
    ],
    maxSyllables: 4,
  },
  spelling: [
    // st and sp at the start of a word keep their s: "Stein", "spät".
    { sounds: 'ʃ', write: 's', after: '#', before: 't p' },
    { sounds: 'ʃ', write: 'sch' },
    { sounds: 'x', write: 'ch' },
    { sounds: 'ts', write: 'tz', after: 'a ɛ ɪ ɔ ʊ y œ' },
    { sounds: 'ts', write: 'z' },
    { sounds: 'k', write: 'ck', after: 'a ɛ ɪ ɔ ʊ', before: '#' },
    // A final t or k is sometimes written d or g, as German spells them: "Hand", "Tag".
    { sounds: 't', write: 't:3 d:2', after: 'n l r', before: '#' },
    { sounds: 'k', write: 'k:2 g:1', before: '#' },
    { sounds: 'z', write: 's' },
    { sounds: 's', write: 'ss', after: 'a ɛ ɪ ɔ ʊ', before: 'V #' },
    { sounds: 's', write: 'ß', after: 'aː eː iː oː uː aɪ aʊ ɔɪ', before: 'V #' },
    { sounds: 'f', write: 'f:5 v:1' },
    { sounds: 'v', write: 'w' },
    { sounds: 'ŋ', write: 'n', before: 'k' },
    { sounds: 'ŋ', write: 'ng' },
    // Vowels: long ones written three ways, as German does: "Tal", "Zahl", "Saal". The h only
    // comes before l, m, n and r.
    { sounds: 'aː', write: 'a:2 ah:2', before: 'l m n r' },
    { sounds: 'aː', write: 'a:5 aa:0.5' },
    { sounds: 'eː', write: 'e:2 eh:2', before: 'l m n r' },
    { sounds: 'eː', write: 'e:5 ee:0.5' },
    { sounds: 'iː', write: 'ie:5 ih:0.5', before: 'l m n r' },
    { sounds: 'iː', write: 'ie' },
    { sounds: 'oː', write: 'o:2 oh:2', before: 'l m n r' },
    { sounds: 'oː', write: 'o:5 oo:0.5' },
    { sounds: 'uː', write: 'u:2 uh:2', before: 'l m n r' },
    { sounds: 'uː', write: 'u' },
    { sounds: 'yː', write: 'ü:3 üh:1', before: 'l m n r' },
    { sounds: 'yː', write: 'ü' },
    { sounds: 'y', write: 'ü' },
    { sounds: 'øː', write: 'ö:3 öh:1', before: 'l m n r' },
    { sounds: 'øː', write: 'ö' },
    { sounds: 'œ', write: 'ö' },
    { sounds: 'ɛ', write: 'e:4 ä:2' },
    { sounds: 'ɪ', write: 'i' },
    { sounds: 'ɔ', write: 'o' },
    { sounds: 'ʊ', write: 'u' },
    { sounds: 'aɪ', write: 'ei:5 ai:1' },
    { sounds: 'aʊ', write: 'au' },
    { sounds: 'ɔɪ', write: 'eu:3 äu:1' },
    { sounds: 'ə', write: 'e' },
    // Short vowels double the consonant after them: "Mutter", "Himmel".
    { sounds: 't', write: 'tt', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'n', write: 'nn', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'l', write: 'll', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'm', write: 'mm', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'f', write: 'ff', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'p', write: 'pp', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
    { sounds: 'k', write: 'ck', after: 'a ɛ ɪ ɔ ʊ', before: 'ə' },
  ],
  say: {
    v: { say: 'v' },
    z: { say: 'z' },
  },
  punctuation: { quotes: ['„', '“'] },
  voicing:
    'Stress the first syllable and say every consonant crisply. ch is “kh” in the back of the throat, z is “ts”, and ü and ö are said with rounded lips. Let the -en and -er endings fall away quietly.',
};

export default german;
