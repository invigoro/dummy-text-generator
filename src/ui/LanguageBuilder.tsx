import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadCorpus, sourceText } from '../data/corpora';
import { LANGUAGES } from '../data/languages';
import type { InventedLanguageDef } from '../engine/language';
import { PHONEMES } from '../engine/sounds/phonemes';
import type { SoundsDef, StressRule } from '../engine/sounds/system';
import type { SpellingRule } from '../engine/spelling';
import type { Corpus } from '../engine/tokenize';
import { hasProblems, preview, problems } from './builderPreview';
import {
  FLOWS,
  isSafePattern,
  newLanguage,
  QUOTE_STYLES,
  sameLanguage,
  sanitizeLanguage,
  STRESS_RULES,
  type CustomLanguageDef,
} from './customLanguages';
import { slug, uniqueId } from './customSettings';
import { Listen } from './Listen';

interface LanguageBuilderProps {
  /** Your languages, which this edits. */
  languages: readonly CustomLanguageDef[];
  onChange: (languages: CustomLanguageDef[]) => void;
  /** Writes in a language, closing the builder. */
  onUse: (id: string) => void;
  onClose: () => void;
}

const BUILT_IN = LANGUAGES.filter((def): def is InventedLanguageDef => def.kind === 'invented');

const STRESS_NAMES: Record<StressRule, string> = {
  initial: 'the first syllable (Finnish, Old Norse)',
  penultimate: 'the second to last (Welsh)',
  final: 'the last (Infernal)',
  phrase: 'the end of each phrase (French)',
  latin: 'the Latin rule: the second to last if it’s long, or the one before',
  spanish: 'the Spanish rule: the second to last after a vowel, n or s, or else the last',
  portuguese: 'the Portuguese rule: the last if it’s nasal or ends in r or l, or else the one before',
};

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

