import { useEffect, useState } from 'react';
import { loadLanguage, type LoadedLanguage } from '../data/languages';

export type LanguageState =
  | { status: 'loading' }
  | { status: 'ready'; loaded: LoadedLanguage }
  | { status: 'failed'; retry: () => void };

/** A language, loaded in the background: its flow text fetched and its vocabulary built. */
export function useLanguage(id: string): LanguageState {
  const [state, setState] = useState<LanguageState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    loadLanguage(id).then(
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
  }, [id, attempt]);

  return state;
}
