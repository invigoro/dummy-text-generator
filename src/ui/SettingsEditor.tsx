import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { LANGUAGES } from '../data/languages';
import type { LanguageChoice, Setting } from '../data/settings';
import { defaultStele, sanitizeSetting, slug, uniqueId, UNNAMED_LANGUAGE, UNTITLED_SETTING } from './customSettings';

interface SettingsEditorProps {
  /** The custom settings, which this edits. */
  settings: readonly Setting[];
  /** Ids already in use, built-in ones included. */
  takenIds: ReadonlySet<string>;
  onChange: (settings: Setting[]) => void;
  onClose: () => void;
}

/** Real English is the source text itself; every other language is invented words. */
const LANGUAGE_OPTIONS = LANGUAGES.map((language) => ({
  id: language.id,
  label: language.kind === 'real' ? `${language.name} (the real text)` : language.name,
}));

function LanguageSelect({ value, onChange }: { value: string; onChange: (language: string) => void }) {
  return (
    <select aria-label="Written as" value={value} onChange={(event) => onChange(event.target.value)}>
      {LANGUAGE_OPTIONS.map((language) => (
        <option key={language.id} value={language.id}>
          {language.label}
        </option>
      ))}
    </select>
  );
}

/** Name the languages of your own game world. */
export function SettingsEditor({ settings, takenIds, onChange, onClose }: SettingsEditorProps) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [message, setMessage] = useState('');
  // The last setting deleted, and where it was, so it can be put back.
  const [deleted, setDeleted] = useState<{ setting: Setting; index: number } | null>(null);
  // A setting just made, whose name is ready to type over.
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => heading.current?.focus(), []);

  const update = (index: number, change: (setting: Setting) => Setting) =>
    onChange(settings.map((setting, i) => (i === index ? change(setting) : setting)));

  const updateChoice = (index: number, choiceIndex: number, change: Partial<LanguageChoice>) =>
    update(index, (setting) => ({
      ...setting,
      choices: setting.choices.map((choice, i) => {
        if (i !== choiceIndex) return choice;
        const changed = { ...choice, ...change };
        // A new language brings its own Stele style.
        return change.language ? { ...changed, stele: defaultStele(change.language) } : changed;
      }),
    }));

  function addSetting() {
    const name = 'My world';
    const base = slug(name);
    const setting: Setting = { id: uniqueId(base.startsWith('my-') ? base : `my-${base}`, takenIds), name, choices: [] };
    onChange([...settings, setting]);
    setCreated(setting.id);
    setDeleted(null);
    setMessage('');
  }

  function addChoice(index: number, name: string, language: string) {
    update(index, (setting) => {
      const choiceId = uniqueId(slug(name), new Set(setting.choices.map((choice) => choice.id)));
      return { ...setting, choices: [...setting.choices, { id: choiceId, name, language, stele: defaultStele(language) }] };
    });
  }

  function deleteSetting(index: number) {
    setDeleted({ setting: settings[index], index });
    setMessage(`Deleted “${settings[index].name}”.`);
    onChange(settings.filter((_, i) => i !== index));
  }

  function undoDelete() {
    if (!deleted) return;
    const { setting, index } = deleted;
    // Its id may have been taken since, by a setting added or imported after it went.
    const restored = { ...setting, id: uniqueId(setting.id, takenIds) };
    onChange([...settings.slice(0, index), restored, ...settings.slice(index)]);
    setDeleted(null);
    setMessage(`Restored “${setting.name}”.`);
  }

  function exportSetting(setting: Setting) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(setting, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(setting.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(chosen: File | undefined) {
    if (!chosen) return;
    try {
      const setting = sanitizeSetting(JSON.parse(await chosen.text()));
      if (!setting || setting.choices.length === 0) throw new Error('not a setting');
      onChange([...settings, { ...setting, id: uniqueId(setting.id, takenIds) }]);
      setDeleted(null);
      setMessage(`Added “${setting.name}”.`);
    } catch {
      setMessage('That file isn’t a setting exported from here.');
    }
    if (file.current) file.current.value = '';
  }

  return (
    <section className="settings-editor" aria-labelledby={`${id}-title`}>
      <div className="editor-bar">
        <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>
          Your settings
        </h2>
        <button type="button" onClick={onClose}>
          Done
        </button>
      </div>
      <p className="hint">
        Give the languages of your own game world their names: Renan for French, say. Settings are kept in this browser, and a share
        link carries its setting with it.
      </p>

      {settings.map((setting, index) => (
        <fieldset key={setting.id} className="setting">
          <legend className="visually-hidden">{setting.name}</legend>
          <input
            className="setting-name"
            aria-label="Setting name"
            value={setting.name}
            maxLength={40}
            // A new setting's name is selected, ready to type over.
            ref={(input) => {
              if (input && setting.id === created) {
                input.focus();
                input.select();
                setCreated(null);
              }
            }}
            onChange={(event) => update(index, (current) => ({ ...current, name: event.target.value }))}
            onBlur={(event) => !event.target.value.trim() && update(index, (current) => ({ ...current, name: UNTITLED_SETTING }))}
          />
          <div className="choice-grid">
            {setting.choices.length > 0 && (
              <ul className="choices" aria-label={`Languages of ${setting.name}`}>
                {setting.choices.map((choice, choiceIndex) => (
                  <li key={choice.id}>
                    <input
                      aria-label="Language name"
                      value={choice.name}
                      maxLength={40}
                      onChange={(event) => updateChoice(index, choiceIndex, { name: event.target.value })}
                      onBlur={(event) => !event.target.value.trim() && updateChoice(index, choiceIndex, { name: UNNAMED_LANGUAGE })}
                    />
                    <LanguageSelect value={choice.language} onChange={(language) => updateChoice(index, choiceIndex, { language })} />
                    <button
                      type="button"
                      aria-label={`Remove ${choice.name}`}
                      title="Remove"
                      onClick={() => update(index, (current) => ({ ...current, choices: current.choices.filter((_, i) => i !== choiceIndex) }))}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <AddLanguage onAdd={(name, language) => addChoice(index, name, language)} />
          </div>
          <div className="setting-actions">
            <button type="button" onClick={() => exportSetting(setting)} disabled={setting.choices.length === 0}>
              Export
            </button>
            <button type="button" className="danger" onClick={() => deleteSetting(index)}>
              Delete setting
            </button>
          </div>
        </fieldset>
      ))}

      <div className="setting-actions">
        <button type="button" onClick={addSetting}>
          + New setting
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
    </section>
  );
}

/** A name and a language to write it in, added together, so the language's id comes from its name. */
function AddLanguage({ onAdd }: { onAdd: (name: string, language: string) => void }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('french');
  const input = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.replace(/\s+/g, ' ').trim();
    if (trimmed) {
      onAdd(trimmed, language);
      setName('');
    }
    input.current?.focus();
  }

  return (
    <form className="add-language" onSubmit={submit}>
      <input
        ref={input}
        aria-label="New language’s name"
        placeholder="Add a language: Renan, say"
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
      />
      <LanguageSelect value={language} onChange={setLanguage} />
      <button type="submit">Add</button>
    </form>
  );
}
