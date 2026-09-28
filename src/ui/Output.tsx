import { useEffect, useState } from 'react';
import { plainText, type GeneratedText } from '../engine/generate';

export function Output({ text }: { text: GeneratedText }) {
  return (
    <section className="output" aria-label="Generated text">
      <div className="output-bar">
        <p className="word-count">{text.words.toLocaleString('en')} words</p>
        <CopyButton text={plainText(text)} />
      </div>
      <article className="page">
        {text.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </article>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      // No clipboard access (an insecure page, or permission refused).
      setStatus('failed');
    }
  }

  return (
    <div className="copy">
      <span role="status" className="copy-status">
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Couldn’t copy. Select the text and copy it instead.' : ''}
      </span>
      <button type="button" onClick={copy}>
        Copy
      </button>
    </div>
  );
}
