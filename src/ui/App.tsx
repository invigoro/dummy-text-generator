import { useEffect, useMemo, useRef, useState } from 'react';
import { LANGUAGES, type LoadedLanguage } from '../data/languages';
import { DEFAULT_CHOICE, findChoice, SETTINGS, type Setting } from '../data/settings';
import type { Arrangement, Length } from '../engine/arrange';
import { SPEAKERS, type Form } from '../engine/forms';
import { generate } from '../engine/generate';
import { isSpoken, type LanguageDef } from '../engine/language';
import { randomSeed } from '../engine/rng';
import { Controls } from './Controls';
import {
  decodeLanguages,
  encodeLanguages,
  isCustomLanguage,
  languagesSetting,
  loadCustomLanguages,
  saveCustomLanguages,
  withLinked,
  YOUR_LANGUAGES,
  type CustomLanguageDef,
} from './customLanguages';
import { encodeSetting, isCustomSetting, loadCustomSettings, saveCustomSettings, settingFromLink, uniqueId } from './customSettings';
import { LanguageBuilder } from './LanguageBuilder';
import { Output } from './Output';
import { SettingsEditor } from './SettingsEditor';
import { useLanguage } from './useLanguage';
import { madeInHash, readHash, worldInHash, writeHash, type PageState, type View } from './urlState';

/** Your languages, with a link's in place of yours where they differ. */
function merged(own: readonly CustomLanguageDef[], shared: readonly CustomLanguageDef[]): CustomLanguageDef[] {
  return [...own.filter((mine) => !shared.some((def) => def.id === mine.id)), ...shared];
}

/** Every setting there is to choose from: built in, your languages, your settings and a link's. */
function allSettings(made: readonly CustomLanguageDef[], custom: readonly Setting[], shared: Setting | null): Setting[] {
  return [...SETTINGS, ...(made.length > 0 ? [languagesSetting(made)] : []), ...custom, ...(shared ? [shared] : [])];
}

interface FromHash {
  /** A custom setting the link brings that isn't among yours. */
  linked: Setting | null;
  /** Made languages the link brings that you don't have as they are. */
  linkedLanguages: CustomLanguageDef[];
  state: Partial<PageState>;
}

/** What a link asks for, and the custom setting and languages it brings. */
function fromHash(hash: string, own: readonly Setting[], ownLanguages: readonly CustomLanguageDef[]): FromHash {
  const made = madeInHash(hash);
  const { shared: linkedLanguages } = withLinked(ownLanguages, made ? decodeLanguages(made) : []);
  const link = settingFromLink(worldInHash(hash), own);
  const settings = allSettings(merged(ownLanguages, linkedLanguages), own, link.setting);
  const state = readHash(hash, (key) => !!findChoice(link.choice(key), settings));
  if (state.choice) state.choice = link.choice(state.choice);
  return { linked: link.setting, linkedLanguages, state };
}

interface Initial {
  custom: Setting[];
  languages: CustomLanguageDef[];
  shared: Setting | null;
  sharedLanguages: CustomLanguageDef[];
  state: PageState;
}

type Counts = Record<Form, Record<Length['unit'], number>>;

/** Each form and unit keeps its own count, so switching to words doesn't ask for 3 words, or a conversation for 3 lines. */
const DEFAULT_COUNTS: Counts = {
  prose: { paragraphs: 3, words: 200 },
  conversation: { paragraphs: 8, words: 120 },
  inscription: { paragraphs: 4, words: 20 },
};

function withCount(counts: Counts, form: Form, length: Length): Counts {
  return { ...counts, [form]: { ...counts[form], [length.unit]: length.count } };
}

function initialState(): Initial {
  const custom = loadCustomSettings();
  const languages = loadCustomLanguages();
  const { linked, linkedLanguages, state } = fromHash(window.location.hash, custom, languages);
  const form = state.form ?? 'prose';
  return {
    custom,
    languages,
    shared: linked,
    sharedLanguages: linkedLanguages,
    state: {
      choice: DEFAULT_CHOICE,
      arrangement: 'sentences',
      length: { unit: 'paragraphs', count: DEFAULT_COUNTS[form].paragraphs },
      seed: randomSeed(),
      view: 'written',
      form,
      speakers: SPEAKERS.min,
      ...state,
    },
  };
}

/** What the main area shows: the text, or one of the editors in its place. */
type Panel = 'text' | 'settings' | 'languages';

