import { useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedLanguage } from '../data/languages';
import { DEFAULT_CHOICE, findChoice, SETTINGS, type Setting } from '../data/settings';
import type { Arrangement, Length } from '../engine/arrange';
import { generate } from '../engine/generate';
import { isSpoken } from '../engine/language';
import { randomSeed } from '../engine/rng';
import { Controls } from './Controls';
import { encodeSetting, isCustomSetting, loadCustomSettings, saveCustomSettings, settingFromLink, uniqueId } from './customSettings';
import { Output } from './Output';
import { SettingsEditor } from './SettingsEditor';
import { useLanguage } from './useLanguage';
import { readHash, worldInHash, writeHash, type PageState, type View } from './urlState';

/** What a link asks for, and the custom setting it brings if that isn't among `own` already. */
function fromHash(hash: string, own: readonly Setting[]): { linked: Setting | null; state: Partial<PageState> } {
  const link = settingFromLink(worldInHash(hash), own);
  const settings = [...SETTINGS, ...own, ...(link.setting ? [link.setting] : [])];
  const state = readHash(hash, (key) => !!findChoice(link.choice(key), settings));
  if (state.choice) state.choice = link.choice(state.choice);
  return { linked: link.setting, state };
}

interface Initial {
  custom: Setting[];
  shared: Setting | null;
  state: PageState;
}

function initialState(): Initial {
  const custom = loadCustomSettings();
  const { linked, state } = fromHash(window.location.hash, custom);
  return {
    custom,
    shared: linked,
    state: {
      choice: DEFAULT_CHOICE,
      arrangement: 'sentences',
      length: { unit: 'paragraphs', count: 3 },
      seed: randomSeed(),
      view: 'written',
      ...state,
    },
  };
}

export default function App() {
  const [initial] = useState(initialState);
  const [custom, setCustom] = useState<Setting[]>(initial.custom);
  // A setting that came with a link, until it's saved or the page closes.
  const [shared, setShared] = useState<Setting | null>(initial.shared);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const [choiceKey, setChoiceKey] = useState(initial.state.choice);
  const [arrangement, setArrangement] = useState<Arrangement>(initial.state.arrangement);
  const [unit, setUnit] = useState<Length['unit']>(initial.state.length.unit);
  // Each unit keeps its own count, so switching to words doesn't ask for 3 words.
  const [counts, setCounts] = useState<Record<Length['unit'], number>>(() => ({
    paragraphs: 3,
    words: 200,
    [initial.state.length.unit]: initial.state.length.count,
  }));
  const [seed, setSeed] = useState(initial.state.seed);
  const [view, setView] = useState<View>(initial.state.view);

  const settings = useMemo(() => [...SETTINGS, ...custom, ...(shared ? [shared] : [])], [custom, shared]);
  const found = findChoice(choiceKey, settings) ?? findChoice(DEFAULT_CHOICE)!;
  const language = useLanguage(found.choice.language);
  const length: Length = { unit, count: counts[unit] };

  const text = useMemo(
    () => (language.status === 'ready' ? generate(language.loaded, { arrangement, length: { unit, count: counts[unit] }, seed }) : null),
    [language, arrangement, unit, counts, seed],
  );

  useEffect(() => saveCustomSettings(custom), [custom]);

  // The URL always describes the page, custom setting included, so it can be bookmarked or shared.
  const world = isCustomSetting(found.setting) ? encodeSetting(found.setting) : undefined;
  const hash = writeHash({ choice: found.key, arrangement, length, seed, view, world });
  useEffect(() => {
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [hash]);

  // A link pasted into the address bar of an open page changes only the hash.
  useEffect(() => {
    const apply = () => {
      const { linked, state } = fromHash(window.location.hash, shared ? [...custom, shared] : custom);
      if (linked) {
        setShared(linked);
        setBannerHidden(false);
      }
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
  }, [custom, shared]);

  // A shared setting's id counts as taken too, so a new setting can't take it before it's saved.
  const takenIds = new Set(settings.map((setting) => setting.id));

  function saveShared() {
    if (!shared) return;
    const id = uniqueId(shared.id, new Set([...SETTINGS, ...custom].map((setting) => setting.id)));
    setCustom([...custom, { ...shared, id }]);
    if (found.setting === shared) setChoiceKey(`${id}/${found.choice.id}`);
    setShared(null);
  }

  function closeEditor() {
    setEditing(false);
    editButton.current?.focus();
  }

  return (
    <div className="app">
      <aside className="panel">
        <header className="brand">
          <h1>Dummy Text Generator</h1>
          <p>Lorem ipsum for tabletop games</p>
        </header>

        <Controls
          settings={settings}
          editButton={editButton}
          onEditSettings={() => setEditing(true)}
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
        {shared && !bannerHidden && !editing && (
          <div className="banner" role="region" aria-label="Shared setting">
            <p>
              This link brings a setting, <strong>{shared.name}</strong>, with its own names for languages.
            </p>
            <div className="banner-actions">
              <button type="button" onClick={saveShared}>
                Save it to your settings
              </button>
              <button type="button" className="quiet" onClick={() => setBannerHidden(true)}>
                Not now
              </button>
            </div>
          </div>
        )}
        {editing ? (
          <SettingsEditor settings={custom} takenIds={takenIds} onChange={setCustom} onClose={closeEditor} />
        ) : (
          <>
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
          </>
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
