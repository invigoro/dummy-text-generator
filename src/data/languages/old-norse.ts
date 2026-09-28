import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Old Norse: heavy consonant clusters, long vowels with acute accents, þ and ð, stress
 * on the first syllable, and endings in -r, -ur, -ir, -ar and -inn.
 */
const oldNorse: InventedLanguageDef = {
  kind: 'invented',
  id: 'old-norse',
  name: 'Old Norse',
  flow: 'is-saefarinn',
  sounds: {
    classes: {
      // Consonants starting a word, and starting a syllable inside one (where ð can appear).
      C: 'r:6 s:6 t:6 k:5 m:5 n:5 l:5 g:4 f:4 v:4 b:4 d:4 h:3 θ:3 j:1 p:1',
      M: 'r:4 l:4 n:4 t:4 ð:3 d:3 k:3 g:3 s:3 m:2 v:2 f:1 j:1 θ:0.5',
      // Clusters: br, dr, fr, gr, kr, tr, þr, hr, bl, fl, gl, kl, hl, hv, kv, þv, kn, hn…
      O: 'k:2 g:2 h:2 b:1 d:1 f:1 t:1 θ:1',
      L: 'r:4 l:2 v:1 n:0.5',
      // …and sk, st, sp, sn, sl, sm, sv.
      S: 's',
      K: 'k:3 t:3 p:1 n:1 l:1 m:1 v:1',
      V: 'a:8 i:6 u:5 e:4 o:4 aː:3 iː:2 oː:2 uː:2 y:1 ø:1 eː:1 ɛː:1 au:1 ei:1 ey:0.5 yː:0.5 øː:0.5',
      F: 'r:4 l:3 n:3 s:2 k:1 g:1 t:1 m:1 f:1 ð:1',
      // The vowels and consonants of endings.
      E: 'a:5 i:4 u:4',
      Z: 'r:8 n:2 n+n:2 m:2 s:1 ð:1 t:1 l+l:1 l+d:1 n+d:1 r+n:1 r+ð:1 k:1',
    },
    syllables: 'MV:6 MVF:3',
    first: 'CV:4 CVF:6 V:1 VF:1 OLV:2 OLVF:1 SKV:1 SKVF:1',
    last: 'MEZ:7 ME:4 MVZ:2 MVF:1',
    single: 'CVF:5 CVZ:3 CV:2 VF:2 OLVF:1 SKVF:1',
    stress: 'initial',
    avoid: ['^ð', 'jj|j[iɪ]|θθ|ðð', 'dl|tl|θl|bv|fv|dn|tn|θn|bn|fn|gv'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'θ', write: 'þ' },
    { sounds: 'k s', write: 'x' },
    { sounds: 'aː', write: 'á' },
    { sounds: 'eː', write: 'é' },
    { sounds: 'iː', write: 'í' },
    { sounds: 'oː', write: 'ó' },
    { sounds: 'uː', write: 'ú' },
    { sounds: 'yː', write: 'ý' },
    { sounds: 'ɛː', write: 'æ' },
    { sounds: 'ø', write: 'ö' },
    { sounds: 'øː', write: 'œ' },
  ],
  say: {
    e: { sayClosed: 'e' },
    i: { sayClosed: 'i' },
    o: { sayClosed: 'o' },
  },
  punctuation: { quotes: ['„', '“'] },
  voicing:
    'Hit the first syllable of every word hard, roll the r’s, and hold double consonants a moment longer. Þ is the th in “thin”, ð the th in “this”.',
};

export default oldNorse;
