// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import html from '../../copyright/index.html?raw';

const page = new DOMParser().parseFromString(html, 'text/html');

describe('the copyright page', () => {
  it('gives an address for takedown requests, shown as it is linked', () => {
    const contact = page.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
    expect(contact).not.toBeNull();
    expect(contact!.getAttribute('href')).toBe(`mailto:${contact!.textContent}`);
    expect(contact!.textContent).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  it('points to where the source texts came from, and back to the app', () => {
    expect(page.querySelector('a[href$="/SOURCES.md"]')).not.toBeNull();
    expect(page.querySelector('a[href="../"]')).not.toBeNull();
  });
});
