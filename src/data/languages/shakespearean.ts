import type { InventedLanguageDef } from '../../engine/language';
import englishInvented from './english-invented';

/** Endings of Shakespeare's verbs, spelled as he spelled them: "-eth" and "-est". */
const ENDINGS = [
  { sounds: 'ə θ', write: 'eth', before: '#' },
  { sounds: 'ɪ θ', write: 'eth', before: '#' },
  { sounds: 'ə s t', write: 'est', before: '#' },
  { sounds: 'ɪ s t', write: 'est', before: '#' },
] as const;

/**
 * Invented Shakespearean English: invented English's sounds and spelling, with the -eth and
 * -est of Shakespeare's verbs, on the rhythm of Hamlet. Its little words stay real ("thou",
 * "hath", "'tis", "my lord"), as in "Jabberwocky", so it reads as Shakespeare and means nothing.
 */
const shakespearean: InventedLanguageDef = {
  ...englishInvented,
  id: 'shakespearean',
  name: 'Shakespearean English',
  flow: 'en-hamlet',
  sounds: {
    ...englishInvented.sounds,
    classes: {
      ...englishInvented.sounds.classes,
      // Unstressed endings, with -eth and -est among them.
      Q: 'n:5 l:4 r:4 θ:2.5 s+t:2 s:2 t:2 d:2 ŋ:1.5 z:1 m:1',
    },
  },
  spelling: [...ENDINGS, ...englishInvented.spelling],
  voicing:
    'Speak it as a player would: lean on the first syllable of each word, let the rest fall away, and give -eth and -est their due. The little words (thou, hath, ’tis, my lord) are real; say them as they’re written.',
  keep: [
    ...['the', 'and', 'to', 'of', 'you', 'i', 'my', 'a', 'an', 'it', 'in', 'that', 'is', 'not', 'this', 'his', 'but', 'with', 'for', 'your'],
    ...['me', 'as', 'be', 'he', 'what', 'so', 'him', 'have', 'will', 'do', 'no', 'we', 'are', 'on', 'our', 'by', 'if', 'all', 'or', 'o'],
    ...['shall', 'thou', 'now', 'they', 'let', 'from', 'how', 'her', 'thy', 'at', 'was', 'would', 'there', "'tis", "'twas", "'twere", "'twill"],
    ...['them', 'may', 'us', 'hath', 'did', 'which', 'why', 'then', 'must', 'thee', 'their', 'where', 'such', 'should', 'am', 'here'],
    ...['upon', 'when', 'than', 'too', 'these', 'some', 'who', 'whom', 'whose', 'yet', 'thus', 'ay', 'nay', 'nor', 'can', 'mine', 'thine'],
    ...['up', 'could', 'might', 'into', 'doth', 'dost', 'does', 'did', 'didst', 'were', 'though', 'hast', 'art', 'shalt', 'wilt', 'canst'],
    ...['ere', 'hence', 'thence', 'whence', 'wherefore', "o'er", "e'en", "ne'er", "i'll", 'prithee', 'alas', 'marry', 'forsooth', 'fie'],
    ...['sir', 'lord', 'she', 'had', 'been', 'ye'],
  ],
};

export default shakespearean;
