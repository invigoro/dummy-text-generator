// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES } from '../data/languages';
import type { InventedLanguageDef } from '../engine/language';
import App from './App';
import { encodeLanguages, loadCustomLanguages, newLanguage, saveCustomLanguages } from './customLanguages';
import { encodeSetting, loadCustomSettings, sanitizeSetting, saveCustomSettings } from './customSettings';

// Seeds come in a fixed sequence, so every run shows the same text.
let nextSeed = 1;
vi.mock('../engine/rng', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../engine/rng')>()),
  randomSeed: () => nextSeed++,
}));

beforeEach(() => {
  nextSeed = 1;
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});
afterEach(cleanup);

/** The generated paragraphs, once the text has loaded. */
async function paragraphs() {
  const page = await screen.findByRole('article');
  return within(page)
    .getAllByRole('paragraph')
    .map((paragraph) => paragraph.textContent ?? '');
}

const language = () => screen.getByRole('combobox', { name: 'Language' });

describe('App', () => {
  it('starts with Elvish, in invented French, and credits its flow', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dummy Text Generator' })).toBeInTheDocument();
    expect(await paragraphs()).toHaveLength(3);
    expect(language()).toHaveValue('dnd/elvish');
    expect(screen.getByText('Les Trois Mousquetaires')).toBeInTheDocument();
  });

  it('switches language', async () => {
    const user = userEvent.setup();
    render(<App />);
    const elvish = await paragraphs();
    await user.selectOptions(language(), 'dnd/common');
    expect(await screen.findByText('Treasure Island')).toBeInTheDocument();
    expect(await paragraphs()).not.toEqual(elvish);
    // Real English has no "say it" line, so there are no views to choose from.
    expect(screen.queryByRole('radio', { name: 'Say it' })).not.toBeInTheDocument();
  });

  it('shows how to say it, with a tip for voicing it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(screen.getByRole('radio', { name: 'Say it' }));
    const [first] = await paragraphs();
    expect(first).not.toMatch(/[éèêàçœ«»]/u);
    expect(first).toMatch(/[a-z]+-[A-Z]+|[A-Z]{2,}/);
    expect(screen.getByText(/How to say it:/)).toBeInTheDocument();
  });

  it('shows both, with the "say it" form under each word', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await paragraphs();
    await user.click(screen.getByRole('radio', { name: 'Both' }));
    expect(container.querySelectorAll('ruby rt').length).toBeGreaterThan(10);
  });

  it('shows IPA', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(screen.getByRole('radio', { name: 'IPA' }));
    expect((await paragraphs()).join(' ')).toMatch(/ˈ/u);
  });

  it('gives as many paragraphs as asked for, up to the most it allows', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    const count = screen.getByRole('spinbutton', { name: 'Number of paragraphs' });
    await user.clear(count);
    await user.type(count, '5');
    expect(await paragraphs()).toHaveLength(5);
    await user.clear(count);
    await user.type(count, '500');
    expect(count).toHaveValue(100);
  });

  it('counts in words, keeping a separate count for each unit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Count in' }), 'words');
    expect(screen.getByRole('spinbutton', { name: 'Number of words' })).toHaveValue(200);
    const words = Number(screen.getByText(/^[\d,]+ words$/).textContent!.split(' ')[0].replace(/,/g, ''));
    expect(words).toBeGreaterThanOrEqual(200);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Count in' }), 'paragraphs');
    expect(screen.getByRole('spinbutton', { name: 'Number of paragraphs' })).toHaveValue(3);
  });

  it('changes the text when the order changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = await paragraphs();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Order' }), 'words');
    expect(await paragraphs()).not.toEqual(before);
    expect(screen.getByText(/rhythm and punctuation/)).toBeInTheDocument();
  });

  it('rerolls to new text, and shows the new seed', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = await paragraphs();
    expect(screen.getByText('Seed 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reroll/ }));
    expect(await paragraphs()).not.toEqual(before);
    expect(screen.getByText('Seed 2')).toBeInTheDocument();
  });

  it('copies the text as it’s shown', async () => {
    const user = userEvent.setup();
    render(<App />);
    const written = await paragraphs();
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe(written.join('\n\n'));
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await user.click(screen.getByRole('radio', { name: 'Say it' }));
    const said = await paragraphs();
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe(said.join('\n\n'));
  });

  it('keeps its settings in the URL, and copies that as a share link', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(screen.getByRole('radio', { name: 'Both' }));
    expect(window.location.hash).toBe('#lang=dnd/elvish&order=sentences&len=3p&seed=1&view=both');
    await user.click(screen.getByRole('button', { name: 'Share link' }));
    expect(await navigator.clipboard.readText()).toBe(window.location.href);
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
  });

  it('starts from the settings in the URL', async () => {
    window.history.replaceState(null, '', '/#lang=real/latin&order=original&len=2p&seed=77&view=ipa');
    render(<App />);
    expect(await paragraphs()).toHaveLength(2);
    expect(language()).toHaveValue('real/latin');
    expect(screen.getByRole('combobox', { name: 'Order' })).toHaveValue('original');
    expect(screen.getByRole('radio', { name: 'IPA' })).toBeChecked();
    expect(screen.getByText('Seed 77')).toBeInTheDocument();
  });

  it('links to Stele with the text', async () => {
    render(<App />);
    await paragraphs();
    // The link is built in the background, and is a link once it has somewhere to go.
    const link = await screen.findByRole('link', { name: 'Open in Stele' });
    await waitFor(() => expect(link.getAttribute('href')).toMatch(/^https:\/\/stele\.invigoro\.me\/#s=[\w-]+$/));
  });

  it('says so when copying fails', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Couldn’t copy/);
  });
});

