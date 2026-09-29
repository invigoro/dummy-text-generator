import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
import { voiceOf, type Language, type Voice } from '../engine/language';
import { steleLink, trimForStele, type SteleOptions } from '../engine/stele';
import { Listen } from './Listen';
import type { View } from './urlState';

interface OutputProps {
  paragraphs: DocParagraph[];
  language: Language;
  /** The view to show; ignored for a language without a "say it" line. */
  view: View;
  /** Prose, a conversation (a speaker before each line) or an inscription (one short line each). */
  form: Form;
  stele: SteleOptions;
  /** What the language is called here, for the read-aloud view's heading: "Elvish". */
  title: string;
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

export function Output({ paragraphs, language, view, form, stele, title }: OutputProps) {
  const voice = voiceOf(language);
  const shown = voice ? view : 'written';
  // An inscription's lines and a list of names go one to a line.
  const separator = form === 'inscription' || form === 'names' ? '\n' : '\n\n';
  const [reading, setReading] = useState(false);
  const readButton = useRef<HTMLButtonElement>(null);
  const written = writtenText(paragraphs, separator);
  const said = voice ? spokenText(paragraphs, voice.rule, voice.respell, 'say', separator) : null;
  return (
    <section className="output" aria-label="Generated text">
      <div className="output-bar">
        <p className="word-count">
          {form === 'names' ? `${paragraphs.length} names` : `${countDocWords(paragraphs).toLocaleString('en')} words`}
        </p>
        <Actions copyText={viewText(paragraphs, shown, voice, separator)} steleText={written} stele={stele}>
          <Listen languageId={language.id} written={written} said={said} />
          <button ref={readButton} type="button" onClick={() => setReading(true)}>
            Read aloud
          </button>
        </Actions>
      </div>
      {voice && shown !== 'written' && <Voicing language={language} />}
      <TextPage paragraphs={paragraphs} view={shown} voice={voice} form={form} />
      {reading && (
        <ReadAloud
          paragraphs={paragraphs}
          language={language}
          voice={voice}
          form={form}
          title={title}
          // Reading aloud is what "say it" is for; "both" and the written text are a click away.
          initialView={voice ? (shown === 'both' ? 'both' : 'say') : 'written'}
          listen={<Listen languageId={language.id} written={written} said={said} />}
          onClose={() => {
            setReading(false);
            readButton.current?.focus();
          }}
        />
      )}
    </section>
  );
}

function Voicing({ language }: { language: Language }) {
  if (!('voicing' in language) || !language.voicing) return null;
  return (
    <aside className="voicing">
      <strong>How to say it:</strong> {language.voicing}
    </aside>
  );
}

interface TextPageProps {
  paragraphs: DocParagraph[];
  view: View;
  voice: Voice | null;
  form: Form;
  className?: string;
}

/**
 * Whether the text has letters made with a combining accent, such as Navajo's ą́, which has no
 * letter of its own. Not every font can place the accent, so such a text gets one that can.
 */
const hasMarks = (paragraphs: readonly DocParagraph[]) =>
  paragraphs.some((paragraph) => /\p{M}/u.test(paragraphText(paragraph) + (paragraph.speaker ? paragraphText({ sentences: [paragraph.speaker] }) : '')));

/** The text as a page, in the view asked for. */
function TextPage({ paragraphs, view, voice, form, className = 'page' }: TextPageProps) {
  return (
    <article className={`${className} view-${view} form-${form}${hasMarks(paragraphs) ? ' marks' : ''}`}>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.speaker && (
            <>
              <span className="speaker">{renderParagraph({ sentences: [paragraph.speaker] }, view, voice)}</span>{' '}
            </>
          )}
          {renderParagraph({ sentences: paragraph.sentences }, view, voice)}
        </p>
      ))}
    </article>
  );
}

const READ_VIEWS: readonly { view: View; label: string }[] = [
  { view: 'say', label: 'Say it' },
  { view: 'both', label: 'Both' },
  { view: 'written', label: 'Written' },
];

/** Type sizes for reading at the table, in rem. */
const SIZES = [1.25, 1.5, 1.8, 2.2, 2.7, 3.3] as const;

interface ReadAloudProps {
  paragraphs: DocParagraph[];
  language: Language;
  voice: Voice | null;
  form: Form;
  title: string;
  initialView: View;
  /** A button to hear it read, where the browser can. */
  listen: ReactNode;
  onClose: () => void;
}

/** The text in large type, for reading aloud at the table, with the language's tip for voicing it. */
function ReadAloud({ paragraphs, language, voice, form, title, initialView, listen, onClose }: ReadAloudProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>(initialView);
  const [size, setSize] = useState(2);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // A modal dialog keeps focus inside it, and closes on Escape.
    if (typeof element.showModal === 'function') element.showModal();
    else element.setAttribute('open', '');
    return () => {
      if (element.open && typeof element.close === 'function') element.close();
    };
  }, []);

  return (
    <dialog ref={dialog} className="read-aloud" aria-labelledby={`${id}-title`} onClose={onClose} onCancel={onClose}>
      <div className="read-aloud-bar">
        <h2 id={`${id}-title`}>{title}</h2>
        {voice && (
          <div className="segmented" role="radiogroup" aria-label="Show">
            {READ_VIEWS.map((option) => (
              <label key={option.view}>
                <input type="radio" name={`${id}-view`} checked={view === option.view} onChange={() => setView(option.view)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
        <div className="read-aloud-size">
          <button type="button" aria-label="Smaller text" disabled={size === 0} onClick={() => setSize(size - 1)}>
            A−
          </button>
          <button type="button" aria-label="Larger text" disabled={size === SIZES.length - 1} onClick={() => setSize(size + 1)}>
            A+
          </button>
        </div>
        {listen}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      {voice && view !== 'written' && <Voicing language={language} />}
      <div style={{ fontSize: `${SIZES[size]}rem` }}>
        <TextPage paragraphs={paragraphs} view={view} voice={voice} form={form} className="read-aloud-text" />
      </div>
    </dialog>
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
        <span className="word">{token.text}</span>
        <rt>{said[i]!.say}</rt>
      </ruby>
    ) : (
      <Fragment key={i}>{token.text}</Fragment>
    ),
  );
}

type Status = { message: string; failed?: boolean } | null;

interface ActionsProps {
  copyText: string;
  steleText: string;
  stele: SteleOptions;
  /** More actions, before the others. */
  children?: ReactNode;
}

function Actions({ copyText, steleText, stele, children }: ActionsProps) {
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
      {children}
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
