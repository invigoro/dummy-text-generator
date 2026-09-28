import { useEffect, useState } from 'react';
import { languageKey, loadLanguage, type LoadedLanguage } from '../data/languages';
import type { LanguageDef } from '../engine/language';

export type LanguageState =
  | { status: 'loading' }
  | { status: 'ready'; loaded: LoadedLanguage }
  | { status: 'failed'; retry: () => void };

/** A language, loaded in the background: its flow text fetched and its vocabulary built. */
export function useLanguage(def: LanguageDef): LanguageState {
  const [state, setState] = useState<LanguageState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  // A made language is a new object on every render; its content says whether it changed.
  const key = languageKey(def);

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    loadLanguage(def).then(
      (loaded) => {
        if (current) setState({ status: 'ready', loaded });
      },
      () => {
        if (current) setState({ status: 'failed', retry: () => setAttempt((n) => n + 1) });
      },
    );
    return () => {
      current = false;
    };
  }, [key, attempt]);

  return state;
}
