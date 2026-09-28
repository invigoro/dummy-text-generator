import { useId, useState, type Ref } from 'react';
import type { Setting } from '../data/settings';
import { languageDef } from '../data/languages';
import { ARRANGEMENTS, MAX_LENGTH, type Arrangement, type Length } from '../engine/arrange';
import { UNNAMED_LANGUAGE, UNTITLED_SETTING } from './customSettings';
import { VIEWS, type View } from './urlState';

const ORDERS: Record<Arrangement, { label: string; hint: string }> = {
  original: { label: 'Original order', hint: 'A passage in the order it was written' },
  paragraphs: { label: 'Shuffle paragraphs', hint: 'Whole paragraphs from all over the text' },
  sentences: { label: 'Shuffle sentences', hint: 'Sentences regrouped into new paragraphs' },
  words: { label: 'Shuffle words', hint: 'Nonsense with the rhythm and punctuation of prose' },
};

const VIEW_LABELS: Record<View, string> = { written: 'Written', say: 'Say it', both: 'Both', ipa: 'IPA' };

const UNITS: Record<Length['unit'], string> = { paragraphs: 'paragraphs', words: 'words' };

interface ControlsProps {
  /** Every setting to choose from: built-in, the person's own, and any from a shared link. */
  settings: readonly Setting[];
  /** The button that opens the settings editor, to return to when it closes. */
  editButton?: Ref<HTMLButtonElement>;
  onEditSettings: () => void;
  choice: string;
  onChoice: (key: string) => void;
  /** Whether the language has a "say it" line, and so a choice of views. */
  spoken: boolean;
  view: View;
  onView: (view: View) => void;
  arrangement: Arrangement;
  onArrangement: (arrangement: Arrangement) => void;
  length: Length;
  onUnit: (unit: Length['unit']) => void;
  onCount: (count: number) => void;
  seed: number;
  onReroll: () => void;
}

/** "Elvish (French)" where the name isn't the language's own. */
function optionLabel(name: string, language: string): string {
  const own = languageDef(language).name;
  const shown = name.trim() || UNNAMED_LANGUAGE;
  return shown === own ? shown : `${shown} (${own})`;
}

export function Controls(props: ControlsProps) {
  const id = useId();
  const { length } = props;
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
                    {optionLabel(choice.name, choice.language)}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
        <button ref={props.editButton} type="button" className="link" onClick={props.onEditSettings}>
          Name your own world’s languages…
        </button>
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

      <div className="field">
        <label className="label" htmlFor={`${id}-order`}>
          Order
        </label>
        <select
          id={`${id}-order`}
          aria-describedby={`${id}-order-hint`}
          value={props.arrangement}
          onChange={(event) => props.onArrangement(event.target.value as Arrangement)}
        >
          {ARRANGEMENTS.map((arrangement) => (
            <option key={arrangement} value={arrangement}>
              {ORDERS[arrangement].label}
            </option>
          ))}
        </select>
        <small className="hint" id={`${id}-order-hint`}>
          {ORDERS[props.arrangement].hint}
        </small>
      </div>

      <fieldset>
        <legend className="label">Length</legend>
        <div className="length">
          <CountInput
            key={length.unit}
            label={`Number of ${UNITS[length.unit]}`}
            value={length.count}
            max={MAX_LENGTH[length.unit]}
            onChange={props.onCount}
          />
          <select aria-label="Count in" value={length.unit} onChange={(event) => props.onUnit(event.target.value as Length['unit'])}>
            {Object.entries(UNITS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
