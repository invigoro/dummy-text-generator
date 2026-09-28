import { useEffect, useMemo, useState } from 'react';
import { LANGUAGES, loadLanguage, type LoadedLanguage } from '../data/languages';
import { arrange } from '../engine/arrange';
import { sayWords, spokenText, writtenText, type DocParagraph, type DocWord } from '../engine/document';
import type { Form } from '../engine/forms';
import { generate } from '../engine/generate';
import { voiceOf, type Language, type Voice } from '../engine/language';
import { mulberry32 } from '../engine/rng';
import { inventWord } from '../engine/sounds/words';
import { spell } from '../engine/spelling';
import { tally, textStats, type Tally, type TextStats } from './stats';

/** How much running text the statistics are taken over. */
const STAT_WORDS = 5000;

interface Row {
  source?: string;
  written: string;
  say?: string;
  ipa?: string;
}

/** A word as a row of the table: how it's written, said, and said in IPA. */
function row(word: DocWord, voice: Voice | null, source?: string): Row {
  const said = voice ? sayWords({ tokens: [word] }, voice.rule, voice.respell)[0] : null;
  return { source, written: word.text, say: said?.say, ipa: said?.ipa };
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** The dev server's page for tuning sound systems: sample words and statistics for each language. */
export function Lab() {
  const [id, setId] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('lang') ?? 'french');
  const [seed, setSeed] = useState(1);
  const [loaded, setLoaded] = useState<LoadedLanguage | null>(null);

  useEffect(() => {
    let current = true;
    loadLanguage(id).then((language) => {
      if (current) setLoaded(language);
    });
    window.history.replaceState(null, '', `#lang=${id}`);
    return () => {
      current = false;
    };
  }, [id]);

  return (
    <main className="lab">
      <header className="lab-bar">
        <h1>Sound system lab</h1>
        <label>
          Language{' '}
          <select value={id} onChange={(event) => setId(event.target.value)}>
            {LANGUAGES.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name} ({language.kind})
              </option>
            ))}
          </select>
        </label>
        <label>
          Seed <input type="number" min={1} value={seed} onChange={(event) => setSeed(Math.max(1, Number(event.target.value) || 1))} />
        </label>
        <button type="button" onClick={() => setSeed(seed + 1)}>
          Next seed
        </button>
      </header>
      {loaded && loaded.language.id === id ? <Report loaded={loaded} seed={seed} /> : <p>Loading…</p>}
    </main>
  );
}

function Report({ loaded, seed }: { loaded: LoadedLanguage; seed: number }) {
  const { language, source } = loaded;
  const voice = useMemo(() => voiceOf(language), [language]);

  const common = useMemo(() => commonWords(loaded, voice), [loaded, voice]);
  const fresh = useMemo(() => freshWords(language, voice, seed), [language, voice, seed]);
  const stats = useMemo(() => {
    const flow = arrange(loaded.flow, 'original', { unit: 'words', count: STAT_WORDS }, mulberry32(seed));
    return { language: textStats(loaded.words(flow, { opening: false })), source: textStats(flow) };
  }, [loaded, seed]);

  return (
    <>
      <p className="lab-source">
        Flow from <cite>{source.title}</cite> ({source.language}). {'voicing' in language && language.voicing}
      </p>

      <section>
        <h2>The source’s commonest words</h2>
        <WordTable rows={common} showSource />
      </section>

      {fresh.length > 0 && (
        <section>
          <h2>Words straight from the sound system</h2>
          <WordTable rows={fresh} />
        </section>
      )}

      <section>
        <h2>Statistics, over {STAT_WORDS.toLocaleString('en')} words</h2>
        <StatsTable name={language.name} source={source.title} stats={stats} />
        <div className="lab-bars">
          {stats.language.sounds.length > 0 && <Bars title="Sounds" tallies={stats.language.sounds.slice(0, 30)} />}
          <Bars title={`Letters: ${language.name}`} tallies={stats.language.alphabet.slice(0, 30)} />
          <Bars title={`Letters: ${source.title}`} tallies={stats.source.alphabet.slice(0, 30)} />
          <Bars title="Commonest words" tallies={stats.language.common.slice(0, 30)} />
        </div>
      </section>

      <section>
        <h2>Samples</h2>
        {(['prose', 'conversation', 'inscription'] as Form[]).map((form) => (
          <Sample key={form} loaded={loaded} voice={voice} form={form} seed={seed} />
        ))}
      </section>
    </>
  );
}