export default function App() {
  const [initial] = useState(initialState);
  const [custom, setCustom] = useState<Setting[]>(initial.custom);
  const [languages, setLanguages] = useState<CustomLanguageDef[]>(initial.languages);
  // A setting and languages that came with a link, until they're saved or the page closes.
  const [shared, setShared] = useState<Setting | null>(initial.shared);
  const [sharedLanguages, setSharedLanguages] = useState<CustomLanguageDef[]>(initial.sharedLanguages);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [panel, setPanel] = useState<Panel>('text');
  const editButton = useRef<HTMLButtonElement>(null);
  const buildButton = useRef<HTMLButtonElement>(null);
  const [choiceKey, setChoiceKey] = useState(initial.state.choice);
  const [arrangement, setArrangement] = useState<Arrangement>(initial.state.arrangement);
  const [unit, setUnit] = useState<Length['unit']>(initial.state.length.unit);
  const [form, setForm] = useState<Form>(initial.state.form);
  const [counts, setCounts] = useState<Counts>(() => withCount(DEFAULT_COUNTS, initial.state.form, initial.state.length));
  const [speakers, setSpeakers] = useState(initial.state.speakers);
  const [seed, setSeed] = useState(initial.state.seed);
  const [view, setView] = useState<View>(initial.state.view);

  const made = useMemo(() => merged(languages, sharedLanguages), [languages, sharedLanguages]);
  const known = useMemo(() => new Map<string, LanguageDef>([...LANGUAGES, ...made].map((def) => [def.id, def])), [made]);
  // A choice whose language isn't here (deleted, or never sent) is left out until it is.
  const settings = useMemo(
    () =>
      allSettings(made, custom, shared).map((setting) => ({
        ...setting,
        choices: setting.choices.filter((choice) => known.has(choice.language)),
      })),
    [made, custom, shared, known],
  );
  const found = findChoice(choiceKey, settings) ?? findChoice(DEFAULT_CHOICE)!;
  const language = useLanguage(known.get(found.choice.language)!);
  const count = counts[form][unit];

  const text = useMemo(
    () =>
      language.status === 'ready'
        ? generate(language.loaded, { arrangement, length: { unit, count }, seed, form, speakers })
        : null,
    [language, arrangement, unit, count, seed, form, speakers],
  );

  useEffect(() => saveCustomSettings(custom), [custom]);
  useEffect(() => saveCustomLanguages(languages), [languages]);

  // The URL always describes the page, custom setting and made languages included, so it can be
  // bookmarked or shared, and works for anyone.
  const setting = [...custom, ...(shared ? [shared] : [])].find((own) => own.id === found.setting.id);
  const world = setting && isCustomSetting(setting) ? encodeSetting(setting) : undefined;
  const needed = new Set([found.choice.language, ...(setting?.choices.map((choice) => choice.language) ?? [])]);
  const madeNeeded = made.filter((def) => needed.has(def.id));
  const length: Length = { unit, count };
  const hash = writeHash({
    choice: found.key,
    arrangement,
    length,
    seed,
    view,
    form,
    speakers,
    world,
    made: madeNeeded.length > 0 ? encodeLanguages(madeNeeded) : undefined,
  });
  useEffect(() => {
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [hash]);

  // A link pasted into the address bar of an open page changes only the hash.
  useEffect(() => {
    const apply = () => {
      const { linked, linkedLanguages, state } = fromHash(window.location.hash, shared ? [...custom, shared] : custom, made);
      if (linked) setShared(linked);
      if (linkedLanguages.length > 0) setSharedLanguages((current) => merged(current, linkedLanguages));
      if (linked || linkedLanguages.length > 0) setBannerHidden(false);
      // A link leaves out the form for prose.
      const newForm = state.form ?? 'prose';
      setForm(newForm);
      if (state.choice) setChoiceKey(state.choice);
      if (state.arrangement) setArrangement(state.arrangement);
      if (state.length) {
        const newLength = state.length;
        setUnit(newLength.unit);
        setCounts((current) => withCount(current, newForm, newLength));
      }
      if (state.speakers) setSpeakers(state.speakers);
      if (state.seed !== undefined) setSeed(state.seed);
      if (state.view) setView(state.view);
    };
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [custom, shared, made]);

  // A shared setting's id counts as taken too, so a new setting can't take it before it's saved.
  const takenIds = new Set(settings.map((own) => own.id));

  function saveShared() {
    if (sharedLanguages.length > 0) {
      setLanguages(merged(languages, sharedLanguages));
      setSharedLanguages([]);
    }
    if (shared) {
      const id = uniqueId(shared.id, new Set([...SETTINGS, ...custom].map((own) => own.id)));
      setCustom([...custom, { ...shared, id }]);
      if (found.setting.id === shared.id) setChoiceKey(`${id}/${found.choice.id}`);
      setShared(null);
    }
  }

  function closePanel() {
    const returnTo = panel === 'settings' ? editButton : buildButton;
    setPanel('text');
    returnTo.current?.focus();
  }

  /** Writes in a made language: it's chosen, and the builder closes. */
  function chooseMade(id: string) {
    setChoiceKey(`${YOUR_LANGUAGES}/${id}`);
    closePanel();
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
          languages={known}
          editButton={editButton}
          onEditSettings={() => setPanel('settings')}
          buildButton={buildButton}
          onBuild={() => setPanel('languages')}
          choice={found.key}
          onChoice={setChoiceKey}
          spoken={language.status === 'ready' && isSpoken(language.loaded.language)}
          view={view}
          onView={setView}
          form={form}
          onForm={setForm}
          speakers={speakers}
          onSpeakers={setSpeakers}
          arrangement={arrangement}
          onArrangement={setArrangement}
          length={length}
          onUnit={setUnit}
          onCount={(newCount) => setCounts((current) => withCount(current, form, { unit, count: newCount }))}
          seed={seed}
          onReroll={() => setSeed(randomSeed())}
        />

        {language.status === 'ready' && <Credit loaded={language.loaded} />}
        <About className="about beside-text" />
      </aside>

      <main className="stage">
        {(shared || sharedLanguages.length > 0) && !bannerHidden && panel === 'text' && (
          <SharedBanner setting={shared} languages={sharedLanguages} yours={languages} onSave={saveShared} onHide={() => setBannerHidden(true)} />
        )}
        {panel === 'settings' && (
          <SettingsEditor settings={custom} languages={[...known.values()]} takenIds={takenIds} onChange={setCustom} onClose={closePanel} />
        )}
        {panel === 'languages' && <LanguageBuilder languages={languages} onChange={setLanguages} onUse={chooseMade} onClose={closePanel} />}
        {panel === 'text' && (
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
              <Output paragraphs={text} language={language.loaded.language} view={view} form={form} stele={found.choice.stele} />
            )}
          </>
        )}
      </main>

      <About className="about below-text" />
    </div>
  );
}