const speakerNames = (container: HTMLElement) => [...container.querySelectorAll('.speaker')].map((speaker) => speaker.textContent);

describe('Forms', () => {
  it('writes a conversation, each line after its speaker, and keeps it in the URL', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await paragraphs();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Form' }), 'conversation');
    expect(await paragraphs()).toHaveLength(8);
    expect(screen.getByRole('spinbutton', { name: 'Number of lines' })).toHaveValue(8);
    expect(new Set(speakerNames(container)).size).toBe(2);
    expect(window.location.hash).toMatch(/&form=conversation&speakers=2$/);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Speakers' }), '3');
    expect(new Set(speakerNames(container)).size).toBe(3);
    // Lines have no paragraphs to shuffle.
    const order = screen.getByRole('combobox', { name: 'Order' });
    expect(within(order).queryByRole('option', { name: 'Shuffle paragraphs' })).not.toBeInTheDocument();
    expect(order).toHaveValue('sentences');
    expect(within(order).getByRole('option', { name: 'Shuffle lines' })).toBeInTheDocument();
  });

  it('shows each speaker’s name in the view chosen', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await paragraphs();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Form' }), 'conversation');
    const [written] = speakerNames(container);
    await user.click(screen.getByRole('radio', { name: 'Say it' }));
    const [said] = speakerNames(container);
    expect(said).not.toBe(written);
    expect(said).toMatch(/^[a-zA-Z'-]+:$/);
  });

  it('writes an inscription in short lines, copied one to a line', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Form' }), 'inscription');
    const lines = await paragraphs();
    expect(lines).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe(lines.join('\n'));
    expect(window.location.hash).toMatch(/&form=inscription$/);
    // Back to prose, with prose's own length.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Form' }), 'prose');
    expect(await paragraphs()).toHaveLength(3);
  });

  it('starts from a conversation in the URL', async () => {
    window.history.replaceState(null, '', '/#lang=dnd/orc&order=original&len=6p&seed=9&view=written&form=conversation&speakers=4');
    const { container } = render(<App />);
    expect(await paragraphs()).toHaveLength(6);
    expect(screen.getByRole('combobox', { name: 'Form' })).toHaveValue('conversation');
    expect(screen.getByRole('combobox', { name: 'Speakers' })).toHaveValue('4');
    expect(new Set(speakerNames(container)).size).toBe(4);
  });
});

const colonial = sanitizeSetting({
  id: 'my-colonial',
  name: 'Colonial',
  choices: [
    { name: 'Renan', language: 'french' },
    { name: 'Old Deciman', language: 'latin' },
  ],
})!;

const banner = () => screen.queryByRole('region', { name: 'Shared setting' });
const editButton = () => screen.getByRole('button', { name: 'Name your own world’s languages…' });