/** The 40 commonest words of the source text, and what the language makes of them. */
function commonWords(loaded: LoadedLanguage, voice: Voice | null): Row[] {
  const words = loaded.flow.paragraphs.flatMap((paragraph) =>
    paragraph.sentences.flatMap((sentence) => sentence.tokens.filter((token) => token.kind === 'word').map((token) => token.text.toLowerCase())),
  );
  return tally(words)
    .slice(0, 40)
    .map(({ item }) => {
      const [paragraph] = loaded.words([{ sentences: [{ tokens: [{ kind: 'word', text: item }] }] }], { opening: false });
      return row(paragraph.sentences[0].tokens[0] as DocWord, voice, item);
    });
}

/** Thirty words invented from nothing but the sound system, of one to four syllables. */
function freshWords(language: Language, voice: Voice | null, seed: number): Row[] {
  if (language.kind !== 'invented') return [];
  return Array.from({ length: 30 }, (_, i) => {
    const random = mulberry32(seed * 7919 + i);
    const sounds = inventWord(language.system, random, { syllables: 1 + (i % 4) });
    return row({ kind: 'word', text: spell(sounds, language.rules, random), spoken: [sounds] }, voice);
  });
}

/** Words in two tables side by side, so a long list fits on the screen. */
function WordTable({ rows, showSource }: { rows: Row[]; showSource?: boolean }) {
  const half = Math.ceil(rows.length / 2);
  return (
    <div className="lab-columns">
      {[rows.slice(0, half), rows.slice(half)].map((column, i) => (
        <table key={i}>
          <thead>
            <tr>
              {showSource && <th>Source</th>}
              <th>Written</th>
              <th>Say it</th>
              <th>IPA</th>
            </tr>
          </thead>
          <tbody>
            {column.map((word, j) => (
              <tr key={j}>
                {showSource && <td className="muted">{word.source}</td>}
                <td>{word.written}</td>
                <td>{word.say}</td>
                <td className="ipa">{word.ipa && `/${word.ipa}/`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

function StatsTable({ name, source, stats }: { name: string; source: string; stats: { language: TextStats; source: TextStats } }) {
  const rows: [string, (s: TextStats) => string][] = [
    ['Distinct words', (s) => s.vocabulary.toLocaleString('en')],
    ['Letters per word', (s) => s.letters.toFixed(2)],
    ['Syllables per word (1 · 2 · 3 · 4 · 5+)', (s) => (s.syllables.length > 0 ? s.syllables.map(percent).join(' · ') : '—')],
    ['Syllables ending in a consonant', (s) => (s.sounds.length > 0 ? percent(s.closed) : '—')],
    ['Words starting with a vowel', (s) => (s.sounds.length > 0 ? percent(s.vowelFirst) : '—')],
    ['Words with marked stress', (s) => (s.sounds.length > 0 ? percent(s.marked) : '—')],
    ['Share of the ten commonest words', (s) => percent(s.common.slice(0, 10).reduce((sum, word) => sum + word.share, 0))],
  ];
  return (
    <table className="lab-stats">
      <thead>
        <tr>
          <th />
          <th>{name}</th>
          <th>{source}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th>{label}</th>
            <td>{value(stats.language)}</td>
            <td>{value(stats.source)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bars({ title, tallies }: { title: string; tallies: Tally[] }) {
  const most = tallies[0]?.share ?? 1;
  return (
    <figure className="lab-bar-chart">
      <figcaption>{title}</figcaption>
      {tallies.map((entry) => (
        <div key={entry.item} className="lab-bar-row" title={`${entry.count.toLocaleString('en')} (${(entry.share * 100).toFixed(1)}%)`}>
          <span className="lab-bar-label">{entry.item}</span>
          <span className="lab-bar-fill" style={{ width: `${(entry.share / most) * 100}%` }} />
        </div>
      ))}
    </figure>
  );
}

function Sample({ loaded, voice, form, seed }: { loaded: LoadedLanguage; voice: Voice | null; form: Form; seed: number }) {
  const text: DocParagraph[] = useMemo(() => {
    const length = { unit: 'paragraphs', count: form === 'prose' ? 1 : 4 } as const;
    return generate(loaded, { arrangement: 'sentences', length, seed, form, speakers: 3 });
  }, [loaded, form, seed]);
  const separator = form === 'inscription' ? '\n' : '\n\n';
  return (
    <div className="lab-sample">
      <h3>{form[0].toUpperCase() + form.slice(1)}</h3>
      <pre>{writtenText(text, separator)}</pre>
      {voice && <pre className="muted">{spokenText(text, voice.rule, voice.respell, 'say', separator)}</pre>}
      {voice && <pre className="muted ipa">{spokenText(text, voice.rule, voice.respell, 'ipa', separator)}</pre>}
    </div>
  );
}
