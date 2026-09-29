import { describe, expect, it } from 'vitest';
import { ARRANGEMENTS } from '../../engine/arrange';
import { isOffensive } from '../../engine/blocklist';
import { countDocWords, inLatin, paragraphText, sentenceText, spokenText, writtenText, type DocWord } from '../../engine/document';
import { generate } from '../../engine/generate';
import { stressRule } from '../../engine/language';
import { LANGUAGES, loadLanguage } from './index';

/** Sound symbols that belong in IPA, never in a language's own spelling (ç is a letter too, so it's not here). */
const IPA_ONLY = /[ʁʒʃɲŋəɛɔøɑɐʊɪʌɥʎɬχɣθːˈ̃]/u;

describe.each(LANGUAGES.map((def) => [def.name, def] as const))('%s', (_, def) => {
  it('writes text in every arrangement, as long as asked for', async () => {
    const loaded = await loadLanguage(def.id);
    for (const arrangement of ARRANGEMENTS) {
      const doc = generate(loaded, { arrangement, length: { unit: 'words', count: 300 }, seed: 5 });
      expect(countDocWords(doc)).toBeGreaterThanOrEqual(300);
      expect(writtenText(doc)).not.toMatch(IPA_ONLY);
    }
  });

  it('writes a conversation, with its speakers named in the language', async () => {
    const loaded = await loadLanguage(def.id);
    for (const speakers of [2, 4]) {
      const talk = generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 10 }, seed: 4, form: 'conversation', speakers });
      expect(talk).toHaveLength(10);
      const names = talk.map((line) => sentenceText(line.speaker!));
      expect(new Set(names).size).toBe(speakers);
      names.forEach((name, i) => i > 0 && expect(name).not.toBe(names[i - 1]));
      expect(writtenText(talk)).not.toMatch(IPA_ONLY);
    }
  });

  it('writes an inscription in short lines without punctuation', async () => {
    const loaded = await loadLanguage(def.id);
    const lines = generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 6 }, seed: 4, form: 'inscription' });
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(countDocWords([line])).toBeGreaterThanOrEqual(2);
      expect(countDocWords([line])).toBeLessThanOrEqual(7);
      expect(paragraphText(line)).not.toMatch(/[.,;:!?«»“”„"]/u);
    }
  });

  it('names people and places, none twice', async () => {
    const loaded = await loadLanguage(def.id);
    for (const names of ['people', 'places'] as const) {
      const doc = generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 8 }, seed: 6, form: 'names', names });
      const written = doc.map(paragraphText);
      expect(written, names).toHaveLength(8);
      expect(new Set(written).size, names).toBe(8);
      for (const name of written) {
        // Abyssal can start a name with a catch in the throat, written as an apostrophe. Arabic
        // script has no capitals.
        if (/[\p{Lu}\p{Ll}]/u.test(name)) expect(name).toMatch(/^['’]?\p{Lu}/u);
        expect(name).not.toMatch(/[.,;:!?«»“”"]/u);
        expect(name).not.toMatch(IPA_ONLY);
      }
    }
  });

  it('is the same every time for the same seed', async () => {
    const loaded = await loadLanguage(def.id);
    const options = { arrangement: 'sentences', length: { unit: 'paragraphs', count: 4 }, seed: 12 } as const;
    expect(writtenText(generate(loaded, options))).toBe(writtenText(generate(loaded, options)));
  });

  it('says every word in plain letters, with stress in capitals', async () => {
    const loaded = await loadLanguage(def.id);
    const rule = stressRule(loaded.language);
    if (!rule || loaded.language.kind === 'real') return;
    const doc = generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 600 }, seed: 3 });
    const talk = generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 10 }, seed: 3, form: 'conversation', speakers: 3 });
    for (const text of [doc, talk]) {
      const say = spokenText(text, rule, loaded.language.respell, 'say');
      expect(say).toMatch(/\p{Lu}/u);
      // Letters, hyphens and apostrophes; plain punctuation, and Spanish's ¿ ¡ to warn of a question
      // or an exclamation to come; numbers left as they were.
      expect(say).not.toMatch(/[^a-zA-Z0-9'’‘\-\s.,;:!?¿¡…—–“”()]/u);
    }
  });

  it('never invents an offensive word', async () => {
    const loaded = await loadLanguage(def.id);
    // Real words aren't invented: lorem ipsum's "cum" is Latin for "with".
    if (loaded.language.kind !== 'invented') return;
    const doc = generate(loaded, { arrangement: 'words', length: { unit: 'words', count: 5000 }, seed: 8 });
    const { respell } = loaded.language;
    for (const paragraph of doc) {
      for (const sentence of paragraph.sentences) {
        for (const token of sentence.tokens.filter((t): t is DocWord => t.kind === 'word' && !!t.spoken)) {
          const said = token.spoken!.map((word) => respell.say(word, null)).join('');
          expect(isOffensive(token.text, said, loaded.source.language), token.text).toBe(false);
        }
      }
    }
  });
});

