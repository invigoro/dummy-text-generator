import { useMemo, useState } from 'react';
import type { Arrangement, Length } from '../engine/arrange';
import { generate } from '../engine/generate';
import { randomSeed } from '../engine/rng';
import { Controls } from './Controls';
import { Output } from './Output';
import { useLanguage } from './useLanguage';


export default function App() {
  const [arrangement, setArrangement] = useState<Arrangement>('sentences');
  const [unit, setUnit] = useState<Length['unit']>('paragraphs');
  // Each unit keeps its own count, so switching to words doesn't ask for 3 words.
  const [counts, setCounts] = useState<Record<Length['unit'], number>>({ paragraphs: 3, words: 200 });
  const [seed, setSeed] = useState(randomSeed);
  const language = useLanguage('english');

  const length: Length = { unit, count: counts[unit] };
  const text = useMemo(
    () => (language.status === 'ready' ? generate(language.loaded, { arrangement, length: { unit, count: counts[unit] }, seed }) : null),
    [language, arrangement, unit, counts, seed],
  );

  return (
    <div className="app">
      <aside className="panel">
        <header className="brand">
          <h1>Dummy Text Generator</h1>
          <p>Lorem ipsum for tabletop games</p>
        </header>

        {language.status === 'ready' && (
          <p className="source">
            From <cite>{language.loaded.source.title}</cite> by {language.loaded.source.author} ({language.loaded.source.date}), in the
            public domain.
          </p>
        )}

        <Controls
          arrangement={arrangement}
          onArrangement={setArrangement}
          length={length}
          onUnit={setUnit}
          onCount={(count) => setCounts((current) => ({ ...current, [unit]: count }))}
          onReroll={() => setSeed(randomSeed())}
        />

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
        {text && <Output paragraphs={text} />}
      </main>

      <About className="about below-text" />
    </div>
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