describe('Your own settings', () => {
  it('names your own world’s languages, and keeps them for next time', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(editButton());
    expect(screen.getByRole('heading', { name: 'Your settings' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: '+ New setting' }));
    // The new setting's name is selected, so typing replaces it.
    expect(screen.getByRole('textbox', { name: 'Setting name' })).toHaveFocus();
    await user.keyboard('Colonial');
    expect(screen.getByRole('textbox', { name: 'Setting name' })).toHaveValue('Colonial');

    const newName = screen.getByRole('textbox', { name: 'New language’s name' });
    const add = newName.closest('form')!;
    await user.type(newName, 'Renan{Enter}');
    expect(newName).toHaveValue('');
    expect(newName).toHaveFocus();
    await user.type(newName, 'Old Deciman');
    await user.selectOptions(within(add).getByRole('combobox', { name: 'Written as' }), 'latin');
    await user.click(within(add).getByRole('button', { name: 'Add' }));
    expect(screen.getAllByRole('textbox', { name: 'Language name' }).map((input) => (input as HTMLInputElement).value)).toEqual([
      'Renan',
      'Old Deciman',
    ]);

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(editButton()).toHaveFocus();
    expect(within(screen.getByRole('group', { name: 'Colonial' })).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Renan (French)',
      'Old Deciman (Latin)',
    ]);
    await user.selectOptions(language(), 'my-world/old-deciman');
    expect(await screen.findByText('De Bello Gallico')).toBeInTheDocument();
    // The link carries the setting, so it works for anyone.
    expect(window.location.hash).toMatch(/^#lang=my-world\/old-deciman&.*&world=[\w-]+$/);

    cleanup();
    render(<App />);
    expect(language()).toHaveValue('my-world/old-deciman');
    expect(banner()).not.toBeInTheDocument();
  });

  it('opens a link that brings a setting, and offers to save it', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/#lang=my-colonial/renan&order=original&len=2p&seed=5&view=written&world=${encodeSetting(colonial)}`);
    render(<App />);
    expect(await paragraphs()).toHaveLength(2);
    expect(language()).toHaveValue('my-colonial/renan');
    expect(banner()).toHaveTextContent('This link brings a setting, Colonial');

    await user.click(within(banner()!).getByRole('button', { name: 'Save it to your settings' }));
    expect(banner()).not.toBeInTheDocument();
    expect(loadCustomSettings()).toEqual([colonial]);
    expect(language()).toHaveValue('my-colonial/renan');
  });

  it('can put off saving a setting from a link, which lasts until the page closes', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/#lang=my-colonial/renan&world=${encodeSetting(colonial)}`);
    render(<App />);
    await paragraphs();
    await user.click(within(banner()!).getByRole('button', { name: 'Not now' }));
    expect(banner()).not.toBeInTheDocument();
    expect(language()).toHaveValue('my-colonial/renan');
    expect(loadCustomSettings()).toEqual([]);
  });

  it('keeps a setting from a link apart from a different one of yours with the same id', async () => {
    saveCustomSettings([sanitizeSetting({ id: 'my-colonial', name: 'Mine', choices: [{ name: 'Renan', language: 'spanish' }] })!]);
    window.history.replaceState(null, '', `/#lang=my-colonial/renan&world=${encodeSetting(colonial)}`);
    render(<App />);
    await paragraphs();
    expect(language()).toHaveValue('my-colonial-2/renan');
    expect(screen.getByText('Les Trois Mousquetaires')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Renan (Spanish)' })).toBeInTheDocument();
  });

  it('takes a setting from a link pasted into the open page', async () => {
    render(<App />);
    await paragraphs();
    window.location.hash = `#lang=my-colonial/old-deciman&world=${encodeSetting(colonial)}`;
    await waitFor(() => expect(language()).toHaveValue('my-colonial/old-deciman'));
    expect(banner()).toBeInTheDocument();
  });

  it('keeps a language’s link when it’s renamed', async () => {
    const user = userEvent.setup();
    saveCustomSettings([colonial]);
    window.history.replaceState(null, '', '/#lang=my-colonial/renan');
    render(<App />);
    await paragraphs();
    await user.click(editButton());
    const [renan] = screen.getAllByRole('textbox', { name: 'Language name' });
    await user.clear(renan);
    await user.type(renan, 'Renani');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(language()).toHaveValue('my-colonial/renan');
    expect(screen.getByRole('option', { name: 'Renani (French)' })).toHaveProperty('selected', true);
  });

  it('names a language left blank, and removes one', async () => {
    const user = userEvent.setup();
    saveCustomSettings([colonial]);
    render(<App />);
    await paragraphs();
    await user.click(editButton());
    const [renan] = screen.getAllByRole('textbox', { name: 'Language name' });
    await user.clear(renan);
    await user.tab();
    expect(renan).toHaveValue('Unnamed language');
    await user.click(screen.getByRole('button', { name: 'Remove Old Deciman' }));
    expect(screen.getAllByRole('textbox', { name: 'Language name' })).toHaveLength(1);
    expect(loadCustomSettings()[0].choices.map((choice) => choice.name)).toEqual(['Unnamed language']);
  });

  it('deletes a setting, with a way to undo it', async () => {
    const user = userEvent.setup();
    saveCustomSettings([colonial]);
    render(<App />);
    await paragraphs();
    await user.click(editButton());
    await user.click(screen.getByRole('button', { name: 'Delete setting' }));
    expect(screen.queryByRole('textbox', { name: 'Setting name' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Deleted “Colonial”.');
    expect(loadCustomSettings()).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('textbox', { name: 'Setting name' })).toHaveValue('Colonial');
    expect(loadCustomSettings()).toEqual([colonial]);
  });

  it('imports a setting from a file, and refuses one that isn’t', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(editButton());
    const input = screen.getByLabelText('Import…');
    await user.upload(input, new File([JSON.stringify(colonial)], 'colonial.json', { type: 'application/json' }));
    expect(await screen.findByText('Added “Colonial”.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Setting name' })).toHaveValue('Colonial');
    await user.upload(input, new File(['{"not": "a setting"}'], 'other.json', { type: 'application/json' }));
    expect(await screen.findByText('That file isn’t a setting exported from here.')).toBeInTheDocument();
  });
});

