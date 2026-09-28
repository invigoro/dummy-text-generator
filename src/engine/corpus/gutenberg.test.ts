import { describe, expect, it } from 'vitest';
import { cleanGutenberg } from './gutenberg';

const download = [
  'The Project Gutenberg eBook of Test Book',
  '',
  'Title: Test Book',
  '',
  '*** START OF THE PROJECT GUTENBERG EBOOK TEST BOOK ***',
  '',
  'TEST BOOK',
  '',
  'To my friend, with the kindest wishes, this is dedicated.',
  '',
  'PART ONE--The Beginning',
  '',
  '',
  'I',
  'The First Chapter',
  '',
  '',
  'It was a dark and stormy night on the HISPANIOLA--a ship of',
  'some repute. The _Walrus_ was elsewhere.',
  '',
  'He sang so often:',
  '',
  '          “Fifteen men on the dead man’s chest--',
  '             Yo-ho-ho, and a bottle of rum!”',
  '',
  'in the high, old voice. “AND a passage home?” he added. I’LL',
  'never forget the HISPANIOLA’S crew; HE’S a bad one.',
  '',
  'Then he began his song:',
  '',
  '     With one man of her crew alive,',
  '     What put to sea with seventy-five.',
  '',
  'It was the end. *',
  '',
  '*The footnote text.',
  '',
  'II',
  'The Second Chapter',
  '',
  'THE OLD SEA-DOG',
  '',
  'Last paragraph here.',
  '',
  'THE END',
  '',
  "End of Project Gutenberg's Test Book, by Nobody",
  '',
  '*** END OF THE PROJECT GUTENBERG EBOOK TEST BOOK ***',
  '',
  'Project Gutenberg license text.',
].join('\r\n');

describe('cleanGutenberg', () => {
  const cleaned = cleanGutenberg(download, { startAt: /^PART ONE--/, capitals: { HISPANIOLA: 'Hispaniola' } });

  it('keeps only the prose, as paragraphs separated by blank lines', () => {
    expect(cleaned).toBe(
      [
        'It was a dark and stormy night on the Hispaniola—a ship of some repute. The Walrus was elsewhere.',
        'He sang so often: in the high, old voice. “And a passage home?” he added. I’ll never forget the Hispaniola’s crew; he’s a bad one.',
        'Then he began his song.',
        'It was the end.',
        'Last paragraph here.',
      ].join('\n\n') + '\n',
    );
  });

  it('removes every trace of Project Gutenberg', () => {
    expect(cleaned).not.toMatch(/gutenberg|license/i);
  });

  it('works without start and end markers or options', () => {
    expect(cleanGutenberg('One paragraph\nwrapped.\n\n  An indented verse.\n\nTwo.')).toBe('One paragraph wrapped.\n\nTwo.\n');
  });

  it('ends an introduction whose song was the last thing in the text', () => {
    expect(cleanGutenberg('He sang:\n\n    Yo-ho-ho!')).toBe('He sang.\n');
  });

  it('refuses a start line that matches nothing', () => {
    expect(() => cleanGutenberg(download, { startAt: /^NOWHERE/ })).toThrow(/NOWHERE/);
  });

  it('can stop before a later heading, and remove characters', () => {
    const text = 'CHAPITRE PREMIER\n\nLe premier [lundi] du mois.\n\nCHAPITRE II.\n\nPlus tard.';
    expect(cleanGutenberg(text, { endBefore: /^CHAPITRE II\./, remove: /[[\]]/g })).toBe('Le premier lundi du mois.\n');
    expect(() => cleanGutenberg(text, { endBefore: /^NOWHERE/ })).toThrow(/NOWHERE/);
  });

  it('puts back a missing space between sentences', () => {
    expect(cleanGutenberg('Legatos misit.Renuntiatum est.')).toBe('Legatos misit. Renuntiatum est.\n');
  });

  it('leaves Roman numerals and single capitals alone', () => {
    expect(cleanGutenberg('King George III and I went to see HM.')).toBe('King George III and I went to see hm.\n');
  });
});