describe('French', () => {
  it('uses guillemets and a no-break space before ! ? : ;', async () => {
    const loaded = await loadLanguage('french');
    const text = writtenText(generate(loaded, { arrangement: 'original', length: { unit: 'words', count: 3000 }, seed: 1 }));
    expect(text).toMatch(/« /u);
    expect(text).not.toMatch(/\S[!?;:]/u);
  });
});

describe('Lorem ipsum', () => {
  it('always starts the classic way', async () => {
    const loaded = await loadLanguage('lorem-ipsum');
    for (const seed of [1, 2, 3]) {
      const text = writtenText(generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 2 }, seed }));
      expect(text.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ')).toBe(true);
    }
  });

  it('leaves its opening to prose', async () => {
    const loaded = await loadLanguage('lorem-ipsum');
    for (const form of ['conversation', 'inscription'] as const) {
      const text = writtenText(generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 3 }, seed: 1, form }));
      expect(text).not.toMatch(/Lorem ipsum dolor sit amet/);
    }
  });
});

/** The words of a text, lowercase. */
const wordsOf = (text: string) => text.toLowerCase().match(/[\p{L}\p{M}’]+/gu) ?? [];

describe('Languages of the Americas', () => {
  it('spell Quechua’s e and o only beside q, where i and u open', async () => {
    const loaded = await loadLanguage('quechua');
    const text = writtenText(generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 600 }, seed: 7 }));
    expect(text).toMatch(/q/);
    for (const word of wordsOf(text)) expect(word).not.toMatch(/(?<!q[h’]?)[eo](?!q)/u);
  });

  it('write Navajo’s tones with accents, its nasal vowels with hooks, and its ł and catches', async () => {
    const loaded = await loadLanguage('navajo');
    const text = writtenText(generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 600 }, seed: 7 }));
    for (const letters of [/[áéíó]/u, /[ąęįǫ]/u, /ł/u, /’/u, /aa|ii|oo|ee/u]) expect(text).toMatch(letters);
  });

  it('write Russian and Arabic in their own alphabets, and in Latin letters for the switch', async () => {
    for (const [id, own] of [
      ['russian', /[а-яё]/u],
      ['arabic', /[\u0621-\u064A]/u],
    ] as const) {
      const loaded = await loadLanguage(id);
      const doc = generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 400 }, seed: 7 });
      expect(writtenText(doc), id).toMatch(own);
      const latin = writtenText(inLatin(doc));
      expect(latin, id).not.toMatch(own);
      expect(latin, id).toMatch(/^[\p{Script=Latin}\p{P}\p{N}\s'’ʾʿ\-]+$/u);
    }
  });

  it('join Arabic’s article to the next word, with a hyphen in Latin letters', async () => {
    const loaded = await loadLanguage('arabic');
    const doc = generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 400 }, seed: 7 });
    expect(writtenText(inLatin(doc))).toMatch(/\p{L}-\p{L}/u);
    expect(writtenText(doc)).not.toMatch(/-/);
  });

  it('write Ojibwe’s long vowels double', async () => {
    const loaded = await loadLanguage('ojibwe');
    const text = writtenText(generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 300 }, seed: 7 }));
    expect(text).toMatch(/aa|ii|oo/);
  });

  it('never run a Nahuatl word ending in tl into a consonant, in a place’s name', async () => {
    const loaded = await loadLanguage('nahuatl');
    for (const seed of [1, 2, 3, 4]) {
      const names = generate(loaded, { arrangement: 'sentences', length: { unit: 'paragraphs', count: 30 }, seed, form: 'names', names: 'places' });
      for (const name of names.map(paragraphText)) expect(name).not.toMatch(/tl(?![aeiou]|$)/iu);
    }
  });
});

describe('Middle English and Shakespearean English', () => {
  it('keep their little words real, and invent the rest', async () => {
    for (const [id, kept] of [
      ['middle-english', ['and', 'of', 'the']],
      ['shakespearean', ['the', 'you', 'my']],
    ] as const) {
      const loaded = await loadLanguage(id);
      const doc = generate(loaded, { arrangement: 'sentences', length: { unit: 'words', count: 400 }, seed: 2 });
      const text = ` ${writtenText(doc).toLowerCase()} `;
      for (const word of kept) expect(text, `${id}: ${word}`).toContain(` ${word} `);
      const invented = doc.flatMap((p) => p.sentences.flatMap((s) => s.tokens)).filter((t) => t.kind === 'word' && t.spoken);
      expect(invented.length, id).toBeGreaterThan(150);
    }
  });
});
