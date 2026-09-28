import { useEffect } from 'react';
import { canSpeak, readingOf, useSpeech } from './speech';

interface ListenProps {
  /** The language's id, for a voice that reads its spelling. */
  languageId: string;
  written: string;
  /** The "say it" line, for a language no voice reads as it's spelled. */
  said: string | null;
}

/** Hear the text read by the browser, where it can read aloud. */
export function Listen({ languageId, written, said }: ListenProps) {
  const { available, voices, speaking, speak, stop } = useSpeech();
  // New text stops the old.
  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, [written]);
  if (!available) return null;
  const reading = readingOf(languageId, voices, written, said);
  return (
    <button type="button" aria-pressed={speaking} title={reading.describe} onClick={() => (speaking ? stop() : speak(reading))}>
      <span aria-hidden="true">{speaking ? '■' : '▶'}</span> {speaking ? 'Stop' : 'Listen'}
    </button>
  );
}
