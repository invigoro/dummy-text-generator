import { describe, expect, it } from 'vitest';
import { countWords, renderParagraph, renderSentence, tokenize, tokenizeParagraph, tokenizerFor, type Token } from './tokenize';

/** The sentences of one paragraph, as text. */
const sentences = (text: string) => tokenizeParagraph(text).sentences.map(renderSentence);

/** The word tokens of one paragraph, as text. */
const words = (text: string) =>
  tokenizeParagraph(text)
    .sentences.flatMap((sentence) => sentence.tokens)
    .filter((token) => token.kind === 'word')
    .map((token) => token.text);

const quoteMarks = (text: string) =>
  tokenizeParagraph(text)
    .sentences.flatMap((sentence) => sentence.tokens)
    .filter((token): token is Extract<Token, { kind: 'punct' }> => token.kind === 'punct' && !!token.quote)
    .map((token) => `${token.text}${token.quote}`);

describe('tokenize', () => {
  it('splits paragraphs on blank lines and joins wrapped lines', () => {
    const corpus = tokenize('First line\nwraps here.\r\n\r\nSecond paragraph.\n \nThird.');
    expect(corpus.paragraphs.map(renderParagraph)).toEqual(['First line wraps here.', 'Second paragraph.', 'Third.']);
  });

  it('ignores empty paragraphs', () => {
    expect(tokenize('\n\n\nOnly one.\n\n\n').paragraphs).toHaveLength(1);
    expect(tokenize('').paragraphs).toHaveLength(0);
  });

  it('puts a paragraph back together exactly', () => {
    const text =
      '“If that doctor was aboard,” he said, “I’d be right enough in a couple of turns; but I don’t have no manner of luck, you see, and that’s what’s the matter with me.” He grunted—or rather, I might say, he barked.';
    expect(renderParagraph(tokenizeParagraph(text))).toBe(text);
  });
});

describe('sentences', () => {
  it('splits at full stops, question marks and exclamation marks', () => {
    expect(sentences('The schooner trembled. Not a soul was to be seen! Was it? Yes…  Then quiet.')).toEqual([
      'The schooner trembled.',
      'Not a soul was to be seen!',
      'Was it?',
      'Yes…',
      'Then quiet.',
    ]);
  });

  it('does not split after titles or initials', () => {
    expect(sentences('Come aboard, Mr. Hands. Dr. Livesey waits. J. F. Flint signed it.')).toEqual([
      'Come aboard, Mr. Hands.',
      'Dr. Livesey waits.',
      'J. F. Flint signed it.',
    ]);
  });

  it('still splits after the pronoun I', () => {
    expect(sentences('It was I. Then I left.')).toEqual(['It was I.', 'Then I left.']);
  });

  it('keeps a quotation with its "said he"', () => {
    expect(sentences('“Brandy?” said he. “Much hurt?” I asked him. “Aye,” said he, “by thunder!”')).toEqual([
      '“Brandy?” said he.',
      '“Much hurt?” I asked him.',
      '“Aye,” said he, “by thunder!”',
    ]);
  });

  it('keeps the closing quotation mark with its sentence', () => {
    expect(sentences('All he could do was to utter one word, “Brandy.” It occurred to me there was no time to lose.')).toEqual([
      'All he could do was to utter one word, “Brandy.”',
      'It occurred to me there was no time to lose.',
    ]);
  });

  it('never splits inside a quotation', () => {
    const text =
      '“I’d be right. As for that swab, he’s good and dead,” he added. “He warn’t no seaman anyhow. And where mought you have come from?”';
    expect(sentences(text)).toEqual([
      '“I’d be right. As for that swab, he’s good and dead,” he added.',
      '“He warn’t no seaman anyhow. And where mought you have come from?”',
    ]);
  });

  it('keeps a speech that runs on to the next paragraph in one piece', () => {
    expect(sentences('“One thing. Another thing. A third thing.')).toEqual(['“One thing. Another thing. A third thing.']);
  });

  it('recovers from a stray closing quotation mark', () => {
    expect(sentences('He said no.” Then he left. Later he came back.')).toEqual([
      'He said no.”',
      'Then he left.',
      'Later he came back.',
    ]);
  });

  it('does not split before a lowercase word', () => {
    expect(sentences('He said “no.” and went on.')).toEqual(['He said “no.” and went on.']);
  });

  it('handles straight quotation marks', () => {
    expect(sentences('"Come aboard, Mr. Hands," I said. "Brandy." He drank.')).toEqual([
      '"Come aboard, Mr. Hands," I said.',
      '"Brandy."',
      'He drank.',
    ]);
  });
});

