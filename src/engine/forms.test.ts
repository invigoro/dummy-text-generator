import { describe, expect, it } from 'vitest';
import { conversation, inscription, phraseLines, speechLines } from './forms';
import { mulberry32 } from './rng';
import { countWords, renderParagraph, renderSentence, tokenize, tokenizerFor, type Corpus } from './tokenize';

const corpus = (language: string, ...paragraphs: string[]): Corpus => tokenize(paragraphs.join('\n\n'), tokenizerFor(language));
const speech = (language: string, ...paragraphs: string[]) => speechLines(corpus(language, ...paragraphs)).map(renderSentence);

describe('speechLines', () => {
  it('takes what’s inside quotation marks, as one line for each paragraph', () => {
    expect(
      speech(
        'en',
        '“Come here, sonny,” says he. “Come nearer here.”',
        '“I reckon,” he said at last—“I reckon, Cap’n Hawkins, you’ll want to get ashore.”',
      ),
    ).toEqual(['Come here, sonny. Come nearer here.', 'I reckon, I reckon, Cap’n Hawkins, you’ll want to get ashore.']);
  });

  it('joins speech either side of a "he said" into one sentence', () => {
    expect(speech('is', '"Nei", sagði ég, "maurildi ber ekki svona mikla birtu."')).toEqual(['Nei, maurildi ber ekki svona mikla birtu.']);
    expect(speech('de', '»Kind,« sagte der Vater mitleidig, »was sollen wir aber tun?«')).toEqual(['Kind, was sollen wir aber tun?']);
  });

  it('ends a line as a sentence, and keeps one that was cut off', () => {
    expect(speech('en', '“Well,” said he.', '“But so—” and she stopped.')).toEqual(['Well.', 'But so—']);
  });

  it('starts a line at its first word, or at an ellipsis', () => {
    expect(speech('is', '". . . . . hver er þar?" spurði hann.', '"…og svo fór hann."')).toEqual(['Hver er þar?', '…og svo fór hann.']);
  });

  it('keeps a speech that runs on into the next paragraph', () => {
    expect(speech('en', '“It was a long time ago, and I was young.', '“Then I went to sea.”')).toEqual([
      'It was a long time ago, and I was young.',
      'Then I went to sea.',
    ]);
  });

  it('takes lines that start with a dash, without the dash or a stray closing mark', () => {
    expect(speech('fr', '— Oui, dit d’Artagnan, je le ferai.»', '— Bien.')).toEqual(['Oui, dit d’Artagnan, je le ferai.', 'Bien.']);
  });

  it('leaves out the asides between dashes in Spanish', () => {
    expect(
      speech(
        'es',
        '—Si os la mostrara —replicó don Quijote—, ¿qué hiciérades vosotros?',
        '—¿Qué gigantes? —dijo Sancho Panza.',
        '—No, señor —respondió Sancho.',
        '—¿Pues? —dijo Sancho—. Oh, ¡qué bien!',
      ),
    ).toEqual(['Si os la mostrara, ¿qué hiciérades vosotros?', '¿Qué gigantes?', 'No, señor.', '¿Pues? Oh, ¡qué bien!']);
  });

  it('takes the lines of a play, without their speakers’ names', () => {
    const play = ['Juhani. Jos siihen tulee.', 'Timo. Olit, olit.', 'Juhani. Niin.', 'Timo. Minä myös.', 'Juhani. Hyvä.', 'Timo. Totta.'];
    expect(speech('fi', ...play)).toEqual(['Jos siihen tulee.', 'Olit, olit.', 'Niin.', 'Minä myös.', 'Hyvä.', 'Totta.']);
  });

  it('makes do with short sentences in a text with little speech, and never repeats a line', () => {
    const lines = speech('la', 'Caesar venit. Galli fugerunt, et castra relinquerunt.', '— Veni.', 'Hoc proelium longum et difficile fuit.');
    expect(lines).toEqual(['Veni.', 'Caesar venit.', 'Galli fugerunt, et castra relinquerunt.', 'Hoc proelium longum et difficile fuit.']);
  });

  it('leaves out lines with no real word in them, and monologues', () => {
    const monologue = `“${Array.from({ length: 50 }, () => 'word').join(' ')}.”`;
    expect(speech('en', '“B.”', monologue, '“Aye.”')).toEqual(['Aye.']);
  });
});

