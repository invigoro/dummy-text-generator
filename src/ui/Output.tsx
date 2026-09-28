import { Fragment, useEffect, useState, type ReactNode } from 'react';
import {
  countDocWords,
  paragraphText,
  sayWords,
  spokenText,
  writtenText,
  type DocParagraph,
  type DocSentence,
} from '../engine/document';
import type { Form } from '../engine/forms';
import { stressRule, type Language } from '../engine/language';
import type { Respeller } from '../engine/respell';
import type { StressRule } from '../engine/sounds/system';
import { steleLink, trimForStele, type SteleOptions } from '../engine/stele';
import type { View } from './urlState';

interface OutputProps {
  paragraphs: DocParagraph[];
  language: Language;
  /** The view to show; ignored for a language without a "say it" line. */
  view: View;
  /** Prose, a conversation (a speaker before each line) or an inscription (one short line each). */
  form: Form;
  stele: SteleOptions;
}

type Voice = { rule: StressRule; respell: Respeller };

function voiceOf(language: Language): Voice | null {
  const rule = stressRule(language);
  return rule && language.kind !== 'real' ? { rule, respell: language.respell } : null;
}

/**
 * The text as the view shows it, for copying: a blank line between paragraphs, or a line break
 * between an inscription's lines. "Both" puts each paragraph's "say it" line under it.
 */
function viewText(paragraphs: DocParagraph[], view: View, voice: Voice | null, separator: string): string {
  if (!voice || view === 'written') return writtenText(paragraphs, separator);
  if (view === 'say' || view === 'ipa') return spokenText(paragraphs, voice.rule, voice.respell, view, separator);
  return paragraphs.map((paragraph) => `${paragraphText(paragraph)}\n${spokenText([paragraph], voice.rule, voice.respell, 'say')}`).join('\n\n');
}

export function Output({ paragraphs, language, view, form, stele }: OutputProps) {
  const voice = voiceOf(language);
  const shown = voice ? view : 'written';
  const separator = form === 'inscription' ? '\n' : '\n\n';
  return (
    <section className="output" aria-label="Generated text">
      <div className="output-bar">
        <p className="word-count">{countDocWords(paragraphs).toLocaleString('en')} words</p>
        <Actions copyText={viewText(paragraphs, shown, voice, separator)} steleText={writtenText(paragraphs, separator)} stele={stele} />
      </div>
      {voice && shown !== 'written' && 'voicing' in language && language.voicing && (
        <aside className="voicing">
          <strong>How to say it:</strong> {language.voicing}
        </aside>
      )}
      <article className={`page view-${shown} form-${form}`}>
        {paragraphs.map((paragraph, i) => (
          <p key={i}>
            {paragraph.speaker && (
              <>
                <span className="speaker">{renderParagraph({ sentences: [paragraph.speaker] }, shown, voice)}</span>{' '}
              </>
            )}
            {renderParagraph({ sentences: paragraph.sentences }, shown, voice)}
          </p>
        ))}
      </article>
    </section>
  );
}

/** A paragraph's sentences in the view. A speaker's name is shown on its own, before them. */
function renderParagraph(paragraph: DocParagraph, view: View, voice: Voice | null): ReactNode {
  if (!voice || view === 'written') return paragraphText(paragraph);
  if (view === 'say' || view === 'ipa') return spokenText([paragraph], voice.rule, voice.respell, view);
  return paragraph.sentences.map((sentence, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <Interlinear sentence={sentence} voice={voice} />
    </Fragment>
  ));
}

/** Each word with its "say it" form in small type underneath. */
function Interlinear({ sentence, voice }: { sentence: DocSentence; voice: Voice }) {
  const said = sayWords(sentence, voice.rule, voice.respell);
  return sentence.tokens.map((token, i) =>
    token.kind === 'word' && said[i] ? (
      <ruby key={i}>
        {token.text}
        <rt>{said[i]!.say}</rt>
      </ruby>
    ) : (
      <Fragment key={i}>{token.text}</Fragment>
    ),
  );
}

type Status = { message: string; failed?: boolean } | null;

function Actions({ copyText, steleText, stele }: { copyText: string; steleText: string; stele: SteleOptions }) {
  const [status, setStatus] = useState<Status>(null);
  const [link, setLink] = useState<string | null>(null);
  const trimmed = trimForStele(steleText).trimmed;

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    let current = true;
    steleLink(steleText, stele).then(
      (url) => {
        if (current) setLink(url);
      },
      () => {
        if (current) setLink(null);
      },
    );
    return () => {
      current = false;
    };
  }, [steleText, stele]);

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ message: done });
    } catch {
      // No clipboard access (an insecure page, or permission refused).
      setStatus({ message: 'Couldn’t copy. Select the text and copy it instead.', failed: true });
    }
  }

  return (
    <div className="actions">
      <span role="status" className="status">
        {status?.message ?? ''}
      </span>
      <button type="button" onClick={() => copy(copyText, 'Copied')}>
        Copy
      </button>
      <button type="button" onClick={() => copy(window.location.href, 'Link copied')}>
        Share link
      </button>
      <a
        className="button"
        href={link ?? undefined}
        aria-disabled={!link}
        target="_blank"
        rel="noopener"
        title={trimmed ? 'Stele keeps the first 4,000 characters' : 'Make it into an inscription or a document in Stele'}
      >
        Open in Stele
      </a>
    </div>
  );
}
