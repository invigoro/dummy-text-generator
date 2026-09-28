/**
 * Hearing the text through the browser's own text-to-speech. A language spelled like a real one
 * (French, invented or not; Latin, which an Italian voice reads well) is read from its written
 * text by a voice for that language, where the browser has one. Any other is read from its "say
 * it" line by an English voice, since that's what the line is for.
 */
import { useEffect, useState } from 'react';

export const canSpeak = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

/** Voices that can read a language's own spelling, by its id: BCP 47 tags, the likeliest first. */
const NATIVE: Readonly<Record<string, readonly string[]>> = {
  english: ['en-GB', 'en'],
  'english-invented': ['en-GB', 'en'],
  french: ['fr-FR', 'fr'],
  'french-real': ['fr-FR', 'fr'],
  spanish: ['es-ES', 'es'],
  portuguese: ['pt-PT', 'pt'],
  italian: ['it-IT', 'it'],
  german: ['de-DE', 'de'],
  latin: ['it-IT', 'it'],
  'lorem-ipsum': ['it-IT', 'it'],
  finnish: ['fi-FI', 'fi'],
  welsh: ['cy-GB', 'cy'],
  'old-norse': ['is-IS', 'is'],
};

const ENGLISH = ['en-GB', 'en-US', 'en'];

type Voice = Pick<SpeechSynthesisVoice, 'name' | 'lang'>;

/** The first voice for any of the tags, in their order: an exact match, then any of that language. */
export function voiceFor<T extends Voice>(voices: readonly T[], tags: readonly string[]): T | null {
  const lang = (voice: T) => voice.lang.toLowerCase().replace('_', '-');
  for (const tag of tags.map((tag) => tag.toLowerCase())) {
    const found = voices.find((voice) => lang(voice) === tag) ?? voices.find((voice) => lang(voice).startsWith(`${tag}-`));
    if (found) return found;
  }
  return null;
}

export interface Reading<T extends Voice = SpeechSynthesisVoice> {
  text: string;
  voice: T | null;
  lang: string;
  /** Who reads it, and from what, for the button's tooltip. */
  describe: string;
}

/**
 * What to read, and in which voice: the written text in a voice for its language, or else the
 * "say it" line in an English one, in lowercase, so that no voice spells out its capitals.
 */
export function readingOf<T extends Voice>(languageId: string, voices: readonly T[], written: string, said: string | null): Reading<T> {
  const tags = NATIVE[languageId];
  const native = tags ? voiceFor(voices, tags) : null;
  if (native || !said) return { text: written, voice: native, lang: native?.lang ?? tags?.[0] ?? 'en', describe: native ? `Read by ${native.name}` : 'Read aloud' };
  const english = voiceFor(voices, ENGLISH);
  return {
    text: said.toLowerCase(),
    voice: english,
    lang: english?.lang ?? 'en',
    describe: english ? `Read from the “say it” line by ${english.name}` : 'Read from the “say it” line',
  };
}

/**
 * The text in pieces a sentence long, or shorter: some browsers stop partway through a long
 * piece. A long sentence breaks at a comma or semicolon if it can, else at a space.
 */
export function chunks(text: string, longest = 220): string[] {
  const out: string[] = [];
  for (const sentence of text.split(/\n+|(?<=[.!?…])\s+/u).map((part) => part.trim())) {
    let rest = sentence;
    while (rest.length > longest) {
      const pause = Math.max(rest.lastIndexOf(', ', longest), rest.lastIndexOf('; ', longest));
      const space = rest.lastIndexOf(' ', longest);
      const at = pause > longest / 3 ? pause + 1 : space > 0 ? space : longest;
      out.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

/** The browser's voices, and a way to read with them. */
export function useSpeech() {
  const available = canSpeak();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (available ? window.speechSynthesis.getVoices() : []));
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!available) return;
    const synth = window.speechSynthesis;
    // Voices can arrive after the page loads.
    const update = () => setVoices(synth.getVoices());
    synth.addEventListener?.('voiceschanged', update);
    update();
    return () => {
      synth.removeEventListener?.('voiceschanged', update);
      synth.cancel();
    };
  }, [available]);

  function speak(reading: Reading) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const parts = chunks(reading.text);
    parts.forEach((part, i) => {
      const utterance = new window.SpeechSynthesisUtterance(part);
      utterance.lang = reading.lang;
      if (reading.voice) utterance.voice = reading.voice;
      utterance.rate = 0.9;
      if (i === parts.length - 1) {
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
      }
      synth.speak(utterance);
    });
    setSpeaking(parts.length > 0);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return { available, voices, speaking, speak, stop };
}