const orcish = LANGUAGES.find((def): def is InventedLanguageDef => def.id === 'orcish')!;
const grukk = { ...newLanguage(orcish, new Set()), id: 'my-grukk-abcde', name: 'Grukk' };
const buildButton = () => screen.getByRole('button', { name: 'Build a language of your own…' });

describe('Your own languages', () => {
  it('builds a language from a built-in one, writes in it, and keeps it for next time', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(buildButton());
    expect(screen.getByRole('heading', { name: 'Your languages' })).toHaveFocus();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Start from' }), 'orcish');
    await user.click(screen.getByRole('button', { name: '+ New language' }));
    expect(screen.getByText('Made “New Orcish”.')).toBeInTheDocument();
    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Grukk');
    expect(await screen.findByRole('complementary', { name: 'Samples of Grukk' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Write in Grukk' }));
    expect(buildButton()).toHaveFocus();
    const [saved] = loadCustomLanguages();
    expect(saved.name).toBe('Grukk');
    expect(language()).toHaveValue(`mine/${saved.id}`);
    expect(await paragraphs()).toHaveLength(3);
    expect(screen.getByText(/Words invented in the builder/)).toBeInTheDocument();
    // The link carries the language, so it works for anyone.
    expect(window.location.hash).toMatch(/&made=[\w-]+$/);

    cleanup();
    window.history.replaceState(null, '', '/');
    render(<App />);
    await paragraphs();
    expect(within(screen.getByRole('group', { name: 'Your languages' })).getByRole('option', { name: 'Grukk' })).toBeInTheDocument();
  });

  it('says what’s wrong with a language, and keeps the last version that worked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(buildButton());
    await user.click(screen.getByRole('button', { name: '+ New language' }));
    const vowels = screen.getByRole('textbox', { name: 'Sounds in class V' });
    await user.type(vowels, ' ʘ');
    expect(screen.getByText('Not saved yet: Unknown sound "ʘ"')).toBeInTheDocument();
    expect(loadCustomLanguages()[0].sounds.classes.V).toBe('a e i o u');
    expect(screen.getByText('Samples come back once the language works again.')).toBeInTheDocument();
    await user.type(vowels, '{Backspace}{Backspace}');
    expect(screen.getByText('Saved. Every change is kept as you go.')).toBeInTheDocument();
  });

  it('adds sounds from the palette to the class last typed in', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    await user.click(buildButton());
    await user.click(screen.getByRole('button', { name: '+ New language' }));
    await user.click(screen.getByRole('textbox', { name: 'Sounds in class F' }));
    await user.click(screen.getByText('Sounds to choose from'));
    await user.click(within(screen.getByRole('group', { name: 'Consonants' })).getByRole('button', { name: /^x/ }));
    expect(screen.getByRole('textbox', { name: 'Sounds in class F' })).toHaveValue('n s r l x');
    expect(loadCustomLanguages()[0].sounds.classes.F).toBe('n s r l x');
  });

  it('opens a link that brings a made language, and offers to save it', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/#lang=mine/my-grukk-abcde&made=${encodeLanguages([grukk])}`);
    render(<App />);
    expect(await paragraphs()).toHaveLength(3);
    expect(language()).toHaveValue('mine/my-grukk-abcde');
    expect(banner()).toHaveTextContent('This link brings a language made in the builder: Grukk.');
    await user.click(within(banner()!).getByRole('button', { name: 'Save it here' }));
    expect(banner()).not.toBeInTheDocument();
    expect(loadCustomLanguages()).toEqual([grukk]);
  });

  it('shows a link’s different version of one of your languages, and can save it over yours', async () => {
    const user = userEvent.setup();
    saveCustomLanguages([grukk]);
    const changed = { ...grukk, voicing: 'Growl it.' };
    window.history.replaceState(null, '', `/#lang=mine/my-grukk-abcde&made=${encodeLanguages([changed])}`);
    render(<App />);
    await paragraphs();
    expect(banner()).toHaveTextContent('It’s a different version of one of yours.');
    await user.click(within(banner()!).getByRole('button', { name: 'Save it over yours' }));
    expect(loadCustomLanguages()).toEqual([changed]);
  });

  it('lets a setting of yours use a language of yours', async () => {
    saveCustomLanguages([grukk]);
    saveCustomSettings([sanitizeSetting({ id: 'my-world', name: 'My world', choices: [{ name: 'Orcish tongue', language: 'my-grukk-abcde' }] })!]);
    render(<App />);
    await paragraphs();
    expect(within(screen.getByRole('group', { name: 'My world' })).getByRole('option', { name: 'Orcish tongue (Grukk)' })).toBeInTheDocument();
  });

  it('deletes a language, with a way to undo it, and leaves it out of the menus', async () => {
    const user = userEvent.setup();
    saveCustomLanguages([grukk]);
    render(<App />);
    await paragraphs();
    await user.click(buildButton());
    await user.click(screen.getByRole('button', { name: 'Delete language' }));
    expect(screen.getByText('Deleted “Grukk”.')).toBeInTheDocument();
    expect(loadCustomLanguages()).toEqual([]);
    expect(screen.queryByRole('group', { name: 'Your languages' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(loadCustomLanguages()).toEqual([grukk]);
  });
});

describe('Reading aloud', () => {
  it('shows the text in large type, how to say it first, and closes back to the page', async () => {
    const user = userEvent.setup();
    render(<App />);
    const written = await paragraphs();
    const read = screen.getByRole('button', { name: 'Read aloud' });
    await user.click(read);
    const dialog = screen.getByRole('dialog', { name: 'Elvish' });
    expect(within(dialog).getByRole('radio', { name: 'Say it' })).toBeChecked();
    expect(within(dialog).getByText(/How to say it:/)).toBeInTheDocument();
    const said = within(within(dialog).getByRole('article')).getAllByRole('paragraph').map((p) => p.textContent);
    expect(said).toHaveLength(3);
    expect(said.join(' ')).not.toMatch(/[éèêàçœ«»]/u);

    await user.click(within(dialog).getByRole('radio', { name: 'Written' }));
    expect(within(within(dialog).getByRole('article')).getAllByRole('paragraph').map((p) => p.textContent)).toEqual(written);

    const text = within(dialog).getByRole('article').parentElement!;
    const before = parseFloat(text.style.fontSize);
    await user.click(within(dialog).getByRole('button', { name: 'Larger text' }));
    expect(parseFloat(text.style.fontSize)).toBeGreaterThan(before);

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(read).toHaveFocus();
  });

  it('shows real English as it is, with no views to choose', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/#lang=dnd/common');
    render(<App />);
    await paragraphs();
    await user.click(screen.getByRole('button', { name: 'Read aloud' }));
    const dialog = screen.getByRole('dialog', { name: 'Common' });
    expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
  });
});