/** Build languages of your own: new ones from scratch or from a built-in language. */
export function LanguageBuilder({ languages, onChange, onUse, onClose }: LanguageBuilderProps) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(languages[0]?.id ?? null);
  const [base, setBase] = useState('');
  const [message, setMessage] = useState('');
  // The last language deleted, and where it was, so it can be put back.
  const [deleted, setDeleted] = useState<{ language: CustomLanguageDef; index: number } | null>(null);

  useEffect(() => heading.current?.focus(), []);

  const taken = new Set(languages.map((language) => language.id));
  const current = languages.find((language) => language.id === selected) ?? null;

  function create() {
    const from = BUILT_IN.find((def) => def.id === base) ?? languages.find((def) => def.id === base) ?? null;
    const language = newLanguage(from, taken);
    onChange([...languages, language]);
    setSelected(language.id);
    setDeleted(null);
    setMessage(`Made “${language.name}”.`);
  }

  function save(language: CustomLanguageDef) {
    onChange(languages.map((own) => (own.id === language.id ? language : own)));
  }

  function remove(language: CustomLanguageDef) {
    const index = languages.indexOf(language);
    onChange(languages.filter((own) => own !== language));
    setDeleted({ language, index });
    setSelected(languages[index + 1]?.id ?? languages[index - 1]?.id ?? null);
    setMessage(`Deleted “${language.name}”.`);
  }

  function undoDelete() {
    if (!deleted) return;
    const { language, index } = deleted;
    onChange([...languages.slice(0, index), language, ...languages.slice(index)]);
    setSelected(language.id);
    setDeleted(null);
    setMessage(`Restored “${language.name}”.`);
  }

  function exportLanguage(language: CustomLanguageDef) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(language, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(language.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(chosen: File | undefined) {
    if (!chosen) return;
    try {
      const language = sanitizeLanguage(JSON.parse(await chosen.text()));
      if (!language) throw new Error('not a language');
      const same = languages.find((own) => own.id === language.id);
      if (same && sameLanguage(same, language)) {
        setSelected(same.id);
        setMessage(`You have “${language.name}” already.`);
      } else {
        // A different language under an id you use gets one of its own.
        const added = same ? { ...language, id: uniqueId(language.id, taken) } : language;
        onChange([...languages, added]);
        setSelected(added.id);
        setDeleted(null);
        setMessage(`Added “${added.name}”.`);
      }
    } catch {
      setMessage('That file isn’t a language exported from here.');
    }
    if (file.current) file.current.value = '';
  }

  return (
    <section className="settings-editor builder" aria-labelledby={`${id}-title`}>
      <div className="editor-bar">
        <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>
          Your languages
        </h2>
        <button type="button" onClick={onClose}>
          Done
        </button>
      </div>
      <p className="hint">
        Build a language of your own, for a people of your world: its sounds, how they make words, where the stress falls, how
        it’s spelled, and whose rhythm it borrows. Start from nothing, or from a language here (“Orcish, but hissing”). Your
        languages are kept in this browser, and a share link carries the one it uses.
      </p>

      <div className="setting-actions">
        <label>
          <span className="visually-hidden">Start from</span>
          <select value={base} onChange={(event) => setBase(event.target.value)}>
            <option value="">Nothing: a plain language</option>
            <optgroup label="A built-in language">
              {BUILT_IN.map((def) => (
                <option key={def.id} value={def.id}>
                  {def.name}
                </option>
              ))}
            </optgroup>
            {languages.length > 0 && (
              <optgroup label="One of yours">
                {languages.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <button type="button" onClick={create}>
          + New language
        </button>
        <label className="button">
          Import…
          <input ref={file} type="file" accept="application/json,.json" className="visually-hidden" onChange={(event) => importFile(event.target.files?.[0])} />
        </label>
        <span role="status" className="status">
          {message}
        </span>
        {deleted && (
          <button type="button" className="link" onClick={undoDelete}>
            Undo
          </button>
        )}
      </div>

      {languages.length > 0 && (
        <div className="choose-language" role="group" aria-label="Language to edit">
          {languages.map((language) => (
            <button key={language.id} type="button" aria-pressed={language.id === current?.id} onClick={() => setSelected(language.id)}>
              {language.name}
            </button>
          ))}
        </div>
      )}

      {current && (
        <LanguageEditor
          key={current.id}
          saved={current}
          onSave={save}
          onUse={() => onUse(current.id)}
          onExport={() => exportLanguage(current)}
          onDelete={() => remove(current)}
        />
      )}
    </section>
  );
}

/** A flow text's loaded words, or null while it loads. */
function useCorpus(flow: string): Corpus | null {
  const [corpus, setCorpus] = useState<{ flow: string; corpus: Corpus } | null>(null);
  useEffect(() => {
    let current = true;
    loadCorpus(flow).then(
      (loaded) => current && setCorpus({ flow, corpus: loaded }),
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [flow]);
  return corpus?.flow === flow ? corpus.corpus : null;
}

interface LanguageEditorProps {
  saved: CustomLanguageDef;
  onSave: (language: CustomLanguageDef) => void;
  onUse: () => void;
  onExport: () => void;
  onDelete: () => void;
}

/**
 * One language's parts, each edited in place. The language is saved whenever it works; while it
 * doesn't, what's wrong shows beside the part at fault, and the last working version is kept.
 */
function LanguageEditor({ saved, onSave, onUse, onExport, onDelete }: LanguageEditorProps) {
  const id = useId();
  const [draft, setDraft] = useState<CustomLanguageDef>(saved);
  const [seed, setSeed] = useState(1);
  // The class the sound palette adds to: the one last typed in.
  const [active, setActive] = useState<string>(Object.keys(saved.sounds.classes)[0] ?? 'C');
  const found = useMemo(() => problems(draft), [draft]);
  const broken = hasProblems(found);

  // Samples lag behind typing when they need to, so typing never waits for them.
  const shown = useDeferredValue(draft);
  const flow = useCorpus(shown.flow);
  const samples = useMemo(() => preview(shown, flow, seed), [shown, flow, seed]);

  function update(next: CustomLanguageDef) {
    setDraft(next);
    if (hasProblems(problems(next))) return;
    const clean = sanitizeLanguage(next);
    if (clean) onSave(clean);
  }

  const sounds = (change: Partial<SoundsDef>) => update({ ...draft, sounds: { ...draft.sounds, ...change } });
  const avoidLeftOut = (draft.sounds.avoid ?? []).filter((pattern) => !isSafePattern(pattern));

  return (
    <div className="builder-grid">
      <div className="builder-form">
        <p className={broken ? 'builder-state problem' : 'builder-state'} role="status">
          {broken ? `Not saved yet: ${found.sounds ?? found.spelling ?? found.other}` : 'Saved. Every change is kept as you go.'}
        </p>

        <Part title="Name and rhythm">
          <div className="field">
            <label className="label" htmlFor={`${id}-name`}>
              Name
            </label>
            <input id={`${id}-name`} value={draft.name} maxLength={40} onChange={(event) => update({ ...draft, name: event.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-flow`}>
              Rhythm from
            </label>
            <select id={`${id}-flow`} aria-describedby={`${id}-flow-hint`} value={draft.flow} onChange={(event) => update({ ...draft, flow: event.target.value })}>
              {FLOWS.map((text) => (
                <option key={text.id} value={text.id}>
                  {text.title} ({languageNames.of(text.language)})
                </option>
              ))}
            </select>
            <small className="hint" id={`${id}-flow-hint`}>
              The text whose sentences, punctuation and repeated words the language borrows.
            </small>
          </div>
        </Part>

        <Part title="Sounds" problem={found.sounds}>
          <p className="hint">
            Each class is a list of sounds in IPA, with how often each comes up: <code>p:3 t:5 k</code>. Join sounds with + to use them
            as one: <code>s+t</code>. Vowels and consonants go in classes of their own.
          </p>
          <SoundClasses classes={draft.sounds.classes} onChange={(classes) => sounds({ classes })} onFocusClass={setActive} />
          <SoundPalette
            onPick={(symbol) => {
              const list = draft.sounds.classes[active] ?? '';
              sounds({ classes: { ...draft.sounds.classes, [active]: `${list.trim()} ${symbol}`.trim() } });
            }}
            target={active}
          />
        </Part>

        <Part title="Syllables" problem={found.sounds}>
          <p className="hint">
            Shapes of syllables, one class letter per sound, with how often each comes up: <code>CV:5 CVF:2 V</code>. Each shape needs
            exactly one vowel class. The first, last and single-syllable shapes are optional, and take the place of the others there.
          </p>
          {(
            [
              ['syllables', 'Syllables'],
              ['first', 'A word’s first syllable'],
              ['last', 'A word’s last syllable'],
              ['single', 'A word of one syllable'],
            ] as const
          ).map(([key, name]) => (
            <div className="field" key={key}>
              <label className="label" htmlFor={`${id}-${key}`}>
                {name}
              </label>
              <input
                id={`${id}-${key}`}
                className="code"
                value={draft.sounds[key] ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  if (key === 'syllables') sounds({ syllables: value });
                  else sounds({ [key]: value.trim() ? value : undefined });
                }}
              />
            </div>
          ))}
        </Part>

        <Part title="Stress">
          <div className="field">
            <label className="label" htmlFor={`${id}-stress`}>
              Stress falls on
            </label>
            <select id={`${id}-stress`} value={draft.sounds.stress} onChange={(event) => sounds({ stress: event.target.value as StressRule })}>
              {STRESS_RULES.map((rule) => (
                <option key={rule} value={rule}>
                  {STRESS_NAMES[rule]}
                </option>
              ))}
            </select>
          </div>
        </Part>

        <Part title="Spelling" problem={found.spelling}>
          <p className="hint">
            How sounds are written, in order: the first rule that fits wins, and a sound no rule covers is written as itself. Write several
            spellings with how often each comes up (<code>c:3 k:1</code>), or ∅ for nothing. A rule can hold for what comes before or
            after: a sound, V (a vowel), C (a consonant), front or back (vowels), labial, or # (the edge of the word).
          </p>
          <SpellingRules rules={draft.spelling} onChange={(spelling) => update({ ...draft, spelling })} />
        </Part>

        <Part title="Punctuation">
          <div className="field">
            <label className="label" htmlFor={`${id}-quotes`}>
              Quotation marks
            </label>
            <select
              id={`${id}-quotes`}
              value={QUOTE_STYLES.findIndex(({ quotes }) => quotes[0] === draft.punctuation.quotes[0] && quotes[1] === draft.punctuation.quotes[1])}
              onChange={(event) => {
                const [open, close] = QUOTE_STYLES[Number(event.target.value)].quotes;
                update({ ...draft, punctuation: { ...draft.punctuation, quotes: [open, close] } });
              }}
            >
              {QUOTE_STYLES.map(({ quotes, name }, i) => (
                <option key={name} value={i}>
                  {quotes[0]}speech{quotes[1]} ({name})
                </option>
              ))}
            </select>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={!!draft.punctuation.spaceBefore}
              onChange={(event) => {
                const { quotes } = draft.punctuation;
                update({ ...draft, punctuation: event.target.checked ? { quotes, spaceBefore: '!?:;' } : { quotes } });
              }}
            />
            A space before ! ? : and ;, as in French
          </label>
        </Part>

        <Part title="How to say it">
          <div className="field">
            <label className="label" htmlFor={`${id}-voicing`}>
              A tip for reading it aloud
            </label>
            <textarea
              id={`${id}-voicing`}
              rows={3}
              maxLength={600}
              value={draft.voicing}
              placeholder="Growl it from the back of the throat, and bark the first syllable."
              onChange={(event) => update({ ...draft, voicing: event.target.value })}
            />
          </div>
        </Part>

        <details className="part">
          <summary>More</summary>
          <div className="field">
            <label className="label" htmlFor={`${id}-max`}>
              Most syllables in a word
            </label>
            <input
              id={`${id}-max`}
              type="number"
              min={1}
              max={8}
              value={draft.sounds.maxSyllables ?? 5}
              onChange={(event) => sounds({ maxSyllables: Math.min(8, Math.max(1, Math.round(Number(event.target.value)) || 5)) })}
            />
          </div>
          <label className="check">
            <input type="checkbox" checked={!!draft.sounds.hiatus} onChange={(event) => sounds({ hiatus: event.target.checked || undefined })} />
            Vowels may meet across syllables (“de-us”)
          </label>
          <div className="field">
            <label className="label" htmlFor={`${id}-avoid`}>
              Sounds to avoid
            </label>
            <textarea
              id={`${id}-avoid`}
              className="code"
              rows={3}
              aria-describedby={`${id}-avoid-hint`}
              value={(draft.sounds.avoid ?? []).join('\n')}
              onChange={(event) => {
                const avoid = event.target.value.split('\n');
                sounds({ avoid: avoid.some((pattern) => pattern.trim()) ? avoid : undefined });
              }}
            />
            <small className="hint" id={`${id}-avoid-hint`}>
              One pattern a line, as a regular expression over a word’s sounds, with a dot between syllables: <code>ʁ\.ʁ</code> keeps two
              of them from meeting.
              {avoidLeftOut.length > 0 && <> Left out, as they could take too long to check: {avoidLeftOut.join(', ')}.</>}
            </small>
          </div>
        </details>

        <div className="setting-actions">
          <button type="button" onClick={onUse}>
            Write in {saved.name}
          </button>
          <button type="button" onClick={onExport}>
            Export
          </button>
          <button type="button" className="danger" onClick={onDelete}>
            Delete language
          </button>
        </div>
      </div>

      <aside className="builder-preview" aria-label={`Samples of ${saved.name}`}>
        <div className="editor-bar">
          <h3>Samples</h3>
          <div className="sample-actions">
            {samples?.passage && <Listen languageId={saved.id} written={samples.passage.written} said={samples.passage.say} />}
            <button type="button" onClick={() => setSeed(seed + 1)}>
              Others
            </button>
          </div>
        </div>
        {samples ? (
          <>
            <ul className="sample-words">
              {samples.words.map((word, i) => (
                <li key={i}>
                  <span>{word.written}</span> <span className="muted">{word.say}</span>
                </li>
              ))}
            </ul>
            {samples.passage ? (
              <>
                <p className="sample-passage">{samples.passage.written}</p>
                <p className="sample-passage muted">{samples.passage.say}</p>
              </>
            ) : (
              <p className="muted">Loading {sourceText(shown.flow).title}…</p>
            )}
          </>
        ) : (
          <p className="muted">Samples come back once the language works again.</p>
        )}
      </aside>
    </div>
  );
}

function Part({ title, problem, children }: { title: string; problem?: string; children: ReactNode }) {
  return (
    <fieldset className="part">
      <legend>{title}</legend>
      {children}
      {problem && <p className="problem">{problem}</p>}
    </fieldset>
  );
}

/** Class letters in a sensible order to hand out: consonants, vowels, finals, then the rest. */
const LETTERS = 'CVFAEGHIJKLMNOPRSTUWXYZBDQ';

function SoundClasses({
  classes,
  onChange,
  onFocusClass,
}: {
  classes: Readonly<Record<string, string>>;
  onChange: (classes: Record<string, string>) => void;
  onFocusClass: (name: string) => void;
}) {
  const entries = Object.entries(classes);
  const rename = (from: string, to: string) => {
    if (!/^\p{Lu}$/u.test(to) || (to !== from && to in classes)) return;
    onChange(Object.fromEntries(entries.map(([name, list]) => [name === from ? to : name, list])));
    onFocusClass(to);
  };
  const free = [...LETTERS].find((letter) => !(letter in classes));
  return (
    <>
      <ul className="classes">
        {entries.map(([name, list], i) => (
          <li key={i}>
            <input
              className="class-name"
              aria-label="Class letter"
              value={name}
              // The letter last typed takes over, so there's no need to delete the old one first.
              onChange={(event) => rename(name, event.target.value.slice(-1).toUpperCase())}
            />
            <textarea
              className="code"
              aria-label={`Sounds in class ${name}`}
              // Long enough to show the whole list, up to four lines.
              rows={Math.min(4, Math.max(1, Math.ceil(list.length / 50)))}
              value={list}
              onFocus={() => onFocusClass(name)}
              onChange={(event) => onChange({ ...classes, [name]: event.target.value })}
            />
            <button
              type="button"
              aria-label={`Remove class ${name}`}
              title="Remove"
              onClick={() => onChange(Object.fromEntries(entries.filter(([other]) => other !== name)))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {free && (
        <button
          type="button"
          onClick={() => {
            onChange({ ...classes, [free]: '' });
            onFocusClass(free);
          }}
        >
          + Add a class
        </button>
      )}
    </>
  );
}

/** Every sound there is, grouped, to add to a class with a click. */
const PALETTE = (() => {
  const sounds = Object.entries(PHONEMES).filter(([, sound]) => !sound.geminate);
  return {
    vowels: sounds.filter(([, sound]) => sound.type === 'vowel'),
    consonants: sounds.filter(([, sound]) => sound.type === 'consonant'),
  };
})();

function SoundPalette({ onPick, target }: { onPick: (symbol: string) => void; target: string }) {
  return (
    <details className="palette">
      <summary>Sounds to choose from</summary>
      <p className="hint">Click a sound to add it to class {target}. Each shows how the “say it” line spells it.</p>
      {(['vowels', 'consonants'] as const).map((group) => (
        <div key={group} className="palette-group" role="group" aria-label={group === 'vowels' ? 'Vowels' : 'Consonants'}>
          {PALETTE[group].map(([symbol, sound]) => (
            <button key={symbol} type="button" title={`Said “${sound.say}”`} onClick={() => onPick(symbol)}>
              <span className="symbol">{symbol.normalize('NFC')}</span> <span className="muted">{sound.say}</span>
            </button>
          ))}
        </div>
      ))}
    </details>
  );
}

function SpellingRules({ rules, onChange }: { rules: readonly SpellingRule[]; onChange: (rules: SpellingRule[]) => void }) {
  const set = (index: number, change: Partial<SpellingRule>) =>
    onChange(
      rules.map((rule, i) => {
        if (i !== index) return rule;
        const next: SpellingRule = { ...rule, ...change };
        // An empty context or syllable is no condition at all.
        for (const key of ['before', 'after', 'syllable'] as const) if (!next[key]) delete next[key];
        return next;
      }),
    );
  const move = (index: number, by: number) => {
    const next = [...rules];
    const [rule] = next.splice(index, 1);
    next.splice(index + by, 0, rule);
    onChange(next);
  };
  return (
    <>
      {rules.length > 0 && (
        <div className="rules-scroll">
          <table className="rules">
            <thead>
              <tr>
                <th>Sounds</th>
                <th>Written</th>
                <th>After</th>
                <th>Before</th>
                <th>Syllable</th>
                <th>
                  <span className="visually-hidden">Order and removal</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={i}>
                  <td>
                    <input className="code" aria-label={`Rule ${i + 1}: sounds`} value={rule.sounds} onChange={(event) => set(i, { sounds: event.target.value })} />
                  </td>
                  <td>
                    <input aria-label={`Rule ${i + 1}: written`} value={rule.write} onChange={(event) => set(i, { write: event.target.value })} />
                  </td>
                  <td>
                    <input className="code" aria-label={`Rule ${i + 1}: after`} value={rule.after ?? ''} onChange={(event) => set(i, { after: event.target.value })} />
                  </td>
                  <td>
                    <input className="code" aria-label={`Rule ${i + 1}: before`} value={rule.before ?? ''} onChange={(event) => set(i, { before: event.target.value })} />
                  </td>
                  <td>
                    <select
                      aria-label={`Rule ${i + 1}: syllable`}
                      value={rule.syllable ?? ''}
                      onChange={(event) => set(i, { syllable: (event.target.value || undefined) as SpellingRule['syllable'] })}
                    >
                      <option value="">any</option>
                      <option value="open">open</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td className="rule-actions">
                    <button type="button" aria-label={`Move rule ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </button>
                    <button type="button" aria-label={`Move rule ${i + 1} down`} disabled={i === rules.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </button>
                    <button type="button" aria-label={`Remove rule ${i + 1}`} onClick={() => onChange(rules.filter((_, j) => j !== i))}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => onChange([...rules, { sounds: '', write: '' }])}>
        + Add a rule
      </button>
    </>
  );
}
