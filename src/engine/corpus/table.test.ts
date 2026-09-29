import { describe, expect, it } from 'vitest';
import { paragraphsFromTable, readCsv } from './table';

const csv = [
  'ID,Primary_Text,Text_ID',
  '1,"Shí éí, ``Hágoshį́į́,\'\' jidííniid.",01',
  '2,One line,02',
  '3,"Two, with ""quotes""",01',
  '4,"Three,',
  'across lines",01',
  '5,Four,01',
].join('\r\n');

describe('readCsv', () => {
  it('reads quoted fields with commas, doubled quotes and line breaks', () => {
    const rows = readCsv(csv);
    expect(rows).toHaveLength(5);
    expect(rows[2]).toEqual({ ID: '3', Primary_Text: 'Two, with "quotes"', Text_ID: '01' });
    expect(rows[3].Primary_Text).toBe('Three,\r\nacross lines');
  });
});

describe('paragraphsFromTable', () => {
  it('makes paragraphs of the kept texts’ sentences, in the order asked for', () => {
    const text = paragraphsFromTable(csv, { text: 'Primary_Text', texts: { column: 'Text_ID', keep: ['02', '01'] }, sentencesPerParagraph: 3 });
    expect(text).toBe('One line\n\nShí éí, ``Hágoshį́į́,\'\' jidííniid. Two, with "quotes" Three, across lines\n\nFour\n');
  });

  it('makes its fixes to each sentence', () => {
    const text = paragraphsFromTable(csv, {
      text: 'Primary_Text',
      texts: { column: 'Text_ID', keep: ['01'] },
      sentencesPerParagraph: 1,
      fixes: [
        [/``/g, '“'],
        [/''/g, '”'],
      ],
    });
    expect(text.split('\n\n')[0]).toBe('Shí éí, “Hágoshį́į́,” jidííniid.');
  });

  it('won’t make a text of nothing', () => {
    expect(() => paragraphsFromTable(csv, { text: 'Primary_Text', texts: { column: 'Text_ID', keep: ['09'] }, sentencesPerParagraph: 2 })).toThrow('09');
  });
});
