import type { InventedLanguageDef } from '../../engine/language';
import type { SpellingRule } from '../../engine/spelling';

/** Consonants doubled between a short stressed vowel and a final e: "sonne", "bettre", "setten". */
const DOUBLED: SpellingRule[] = ['t', 'n', 'l', 's', 'p', 'd', 'm', 'r', 'f', 'g'].map((consonant) => ({
  sounds: consonant,
  write: `${consonant}${consonant}:2 ${consonant}:1`,
  after: 'a e i o u',
  before: 'ə',
}));

/**
 * Invented Middle English, the English of Chaucer: every letter said, a final e as a soft "uh",
 * "gh" at the back of the throat, vowels as in Latin (so "tyme" is "TEE-muh"), and endings in
 * -e, -en, -es, -eth and -inge. Its little words stay real ("and", "whan", "nat", "quod"), so it
 * reads as Middle English to anyone who's seen Chaucer, and means nothing.
 */
const middleEnglish: InventedLanguageDef = {
  kind: 'invented',
  id: 'middle-english',
  name: 'Middle English',
  flow: 'enm-canterbury-prose',
  sounds: {
    classes: {
      C: 't:6 s:6 m:5 w:5 h:5 b:5 d:5 f:5 l:5 k:5 p:4 g:4 r:4 n:4 θ:3 ʃ:2 tʃ:2 dʒ:2 v:2 j:1',
      M: 'r:5 l:5 n:5 d:4 t:3 s:3 m:3 v:3 ð:1.5 k:2 w:1 j:1 ʃ:1 tʃ:1 g:1',
      // Clusters: br, cr, pr, gr, fr, tr, dr, thr, bl, cl, fl, gl, pl, and kn, gn, qu and wh,
      // which Chaucer still said as written.
      O: 'b:3 p:3 k:3 f:3 g:2 t:2 d:2 θ:1 h:1',
      L: 'r:5 l:3 w:1.5 n:1',
      // s clusters: st, sp, sc, sm, sn, sl, sw.
      S: 's',
      K: 't:4 p:3 k:3 l:1 m:1 n:1 w:1',
      // Stressed vowels, short and long, and the diphthongs of "day", "cause", "newe" and "joye".
      V: 'a:6 e:5 i:5 o:5 u:3 aː:3 eː:3 ɛː:2 iː:3 oː:3 ɔː:2 uː:3 aɪ:2 au:2 ɛu:1 ɔɪ:0.5',
      // Unstressed vowels: the e of "-e", "-en", "-es", "-eth"; the i of "-inge".
      E: 'ə:8 i:2',
      // Consonants ending a stressed syllable: "knyght", "wynd", "fest", "thank".
      F: 'n:5 r:5 l:4 s:3 t:3 d:3 k:2 m:2 x+t:1.5 n+d:2 s+t:1.5 l+d:1 r+d:1 ŋ+k:1 x:0.5 f:1 θ:1 tʃ:1 ʃ:1',
      // …and an unstressed one: -en, -es, -eth, -ed, -er.
      Q: 'n:5 s:4 θ:1.5 d:2 r:2 ŋ:1 l:1',
    },
    first: 'CV:6 CVF:8 OLVF:2 OLV:2 SKVF:1 VF:2 V:1',
    syllables: 'ME:6 MEQ:2',
    last: 'ME:7 MEQ:4',
    single: 'CVF:8 CV:4 VF:3 OLVF:2 V:1',
    stress: 'initial',
    avoid: [
      '^ð',
      // kn, gn and wh, but not the hr and hl of Old English, or clusters English never had.
      'tl|dl|θl|[bpfg]w|[bptdfθh]n|h[rl]',
      '([ptkbdgmnlrsfvθðʃ])\\.\\1',
      'x.*x|ʃ.*ʃ|tʃ.*tʃ',
    ],
    maxSyllables: 3,
  },
  spelling: [
    { sounds: 'i ŋ', write: 'inge:3 ing:1', before: '#' },
    { sounds: 'h w', write: 'wh' },
    { sounds: 'k w', write: 'qu' },
    { sounds: 'x t', write: 'ght' },
    { sounds: 'x', write: 'gh' },
    { sounds: 'ŋ k', write: 'nk' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'ʃ', write: 'sh:3 ssh:1' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'dʒ', write: 'g', before: 'front' },
    { sounds: 'dʒ', write: 'j' },
    { sounds: 'θ', write: 'th' },
    { sounds: 'ð', write: 'th' },
    { sounds: 'j', write: 'y' },
    // k before e, i and n ("kepe", "knyght"), and at the end ("blak"); c elsewhere ("cas").
    { sounds: 'k', write: 'k', before: 'front n #' },
    { sounds: 'k', write: 'c' },
    ...DOUBLED,
    // Long vowels as Chaucer's scribes wrote them: "tyme", "hous", "good", "heed".
    { sounds: 'iː', write: 'y:3 i:1' },
    { sounds: 'i', write: 'i:3 y:1' },
    { sounds: 'uː', write: 'ow', before: '#' },
    { sounds: 'uː', write: 'ou:3 ow:1' },
    // u before m, n and v is written o: "sonne", "love".
    { sounds: 'u', write: 'o', before: 'm n v' },
    { sounds: 'oː', write: 'oo:3 o:1' },
    { sounds: 'ɔː', write: 'oo:1 o:2' },
    { sounds: 'eː', write: 'ee:3 e:1' },
    { sounds: 'ɛː', write: 'ee:2 e:2' },
    { sounds: 'aː', write: 'a:3 aa:1' },
    { sounds: 'aɪ', write: 'ay', before: '#' },
    { sounds: 'aɪ', write: 'ai:2 ay:1' },
    { sounds: 'au', write: 'aw', before: '#' },
    { sounds: 'au', write: 'au' },
    { sounds: 'ɛu', write: 'ew' },
    { sounds: 'ɔɪ', write: 'oy:1 oi:1' },
    { sounds: 'ə', write: 'e' },
  ],
  say: {
    e: { sayClosed: 'e' },
    i: { sayClosed: 'i' },
    o: { sayClosed: 'o' },
  },
  punctuation: { quotes: ['‘', '’'] },
  voicing:
    'Say every letter, as Chaucer did: the k of “kn”, the gh as the ch of Scottish “loch”, and a final e as a soft “uh”. The vowels are as in Latin or Italian, so “tyme” is “TEE-muh” and “hous” is “hoos”. Lean on the first syllable. The little words (and, whan, nat, quod) are real Middle English: say them the same way.',
  keep: [
    ...['and', 'of', 'that', 'the', 'to', 'is', 'in', 'for', 'he', 'a', 'an', 'his', 'hise', 'as', 'it', 'by', 'been', 'or', 'nat', 'ne'],
    ...['him', 'him-self', 'this', 'thise', 'thilke', 'they', 'be', 'hir', 'hire', 'ye', 'i', 'hem', 'so', 'but', 'your', 'youre', 'whan'],
    ...['have', 'han', 'hath', 'hadde', 'shal', 'shalt', 'shul', 'sholde', 'thou', 'thee', 'thy', 'thyn', 'may', 'mighte', 'with', 'no'],
    ...['noon', 'alle', 'al', 'yow', 'if', 'which', 'whiche', 'thanne', 'than', 'eek', 'wel', 'therfore', 'ther', 'do', 'doon', 'ful'],
    ...['now', 'wol', 'wolde', 'wole', 'we', 'she', 'me', 'my', 'myn', 'was', 'were', 'yet', 'swich', 'swiche', 'what', 'also', 'every'],
    ...['fro', 'us', 'our', 'oure', 'how', 'elles', 'quod', 'seith', 'seyde', 'certes', 'un-to', 'in-to', 'up-on', 'at', 'on', 'agayn'],
    ...['thurgh', 'any', 'oon', 'o', 'who', 'whos', 'here', 'til', 'am', 'art', 'som', 'somme'],
  ],
};

export default middleEnglish;
