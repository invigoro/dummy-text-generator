import { describe, expect, it } from 'vitest';
import { cleanScan } from './scan';

const FRENCH = { words: ['le', 'la', 'les', 'et', 'qui', 'que', 'des'], letters: /[éèà]/u, share: 0.1 };

// Two pages of a book printed with its Nahuatl in one column and a French translation in the
// other, as OCR gives them: a column at a time, with running heads, page numbers and notes.
const scan = [
  'INTRODUCTION',
  '',
  'Front matter the text leaves out.',
  '',
  'SIXIEME RELATION',
  '',
  'III calli xihuitl. Ynic aci-',
  'co yn Chichimeca yn oncan Tepetl-',
  'icpac, auh yn ontlachixque yn',
  '',
  "Année 3 maison. Alors les Chichimèques arrivèrent à Tépetlicpac, et ils virent qu'il y avait là",
  '',
  '1. Une note de la page, que le texte laisse.',
  '',
  '12',
  '',
  'ANNALES DE CHIMALPAHIN',
  '',
  'oncan cate yn Xochmeca.',
  '',
  'IIII tochtli xihuitl. Ynic achtopa quixtetzotzonaco quahuitl yn Tliltecatzin',
  '',
  'IX acatl xihuitl. Çan oc oncan onenehuaya yn Chichimeca, yn Chalco-',
  'Atenco.',
  '',
  'Voyez année.',
  '',
  'TABLE DES MATIERES',
  '',
  'Acacitzin, 18.',
].join('\n');

const clean = (options = {}) =>
  cleanScan(scan, {
    startAt: /^SIXIEME RELATION$/,
    endBefore: /^TABLE DES MATIERES$/,
    otherLanguage: FRENCH,
    paragraphStart: /^[IVXL]+\s+\p{L}+\s+xihuitl/u,
    ...options,
  });

describe('cleanScan', () => {
  it('keeps the text, from its start to where it ends, a paragraph to a line', () => {
    const paragraphs = clean().trimEnd().split('\n\n');
    expect(paragraphs[0]).toMatch(/^III calli xihuitl\./);
    expect(paragraphs.at(-1)).toMatch(/Chalco-Atenco\.$/);
    expect(clean()).not.toMatch(/INTRODUCTION|Front matter|Acacitzin/);
  });

  it('leaves out the other column, the notes, the running heads and the page numbers', () => {
    expect(clean()).not.toMatch(/Année|Chichimèques|note|ANNALES|12|Voyez/);
  });

  it('rejoins words split across lines, keeping a compound’s hyphen', () => {
    expect(clean()).toContain('Ynic acico yn Chichimeca yn oncan Tepetlicpac, auh');
    expect(clean()).toContain('Chalco-Atenco');
  });

  it('carries a paragraph on across a page, past the other column', () => {
    expect(clean()).toContain('auh yn ontlachixque yn oncan cate yn Xochmeca.');
  });

  it('starts a new paragraph where one plainly starts, ending the one before', () => {
    const paragraphs = clean().trimEnd().split('\n\n');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[1]).toBe('IIII tochtli xihuitl. Ynic achtopa quixtetzotzonaco quahuitl yn Tliltecatzin.');
  });

  it('corrects misreadings in each line before rejoining its words, and makes fixes to each paragraph', () => {
    const text = cleanScan('Ynic acico yn Tepet!-\nicpac, auh yn Çan oncan.\n', {
      misreadings: [[/(\p{L})!(?=-)/gu, '$1l']],
      fixes: [[/Çan/g, 'Zan']],
    });
    expect(text).toBe('Ynic acico yn Tepetlicpac, auh yn Zan oncan.\n');
  });

  it('drops the lines it’s told to', () => {
    expect(clean({ dropLines: /^oncan cate/ })).not.toContain('Xochmeca');
  });
});