describe('words', () => {
  it('keeps apostrophes and hyphens inside words', () => {
    expect(words('Cap’n O’Brien don’t like the main-sail, by-the-by.')).toEqual([
      'Cap’n',
      'O’Brien',
      'don’t',
      'like',
      'the',
      'main-sail',
      'by-the-by',
    ]);
  });

  it('treats edge apostrophes as part of the word', () => {
    expect(words('He’s a bad ’un; give ’em some o’ that, lyin’ there.')).toEqual([
      'He’s',
      'a',
      'bad',
      '’un',
      'give',
      '’em',
      'some',
      'o’',
      'that',
      'lyin’',
      'there',
    ]);
  });

  it('tells a closing single quotation mark from an apostrophe', () => {
    const text = '“‘Dead men don’t bite,’ says he. It says ‘Capt. Kidd’s Anchorage’—just so.”';
    expect(words(text)).toEqual(['Dead', 'men', 'don’t', 'bite', 'says', 'he', 'It', 'says', 'Capt', 'Kidd’s', 'Anchorage', 'just', 'so']);
    expect(quoteMarks(text)).toEqual(['“open', '‘open', '’close', '‘open', '’close', '”close']);
  });

  it('knows straight-apostrophe elisions from opening quotation marks', () => {
    const text = "'Tis true. 'Here we go,' he said.";
    expect(words(text)).toEqual(["'Tis", 'true', 'Here', 'we', 'go', 'he', 'said']);
    expect(quoteMarks(text)).toEqual(["'open", "'close"]);
  });

  it('treats numbers as words and dashes as punctuation', () => {
    expect(words('In the year 17—, the brown old seaman—a tall man—came.')).toEqual([
      'In',
      'the',
      'year',
      '17',
      'the',
      'brown',
      'old',
      'seaman',
      'a',
      'tall',
      'man',
      'came',
    ]);
  });

  it('keeps accented letters in words', () => {
    expect(words('Déjà vu, naïve café.')).toEqual(['Déjà', 'vu', 'naïve', 'café']);
  });
});

describe('quotation marks', () => {
  it('marks curly and straight double quotes as opening or closing', () => {
    expect(quoteMarks('“One,” he said, "two."')).toEqual(['“open', '”close', '"open', '"close']);
  });
});

describe('other languages', () => {
  const sentencesIn = (language: string, text: string) => tokenizeParagraph(text, tokenizerFor(language)).sentences.map(renderSentence);

  it('knows French quotation marks and titles', () => {
    expect(sentencesIn('fr', '« Où est Mme Bonacieux? Je la cherche », dit-il. Puis il partit.')).toEqual([
      '« Où est Mme Bonacieux? Je la cherche », dit-il.',
      'Puis il partit.',
    ]);
  });

  it('knows Latin dates and lowercase abbreviations', () => {
    expect(sentencesIn('la', 'Is a. u. c. 689 consul fuit. Qui fuit a. d. VI Id. Novembres. Cn. Pompeius venit.')).toEqual([
      'Is a. u. c. 689 consul fuit.',
      'Qui fuit a. d. VI Id. Novembres.',
      'Cn. Pompeius venit.',
    ]);
  });

  it('knows Icelandic quotation marks', () => {
    expect(sentencesIn('is', '„Hvað er þetta? Ég veit það ekki“, sagði hann. Svo fór hann.')).toEqual([
      '„Hvað er þetta? Ég veit það ekki“, sagði hann.',
      'Svo fór hann.',
    ]);
  });

  it('falls back to English rules', () => {
    expect(tokenizerFor('xx')).toBe(tokenizerFor('en-US'));
  });
});

describe('countWords', () => {
  it('counts word tokens across sentences', () => {
    expect(countWords(tokenizeParagraph('“Much hurt?” I asked him. He grunted.').sentences)).toBe(7);
  });
});
