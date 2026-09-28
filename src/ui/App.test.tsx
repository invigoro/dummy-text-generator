// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Seeds come in a fixed sequence, so every run shows the same text.
let nextSeed = 1;
vi.mock('../engine/rng', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../engine/rng')>()),
  randomSeed: () => nextSeed++,
}));

beforeEach(() => {
  nextSeed = 1;
  window.history.replaceState(null, '', '/');
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
