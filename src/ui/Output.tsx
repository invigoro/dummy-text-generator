import { useEffect, useState } from 'react';
import { countDocWords, paragraphText, writtenText, type DocParagraph } from '../engine/document';

export function Output({ paragraphs }: { paragraphs: DocParagraph[] }) {
  return (
    <section className="output" aria-label="Generated text">
      <div className="output-bar">
        <p className="word-count">{countDocWords(paragraphs).toLocaleString('en')} words</p>
        <CopyButton text={writtenText(paragraphs)} />
      </div>
      <article className="page">
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraphText(paragraph)}</p>
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
