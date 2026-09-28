import { useEffect, useMemo, useState } from 'react';
import type { LoadedLanguage } from '../data/languages';
import { DEFAULT_CHOICE, findChoice } from '../data/settings';
import type { Arrangement, Length } from '../engine/arrange';
import { generate } from '../engine/generate';
import { isSpoken } from '../engine/language';
import { randomSeed } from '../engine/rng';
import { Controls } from './Controls';
import { Output } from './Output';
import { useLanguage } from './useLanguage';
import { readHash, writeHash, type PageState, type View } from './urlState';

const isChoice = (key: string) => !!findChoice(key);

function initialState(): PageState {
  return {
    choice: DEFAULT_CHOICE,
    arrangement: 'sentences',
    length: { unit: 'paragraphs', count: 3 },
    seed: randomSeed(),
    view: 'written',
    ...readHash(window.location.hash, isChoice),
  };
}

export default function App() {
  const [initial] = useState(initialState);
  const [choiceKey, setChoiceKey] = useState(initial.choice);
  const [arrangement, setArrangement] = useState<Arrangement>(initial.arrangement);
  const [unit, setUnit] = useState<Length['unit']>(initial.length.unit);
  // Each unit keeps its own count, so switching to words doesn't ask for 3 words.
  const [counts, setCounts] = useState<Record<Length['unit'], number>>(() => ({
    paragraphs: 3,
    words: 200,
    [initial.length.unit]: initial.length.count,
  }));
  const [seed, setSeed] = useState(initial.seed);
  const [view, setView] = useState<View>(initial.view);

  const found = findChoice(choiceKey) ?? findChoice(DEFAULT_CHOICE)!;
  const language = useLanguage(found.choice.language);
  const length: Length = { unit, count: counts[unit] };

  const text = useMemo(
    () => (language.status === 'ready' ? generate(language.loaded, { arrangement, length: { unit, count: counts[unit] }, seed }) : null),
    [language, arrangement, unit, counts, seed],
  );

  // The URL always describes the page, so it can be bookmarked or shared.
  const hash = writeHash({ choice: found.key, arrangement, length, seed, view });
  useEffect(() => {
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [hash]);

  // A link pasted into the address bar of an open page changes only the hash.
  useEffect(() => {
    const apply = () => {
      const state = readHash(window.location.hash, isChoice);
      if (state.choice) setChoiceKey(state.choice);
      if (state.arrangement) setArrangement(state.arrangement);
      if (state.length) {
        const { unit: newUnit, count } = state.length;
        setUnit(newUnit);
        setCounts((current) => ({ ...current, [newUnit]: count }));
      }
      if (state.seed !== undefined) setSeed(state.seed);
      if (state.view) setView(state.view);
    };
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  return (
    <div className="app">
      <aside className="panel">
        <header className="brand">
          <h1>Dummy Text Generator</h1>
          <p>Lorem ipsum for tabletop games</p>
        </header>

        <Controls
          choice={found.key}
          onChoice={setChoiceKey}
          spoken={language.status === 'ready' && isSpoken(language.loaded.language)}
          view={view}
          onView={setView}
          arrangement={arrangement}
          onArrangement={setArrangement}
          length={length}
          onUnit={setUnit}
          onCount={(count) => setCounts((current) => ({ ...current, [unit]: count }))}
          seed={seed}
          onReroll={() => setSeed(randomSeed())}
        />

        {language.status === 'ready' && <Credit loaded={language.loaded} />}
        <About className="about beside-text" />
      </aside>

      <main className="stage">
        {language.status === 'loading' && <p className="message">Loading…</p>}
        {language.status === 'failed' && (
          <div className="message" role="alert">
            <p>Couldn’t load the text. Check your connection and try again.</p>
            <button type="button" onClick={language.retry}>
              Try again
            </button>
          </div>
        )}
        {text && language.status === 'ready' && (
          <Output paragraphs={text} language={language.loaded.language} view={view} stele={found.choice.stele} />
        )}
      </main>

      <About className="about below-text" />
    </div>
  );
}

/** Where the text comes from, and that it's in the public domain. */
function Credit({ loaded }: { loaded: LoadedLanguage }) {
  const { language, source } = loaded;
  const work = (
    <>
      <cite>{source.title}</cite> by {source.author} ({source.date})
    </>
  );
  return (
    <p className="source">
      {language.kind === 'real' && <>From {work}, in the public domain.</>}
      {language.kind === 'invented' && <>Invented words, with the flow of {work}, in the public domain.</>}
      {language.kind === 'vocabulary' && <>{language.name}’s own words, with the flow of {work}.</>}
    </p>
  );
}

/** Links to Stele and the source. Beside the text on wide screens, after it on narrow ones. */
function About({ className }: { className: string }) {
  return (
    <footer className={className}>
      <p>
        Turn the text into a weathered inscription or an aged letter with{' '}
        <a href="https://stele.invigoro.me/" target="_blank" rel="noopener">
          Stele
        </a>
        .
      </p>
      <p>
        <a href="https://github.com/invigoro/dummy-text-generator" target="_blank" rel="noopener">
          Source on GitHub
        </a>
      </p>
    </footer>
  );
}
