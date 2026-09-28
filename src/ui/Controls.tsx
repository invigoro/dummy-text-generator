import { useId, useState } from 'react';
import { ARRANGEMENTS, MAX_LENGTH, type Arrangement, type Length } from '../engine/arrange';

const ORDERS: Record<Arrangement, { label: string; hint: string }> = {
  original: { label: 'Original order', hint: 'A passage as the author wrote it' },
  paragraphs: { label: 'Shuffle paragraphs', hint: 'Whole paragraphs from all over the book' },
  sentences: { label: 'Shuffle sentences', hint: 'Sentences regrouped into new paragraphs' },
  words: { label: 'Shuffle words', hint: 'Nonsense with the rhythm and punctuation of prose' },
};

const UNITS: Record<Length['unit'], string> = { paragraphs: 'paragraphs', words: 'words' };

interface ControlsProps {
  arrangement: Arrangement;
  onArrangement: (arrangement: Arrangement) => void;
  length: Length;
  onUnit: (unit: Length['unit']) => void;
  onCount: (count: number) => void;
  onReroll: () => void;
}

export function Controls({ arrangement, onArrangement, length, onUnit, onCount, onReroll }: ControlsProps) {
  const id = useId();
  return (
    <div className="controls">
      <fieldset>
        <legend>Order</legend>
        {ARRANGEMENTS.map((value) => (
          <label key={value} className="choice">
            <input
              type="radio"
              name={`${id}-order`}
              value={value}
              checked={arrangement === value}
              onChange={() => onArrangement(value)}
            />
            <span>{ORDERS[value].label}</span>
            <small>{ORDERS[value].hint}</small>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Length</legend>
        <div className="length">
          <CountInput
            key={length.unit}
            label={`Number of ${UNITS[length.unit]}`}
            value={length.count}
            max={MAX_LENGTH[length.unit]}
            onChange={onCount}
          />
          <select aria-label="Count in" value={length.unit} onChange={(event) => onUnit(event.target.value as Length['unit'])}>
            {Object.entries(UNITS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <button type="button" className="reroll" onClick={onReroll}>
        <span aria-hidden="true">🎲</span> Reroll
      </button>
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
