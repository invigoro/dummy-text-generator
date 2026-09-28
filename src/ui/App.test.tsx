// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
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
});
afterEach(cleanup);

/** The generated paragraphs, once the text has loaded. */
async function paragraphs() {
  const page = await screen.findByRole('article');
  return within(page)
    .getAllByRole('paragraph')
    .map((paragraph) => paragraph.textContent ?? '');
}

describe('App', () => {
  it('shows the site name and where the text comes from', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dummy Text Generator' })).toBeInTheDocument();
    expect(await screen.findByText('Treasure Island')).toBeInTheDocument();
  });

  it('starts with three paragraphs of shuffled sentences', async () => {
    render(<App />);
    expect(await paragraphs()).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /Shuffle sentences/ })).toBeChecked();
    expect(screen.getByText(/^[\d,]+ words$/)).toBeInTheDocument();
  });

  it('gives as many paragraphs as asked for', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    const count = screen.getByRole('spinbutton', { name: 'Number of paragraphs' });
    await user.clear(count);
    await user.type(count, '5');
    expect(await paragraphs()).toHaveLength(5);
  });

  it('caps the count at the most it allows', async () => {
    const user = userEvent.setup();
    render(<App />);
    await paragraphs();
    const count = screen.getByRole('spinbutton', { name: 'Number of paragraphs' });
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
    await user.click(screen.getByRole('radio', { name: /Shuffle words/ }));
    expect(await paragraphs()).not.toEqual(before);
  });

  it('rerolls to new text', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = await paragraphs();
    await user.click(screen.getByRole('button', { name: /Reroll/ }));
    expect(await paragraphs()).not.toEqual(before);
  });

  it('copies the text, with a blank line between paragraphs', async () => {
    const user = userEvent.setup();
    render(<App />);
    const shown = await paragraphs();
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe(shown.join('\n\n'));
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
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
