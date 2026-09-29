/**
 * Source texts from a table, such as a language corpus published as a CSV file with one sentence
 * to a row: the sentences of the texts wanted, in their order, made into paragraphs.
 */

/** The rows of a CSV file as records by column. Quoted fields may hold commas, line breaks and doubled quotes. */
export function readCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...records] = rows.filter((cells) => cells.some((cell) => cell !== ''));
  return records.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}

export interface TableOptions {
  /** The column holding each row's sentence. */
  text: string;
  /** The column naming the text a row belongs to, and the texts to keep, in the order to keep them. */
  texts: { column: string; keep: readonly string[] };
  /** How many sentences make a paragraph, where the table doesn't mark paragraphs. A text always starts a new one. */
  sentencesPerParagraph: number;
  /** Corrections, as [pattern, replacement] pairs, made to each sentence. */
  fixes?: readonly (readonly [RegExp, string])[];
}

/** The kept texts' sentences, in paragraphs: a source text, one paragraph to a line with a blank line between. */
export function paragraphsFromTable(csv: string, options: TableOptions): string {
  const rows = readCsv(csv);
  const { text, texts, sentencesPerParagraph, fixes = [] } = options;
  const paragraphs: string[] = [];
  for (const id of texts.keep) {
    const sentences = rows
      .filter((row) => row[texts.column] === id)
      .map((row) => fixes.reduce((sentence, [pattern, replacement]) => sentence.replace(pattern, replacement), row[text]))
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (sentences.length === 0) throw new Error(`No sentences in text "${id}"`);
    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
      paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
  }
  return paragraphs.join('\n\n') + '\n';
}
