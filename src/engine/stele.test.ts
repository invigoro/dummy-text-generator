import { describe, expect, it } from 'vitest';
import { forRunes, STELE_MAX_TEXT, STELE_URL, steleLink, trimForStele } from './stele';

/** A link decoded the way Stele decodes its own: base64url, inflate, JSON. */
async function decode(link: string): Promise<Record<string, unknown>> {
  expect(link.startsWith(`${STELE_URL}#s=`)).toBe(true);
  const encoded = link.slice(`${STELE_URL}#s=`.length);
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(await new Response(stream).arrayBuffer()));
}

describe('steleLink', () => {
  it('opens Stele with the text on the medium, marked as edited so it stays', async () => {
    const settings = await decode(await steleLink('Vé lérant, sa doumé.\n\nAi louve.', { medium: 'parchment' }));
    expect(settings).toEqual({
      v: 1,
      medium: 'parchment',
      textEdited: true,
      blocks: [{ kind: 'text', role: 'main', text: 'Vé lérant, sa doumé.\n\nAi louve.' }],
    });
  });

  it('asks for runes, Roman lettering or a font when the language wants them', async () => {
    const settings = await decode(await steleLink('Grundar kath', { medium: 'granite', script: 'elder-futhark', roman: true, font: 'cinzel' }));
    expect(settings.blocks).toEqual([{ kind: 'text', role: 'main', text: 'Grundar kath', script: 'elder-futhark', roman: true, font: 'cinzel' }]);
  });

  it('spells out Old Norse letters for runes, but not for Latin letters', async () => {
    const runes = await decode(await steleLink('Þórr kvað æðr', { medium: 'granite', script: 'younger-futhark' }));
    expect((runes.blocks as { text: string }[])[0].text).toBe('Thórr kvath aethr');
    const letters = await decode(await steleLink('Þórr kvað æðr', { medium: 'granite' }));
    expect((letters.blocks as { text: string }[])[0].text).toBe('Þórr kvað æðr');
  });
});

describe('forRunes', () => {
  it('turns þ, ð, æ and œ into letters the rune tables know', () => {
    expect(forRunes('Þat var þá, ðá Æsir; Œgir')).toBe('That var thá, thá Aesir; Oegir');
  });

  it('drops quotation marks Stele doesn’t', () => {
    expect(forRunes('„Hról“, « oui »')).toBe('Hról“,  oui ');
  });
});

describe('trimForStele', () => {
  it('leaves text that fits alone', () => {
    expect(trimForStele('Short.')).toEqual({ text: 'Short.', trimmed: false });
  });

  it('cuts longer text at the end of a sentence', () => {
    const sentence = 'Lorem ipsum dolor sit amet. ';
    const { text, trimmed } = trimForStele(sentence.repeat(200));
    expect(trimmed).toBe(true);
    expect(text.length).toBeLessThanOrEqual(STELE_MAX_TEXT);
    expect(text.endsWith('amet.')).toBe(true);
  });
});
