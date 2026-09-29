import { useId, useState, type Ref } from 'react';
import type { Setting } from '../data/settings';
import { ARRANGEMENTS, MAX_LENGTH, type Arrangement, type Length } from '../engine/arrange';
import { FORMS, SPEAKERS, type Form } from '../engine/forms';
import { NAME_KINDS, type NameKind } from '../engine/names';
import type { LanguageDef } from '../engine/language';
import { UNNAMED_LANGUAGE, UNTITLED_SETTING } from './customSettings';
import { VIEWS, type Alphabet, type View } from './urlState';

type Order = { label: string; hint: string };

/**
 * How each form's text can be ordered. A conversation's or an inscription's lines have no
 * paragraphs to shuffle, and names are made afresh, in no order.
 */
const ORDERS: Record<Form, Partial<Record<Arrangement, Order>>> = {
  prose: {
    original: { label: 'Original order', hint: 'A passage in the order it was written' },
    paragraphs: { label: 'Shuffle paragraphs', hint: 'Whole paragraphs from all over the text' },
    sentences: { label: 'Shuffle sentences', hint: 'Sentences regrouped into new paragraphs' },
    words: { label: 'Shuffle words', hint: 'Nonsense with the rhythm and punctuation of prose' },
  },
  conversation: {
    original: { label: 'Original order', hint: 'An exchange in the order it was written' },
    sentences: { label: 'Shuffle lines', hint: 'Lines from all over the text' },
    words: { label: 'Shuffle words', hint: 'Nonsense with the rhythm of speech' },
  },
  inscription: {
    original: { label: 'Original order', hint: 'Phrases in the order they were written' },
    sentences: { label: 'Shuffle lines', hint: 'Phrases from all over the text' },
    words: { label: 'Shuffle words', hint: 'Short lines of jumbled words' },
  },
  names: {},
};

const FORM_LABELS: Record<Form, { label: string; hint: string }> = {
  prose: { label: 'Prose', hint: 'Paragraphs, as in a letter or a book' },
  conversation: { label: 'Conversation', hint: 'Lines of speech, each after its speaker’s name' },
  inscription: { label: 'Inscription', hint: 'Short lines, for a stone, a sign or a seal' },
  names: { label: 'Names', hint: 'Names for people or places, in the language’s own words' },
};

const NAME_KIND_LABELS: Record<NameKind, string> = { people: 'People', places: 'Places' };

const VIEW_LABELS: Record<View, string> = { written: 'Written', say: 'Say it', both: 'Both', ipa: 'IPA' };

/** What the length is counted in: a conversation or an inscription has lines, not paragraphs, and names are counted as names. */
function unitName(unit: Length['unit'], form: Form): string {
  if (form === 'names') return 'names';
  if (unit === 'words') return 'words';
  return form === 'prose' ? 'paragraphs' : 'lines';
}

const SPEAKER_COUNTS = Array.from({ length: SPEAKERS.max - SPEAKERS.min + 1 }, (_, i) => SPEAKERS.min + i);

/** The arrangement as the form offers it: its lines' "Shuffle lines" stands in for shuffled paragraphs. */
export function shownArrangement(arrangement: Arrangement, form: Form): Arrangement {
  return ORDERS[form][arrangement] ? arrangement : 'sentences';
}

interface ControlsProps {
  /** Every setting to choose from: built-in, the person's own, and any from a shared link. */
  settings: readonly Setting[];
  /** Every language there is, built in or made, by id. */
  languages: ReadonlyMap<string, LanguageDef>;
  /** The buttons that open the settings editor and the builder, to return to when they close. */
  editButton?: Ref<HTMLButtonElement>;
  onEditSettings: () => void;
  buildButton?: Ref<HTMLButtonElement>;
  onBuild: () => void;
  choice: string;
  onChoice: (key: string) => void;
  /** Whether the language has a "say it" line, and so a choice of views. */
  spoken: boolean;
  view: View;
  onView: (view: View) => void;
  /** What the language's own alphabet is called, for one written in another than Latin letters: "Cyrillic". */
  ownAlphabet?: string;
  alphabet: Alphabet;
  onAlphabet: (alphabet: Alphabet) => void;
  form: Form;
  onForm: (form: Form) => void;
  speakers: number;
  onSpeakers: (speakers: number) => void;
  nameKind: NameKind;
  onNameKind: (kind: NameKind) => void;
  arrangement: Arrangement;
  onArrangement: (arrangement: Arrangement) => void;
  length: Length;
  onUnit: (unit: Length['unit']) => void;
  onCount: (count: number) => void;
  seed: number;
  onReroll: () => void;
}

/** "Elvish (French)" where the name isn't the language's own. */
function optionLabel(name: string, own: string | undefined): string {
  const shown = name.trim() || UNNAMED_LANGUAGE;
  return !own || shown === own ? shown : `${shown} (${own})`;
}