describe('conversation', () => {
  const talk = corpus(
    'en',
    ...Array.from({ length: 40 }, (_, i) => `“Line number ${i + 1}, Silver,” said Hawkins to Silver, with the rest of the crew.`),
    'Then Hawkins and Silver and Trelawney and Livesey and Smollett went ashore, and Trelawney and Livesey and Smollett stayed, and Trelawney, Livesey and Smollett slept.',
    'Then the Hispaniola sailed, and the Hispaniola sank, and the Hispaniola was lost.',
  );

  it('gives every speaker a line in turn, then never the same one twice in a row', () => {
    for (const speakers of [2, 3, 4]) {
      const { order } = conversation(talk, 'sentences', { unit: 'paragraphs', count: 30 }, speakers, mulberry32(speakers));
      expect(order.slice(0, speakers)).toEqual(Array.from({ length: speakers }, (_, i) => i));
      expect(Math.max(...order)).toBe(speakers - 1);
      order.forEach((speaker, i) => i > 0 && expect(speaker).not.toBe(order[i - 1]));
    }
  });

  it('keeps to two to four speakers', () => {
    expect(Math.max(...conversation(talk, 'sentences', { unit: 'paragraphs', count: 20 }, 9, mulberry32(1)).order)).toBe(3);
    expect(Math.max(...conversation(talk, 'sentences', { unit: 'paragraphs', count: 20 }, 1, mulberry32(1)).order)).toBe(1);
  });

  it('keeps the source’s order, or shuffles it', () => {
    const inOrder = conversation(talk, 'original', { unit: 'paragraphs', count: 5 }, 2, mulberry32(2)).lines.map(renderParagraph);
    const first = Number(/\d+/.exec(inOrder[0])![0]);
    expect(inOrder).toEqual(Array.from({ length: 5 }, (_, i) => `Line number ${((first - 1 + i) % 40) + 1}, Silver.`));
    const shuffled = conversation(talk, 'sentences', { unit: 'paragraphs', count: 5 }, 2, mulberry32(2)).lines.map(renderParagraph);
    expect(shuffled).not.toEqual(inOrder);
  });

  it('counts its length in lines or in words', () => {
    expect(conversation(talk, 'sentences', { unit: 'paragraphs', count: 7 }, 2, mulberry32(3)).lines).toHaveLength(7);
    const { lines } = conversation(talk, 'words', { unit: 'words', count: 50 }, 2, mulberry32(3));
    expect(countWords(lines.flatMap((line) => line.sentences))).toBeGreaterThanOrEqual(50);
  });

  it('names speakers after the source’s people, not its ships', () => {
    const { names } = conversation(talk, 'sentences', { unit: 'paragraphs', count: 4 }, 2, mulberry32(4));
    expect(names.slice(0, 5).sort()).toEqual(['Hawkins', 'Livesey', 'Silver', 'Smollett', 'Trelawney']);
    expect(names).not.toContain('Hispaniola');
  });

  it('never names a speaker with a word that is a whole line', () => {
    const shouts = corpus('en', ...Array.from({ length: 40 }, (_, i) => (i % 2 ? '“Silver!” cried Hawkins to Silver and Livesey.' : `“Go ${i}.”`)));
    const { names } = conversation(shouts, 'original', { unit: 'paragraphs', count: 6 }, 2, mulberry32(5));
    expect(names).not.toContain('Silver');
    expect(names).toContain('Hawkins');
  });
});

describe('inscription', () => {
  const prose = corpus(
    'en',
    'It was a dark and stormy night, and the rain fell in torrents; except at occasional intervals, when it was checked by a violent gust of wind.',
    '“Pieces of eight!” cried the parrot. Mr. Smith said nothing at all.',
    ...Array.from({ length: 12 }, (_, i) => `The ship sailed on, day ${i + 1} of the voyage, over the grey sea.`),
  );

  it('takes short phrases, capitalized, without their punctuation', () => {
    const phrases = phraseLines(prose).map(renderSentence);
    expect(phrases.slice(0, 3)).toEqual(['It was a dark and stormy night', 'And the rain fell in torrents', 'Except at occasional intervals']);
    expect(phrases).toContain('Pieces of eight');
    for (const phrase of phrases) {
      expect(phrase).not.toMatch(/[.,;:!?“”]/u);
      expect(phrase.split(' ').length).toBeGreaterThanOrEqual(2);
      expect(phrase.split(' ').length).toBeLessThanOrEqual(7);
    }
  });

  it('leaves out a phrase broken by an abbreviation', () => {
    expect(phraseLines(prose).map(renderSentence).filter((phrase) => /Mr|Smith said/.test(phrase))).toEqual(['Smith said nothing at all']);
  });

  it('gives as many lines as asked for', () => {
    expect(inscription(prose, 'sentences', { unit: 'paragraphs', count: 4 }, mulberry32(1))).toHaveLength(4);
    expect(inscription(prose, 'original', { unit: 'paragraphs', count: 2 }, mulberry32(1))).toHaveLength(2);
  });

  it('cuts a text with few phrases into lines of up to seven words', () => {
    const lorem = corpus('la', 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua');
    expect(phraseLines(lorem).map(renderSentence)).toEqual([
      'Lorem ipsum dolor sit amet consectetur adipiscing',
      'Elit sed do eiusmod tempor incididunt ut',
      'Labore et dolore magna aliqua',
    ]);
  });
});