/** A list of names: "Grukk", "Grukk and Zeth", "Grukk, Zeth and Ool". */
function listed(names: readonly string[]) {
  return names.map((name, i) => (
    <span key={name}>
      {i > 0 && (i === names.length - 1 ? ' and ' : ', ')}
      <strong>{name}</strong>
    </span>
  ));
}

interface SharedBannerProps {
  setting: Setting | null;
  languages: readonly CustomLanguageDef[];
  /** Your own languages, to tell a new language from a different version of one of yours. */
  yours: readonly CustomLanguageDef[];
  onSave: () => void;
  onHide: () => void;
}

/** What a link brings that isn't saved here, and a way to save it. */
function SharedBanner({ setting, languages, yours, onSave, onHide }: SharedBannerProps) {
  const changed = languages.some((def) => yours.some((mine) => mine.id === def.id));
  const names = languages.map((def) => def.name);
  const kind = languages.length === 1 ? 'a language' : 'languages';
  return (
    <div className="banner" role="region" aria-label="Shared setting">
      <p>
        {setting && (
          <>
            This link brings a setting, <strong>{setting.name}</strong>, with its own names for languages
            {languages.length > 0 ? <>, and {kind} made in the builder: {listed(names)}.</> : '.'}
          </>
        )}
        {!setting && (
          <>
            This link brings {kind} made in the builder: {listed(names)}.
          </>
        )}
        {changed && ' It’s a different version of one of yours.'}
      </p>
      <div className="banner-actions">
        <button type="button" onClick={onSave}>
          {setting && languages.length === 0 ? 'Save it to your settings' : changed ? 'Save it over yours' : 'Save it here'}
        </button>
        <button type="button" className="quiet" onClick={onHide}>
          Not now
        </button>
      </div>
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
      {language.kind === 'invented' && (
        <>
          {isCustomLanguage(language.id) ? 'Words invented in the builder' : 'Invented words'}, with the flow of {work}, in the public domain.
        </>
      )}
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
