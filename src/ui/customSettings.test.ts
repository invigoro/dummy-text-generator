// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  decodeSetting,
  defaultStele,
  encodeSetting,
  loadCustomSettings,
  sameSetting,
  sanitizeSetting,
  saveCustomSettings,
  settingFromLink,
  slug,
  uniqueId,
} from './customSettings';

const colonial = {
  id: 'my-colonial',
  name: 'Colonial world',
  choices: [
    { name: 'Renan', language: 'french' },
    { name: 'Threcian', language: 'english-invented' },
    { name: 'Old Deciman', language: 'latin' },
  ],
};

afterEach(() => localStorage.clear());

describe('slug and uniqueId', () => {
  it('make ids from names', () => {
    expect(slug('Old Deciman')).toBe('old-deciman');
    expect(slug('Élan  vital!')).toBe('elan-vital');
    expect(slug('???')).toBe('language');
  });

  it('number an id that is taken', () => {
    expect(uniqueId('renan', new Set())).toBe('renan');
    expect(uniqueId('renan', new Set(['renan', 'renan-2']))).toBe('renan-3');
  });
});

describe('sanitizeSetting', () => {
  it('keeps a valid setting, giving each language an id and a Stele style', () => {
    const setting = sanitizeSetting(colonial)!;
    expect(setting.name).toBe('Colonial world');
    expect(setting.choices.map((choice) => [choice.id, choice.name, choice.language])).toEqual([
      ['renan', 'Renan', 'french'],
      ['threcian', 'Threcian', 'english-invented'],
      ['old-deciman', 'Old Deciman', 'latin'],
    ]);
    expect(setting.choices[2].stele).toEqual(defaultStele('latin'));
  });

  it('drops unknown languages and bad Stele values', () => {
    const setting = sanitizeSetting({
      name: '  World  ',
      choices: [
        { name: 'Fake', language: 'klingon' },
        { name: 'Stony', language: 'old-norse', stele: { medium: 'lava', script: 'hieroglyphs', roman: 'yes', font: '<script>' } },
      ],
    })!;
    expect(setting.name).toBe('World');
    expect(setting.choices).toHaveLength(1);
    expect(setting.choices[0].stele).toEqual({ medium: defaultStele('old-norse').medium });
  });

  it('names what was left blank, rather than losing it', () => {
    const setting = sanitizeSetting({ name: ' ', choices: [{ name: '', language: 'french' }] })!;
    expect(setting.name).toBe('Untitled setting');
    expect(setting.choices.map((choice) => choice.name)).toEqual(['Unnamed language']);
  });

  it('keeps a language’s id when it has been renamed, so links to it still work', () => {
    const setting = sanitizeSetting({
      name: 'World',
      choices: [
        { id: 'new-language', name: 'Renan', language: 'french' },
        { id: 'new-language', name: 'Soranan', language: 'spanish' },
        { id: 'Not An Id!', name: 'Deciman', language: 'italian' },
      ],
    })!;
    expect(setting.choices.map((choice) => choice.id)).toEqual(['new-language', 'new-language-2', 'deciman']);
  });

  it('refuses things that aren’t settings, and ids that aren’t custom', () => {
    expect(sanitizeSetting(null)).toBeNull();
    expect(sanitizeSetting({ name: 'No languages' })).toBeNull();
    expect(sanitizeSetting({ ...colonial, id: 'dnd' })!.id).toBe('my-colonial-world');
  });
});

describe('storage', () => {
  it('saves and loads settings', () => {
    saveCustomSettings([sanitizeSetting(colonial)!]);
    expect(loadCustomSettings()).toEqual([sanitizeSetting(colonial)]);
  });

  it('copes with nothing saved, or junk', () => {
    expect(loadCustomSettings()).toEqual([]);
    localStorage.setItem('dummy-text:settings', '{not json');
    expect(loadCustomSettings()).toEqual([]);
  });

  it('gives settings with the same id different ones', () => {
    const setting = sanitizeSetting(colonial)!;
    saveCustomSettings([setting, setting]);
    expect(loadCustomSettings().map((s) => s.id)).toEqual(['my-colonial', 'my-colonial-2']);
  });
});

describe('encodeSetting and decodeSetting', () => {
  it('round-trip a setting, names with accents included', () => {
    const setting = sanitizeSetting({ ...colonial, name: 'Côte d’Or' })!;
    const encoded = encodeSetting(setting);
    expect(encoded).toMatch(/^[\w-]+$/);
    expect(decodeSetting(encoded)).toEqual(setting);
  });

  it('refuse junk', () => {
    expect(decodeSetting('not base64!!')).toBeNull();
    expect(decodeSetting(btoa('{"name": 3}'))).toBeNull();
  });

  it('leave out Stele styles that are the default, to keep links short', () => {
    const setting = sanitizeSetting({
      ...colonial,
      choices: [...colonial.choices, { name: 'Runic', language: 'french', stele: { medium: 'granite', script: 'elder-futhark' } }],
    })!;
    const json = new TextDecoder().decode(Uint8Array.from(atob(encodeSetting(setting).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
    expect(JSON.parse(json).choices.map((choice: { stele?: unknown }) => choice.stele)).toEqual([
      undefined,
      undefined,
      undefined,
      { medium: 'granite', script: 'elder-futhark' },
    ]);
    expect(decodeSetting(encodeSetting(setting))).toEqual(setting);
  });
});

describe('settingFromLink', () => {
  const setting = sanitizeSetting(colonial)!;
  const world = encodeSetting(setting);

  it('brings a setting that isn’t saved here', () => {
    const link = settingFromLink(world, []);
    expect(link.setting).toEqual(setting);
    expect(link.choice('my-colonial/renan')).toBe('my-colonial/renan');
  });

  it('finds one saved already, even under another id', () => {
    const link = settingFromLink(world, [{ ...setting, id: 'my-colonial-2' }]);
    expect(link.setting).toBeNull();
    expect(link.choice('my-colonial/renan')).toBe('my-colonial-2/renan');
  });

  it('gives a different setting with the same id as one saved an id of its own', () => {
    const link = settingFromLink(world, [sanitizeSetting({ ...colonial, name: 'Mine' })!]);
    expect(link.setting).toEqual({ ...setting, id: 'my-colonial-2' });
    expect(link.choice('my-colonial/renan')).toBe('my-colonial-2/renan');
    expect(link.choice('dnd/elvish')).toBe('dnd/elvish');
  });

  it('brings nothing from a link without one, or with a broken one', () => {
    expect(settingFromLink(undefined, []).setting).toBeNull();
    expect(settingFromLink('junk', []).setting).toBeNull();
  });
});

describe('sameSetting', () => {
  it('compares names and languages, not ids', () => {
    const setting = sanitizeSetting(colonial)!;
    expect(sameSetting(setting, { ...setting, id: 'my-other' })).toBe(true);
    expect(sameSetting(setting, { ...setting, name: 'Other' })).toBe(false);
  });

  it('sees past spacing and the order of keys', () => {
    const setting = sanitizeSetting(colonial)!;
    const [first, ...rest] = setting.choices;
    const reordered = { stele: first.stele, language: first.language, name: ` ${first.name}  `, id: first.id };
    expect(sameSetting(setting, { ...setting, choices: [reordered, ...rest] })).toBe(true);
  });
});
