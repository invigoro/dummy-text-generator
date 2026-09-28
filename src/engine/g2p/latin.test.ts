import { describe, expect, it } from 'vitest';
import { LATIN_SAY } from '../../data/languages/latin';
import { respeller } from '../respell';
import { pronounceLatin, syllabify } from './latin';

const { say, ipa } = respeller(LATIN_SAY);
const said = (word: string) => {
  const sounds = pronounceLatin(word);
  return say(sounds, sounds.syllables.length > 1 ? sounds.stress : null);
};

describe('pronounceLatin', () => {
  it('says lorem ipsum the way English readers of Latin do', () => {
    expect(['lorem', 'ipsum', 'dolor', 'sit', 'amet'].map(said)).toEqual(['LOH-rem', 'IP-sum', 'DOH-lor', 'sit', 'AH-met']);
    expect(said('consectetur')).toBe('kon-SEK-tay-tur');
    expect(said('adipiscing')).toBe('ah-dee-PIS-king');
  });

  it('reads qu, x, v, ae and consonant i', () => {
    expect(said('quia')).toBe('KWEE-ah');
    expect(said('exercitationem')).toBe('ek-ser-kee-tah-TEE-oh-nem');
    expect(said('voluptate')).toBe('woh-LUP-tah-tay');
    expect(said('Caesar')).toBe('KY-sahr');
    expect(said('eius')).toBe('AY-yus');
    expect(said('iam')).toBe('yahm');
  });

  it('keeps gu together after n, and tr, pl together at the start of a syllable', () => {
    expect(ipa(pronounceLatin('sanguis'), 0)).toBe('ˈsan.gwis');
    expect(ipa(pronounceLatin('patrem'), 0)).toBe('ˈpa.trem');
  });

  it('stresses a heavy second-to-last syllable, otherwise the one before', () => {
    expect(pronounceLatin('fortissimus').stress).toBe(1);
    expect(pronounceLatin('dominus').stress).toBe(0);
  });
});

describe('syllabify', () => {
  it('copes with a "word" without vowels', () => {
    expect(syllabify(['s', 't'])).toEqual([{ onset: ['s', 't'], nucleus: 'ə', coda: [] }]);
  });
});
