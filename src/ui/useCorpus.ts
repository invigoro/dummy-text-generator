import { useEffect, useState } from 'react';
import { loadCorpus } from '../data/corpora';
import type { Corpus } from '../engine/tokenize';

export type CorpusState =
  | { status: 'loading' }
  | { status: 'ready'; corpus: Corpus }
  | { status: 'failed'; retry: () => void };

/** A source text, loaded in the background. */
export function useCorpus(id: string): CorpusState {
  const [state, setState] = useState<CorpusState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    loadCorpus(id).then(
      (corpus) => {
        if (current) setState({ status: 'ready', corpus });
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