export function Controls(props: ControlsProps) {
  const id = useId();
  const { length, form } = props;
  const orders = ORDERS[form];
  const arrangement = shownArrangement(props.arrangement, form);
  return (
    <div className="controls">
      <div className="field">
        <label className="label" htmlFor={`${id}-language`}>
          Language
        </label>
        <select id={`${id}-language`} value={props.choice} onChange={(event) => props.onChoice(event.target.value)}>
          {props.settings
            .filter((setting) => setting.choices.length > 0)
            .map((setting) => (
              <optgroup key={setting.id} label={setting.name.trim() || UNTITLED_SETTING}>
                {setting.choices.map((choice) => (
                  <option key={choice.id} value={`${setting.id}/${choice.id}`}>
                    {optionLabel(choice.name, props.languages.get(choice.language)?.name)}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
        <div className="links">
          <button ref={props.editButton} type="button" className="link" onClick={props.onEditSettings}>
            Name your own world’s languages…
          </button>
          <button ref={props.buildButton} type="button" className="link" onClick={props.onBuild}>
            Build a language of your own…
          </button>
        </div>
      </div>

      {props.spoken && (
        <fieldset>
          <legend className="label">Show</legend>
          <div className="segmented">
            {VIEWS.map((view) => (
              <label key={view}>
                <input type="radio" name={`${id}-view`} value={view} checked={props.view === view} onChange={() => props.onView(view)} />
                <span>{VIEW_LABELS[view]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {props.ownAlphabet && (
        <fieldset>
          <legend className="label">Alphabet</legend>
          <div className="segmented">
            {(['own', 'latin'] as const).map((alphabet) => (
              <label key={alphabet}>
                <input
                  type="radio"
                  name={`${id}-alphabet`}
                  value={alphabet}
                  checked={props.alphabet === alphabet}
                  onChange={() => props.onAlphabet(alphabet)}
                />
                <span>{alphabet === 'own' ? props.ownAlphabet : 'Latin'}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="field">
        <label className="label" htmlFor={`${id}-form`}>
          Form
        </label>
        <div className="row">
          <select
            id={`${id}-form`}
            aria-describedby={`${id}-form-hint`}
            value={form}
            onChange={(event) => props.onForm(event.target.value as Form)}
          >
            {FORMS.map((value) => (
              <option key={value} value={value}>
                {FORM_LABELS[value].label}
              </option>
            ))}
          </select>
          {form === 'conversation' && (
            <select aria-label="Speakers" value={props.speakers} onChange={(event) => props.onSpeakers(Number(event.target.value))}>
              {SPEAKER_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} speakers
                </option>
              ))}
            </select>
          )}
          {form === 'names' && (
            <select aria-label="Names of" value={props.nameKind} onChange={(event) => props.onNameKind(event.target.value as NameKind)}>
              {NAME_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {NAME_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          )}
        </div>
        <small className="hint" id={`${id}-form-hint`}>
          {FORM_LABELS[form].hint}
        </small>
      </div>

      {form !== 'names' && (
        <div className="field">
          <label className="label" htmlFor={`${id}-order`}>
            Order
          </label>
          <select
            id={`${id}-order`}
            aria-describedby={`${id}-order-hint`}
            value={arrangement}
            onChange={(event) => props.onArrangement(event.target.value as Arrangement)}
          >
            {ARRANGEMENTS.filter((value) => orders[value]).map((value) => (
              <option key={value} value={value}>
                {orders[value]!.label}
              </option>
            ))}
          </select>
          <small className="hint" id={`${id}-order-hint`}>
            {orders[arrangement]!.hint}
          </small>
        </div>
      )}

      <fieldset>
        <legend className="label">Length</legend>
        <div className="length">
          <CountInput
            key={`${form}-${length.unit}`}
            label={`Number of ${unitName(length.unit, form)}`}
            value={length.count}
            max={MAX_LENGTH[length.unit]}
            onChange={props.onCount}
          />
          {form === 'names' ? (
            <span className="unit">names</span>
          ) : (
            <select aria-label="Count in" value={length.unit} onChange={(event) => props.onUnit(event.target.value as Length['unit'])}>
              {(['paragraphs', 'words'] as const).map((unit) => (
                <option key={unit} value={unit}>
                  {unitName(unit, form)}
                </option>
              ))}
            </select>
          )}
        </div>
      </fieldset>

      <div className="reroll-row">
        <button type="button" className="reroll" onClick={props.onReroll}>
          <span aria-hidden="true">🎲</span> Reroll
        </button>
        <span className="seed" title="The same seed and settings always give the same text">
          Seed {props.seed}
        </span>
      </div>
    </div>
  );
}

interface CountInputProps {
  label: string;
  value: number;
  max: number;
  onChange: (count: number) => void;
}

/** A number box that can be emptied while typing, and caps what's typed at `max`. */
function CountInput({ label, value, max, onChange }: CountInputProps) {
  const [draft, setDraft] = useState(String(value));
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={1}
      max={max}
      value={draft}
      onChange={(event) => {
        const count = Number.parseInt(event.target.value, 10);
        if (!(count >= 1)) {
          setDraft(event.target.value);
          return;
        }
        const capped = Math.min(max, count);
        setDraft(String(capped));
        onChange(capped);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}
