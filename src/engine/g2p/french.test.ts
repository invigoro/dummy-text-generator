import { describe, expect, it } from 'vitest';
import { pronounceFrench } from './french';

/** A word's sounds with a dot between syllables and a space between the parts of a hyphenated word. */
const said = (word: string) =>
  pronounceFrench(word)
    .map((part) => part.syllables.map((syllable) => [...syllable.onset, syllable.nucleus, ...syllable.coda].join('')).join('.'))
    .join(' ');

describe('pronounceFrench', () => {
  it.each([
    // Vowels written together
    ['château', 'ʃa.to'],
    ['beaucoup', 'bo.ku'],
    ['maison', 'mɛ.zɔ̃'],
    ['oiseau', 'wa.zo'],
    ['trois', 'tʁwa'],
    ['peur', 'pœʁ'],
    ['heure', 'œʁ'],
    ['peu', 'pø'],
    ['deux', 'dø'],
    ['oui', 'wi'],
    ['lui', 'lɥi'],
    // Nasal vowels, and vowels that stay plain before a doubled n or m
    ['enfant', 'ɑ̃.fɑ̃'],
    ['chambre', 'ʃɑ̃bʁ'],
    ['vin', 'vɛ̃'],
    ['bien', 'bjɛ̃'],
    ['loin', 'lwɛ̃'],
    ['bon', 'bɔ̃'],
    ['bonne', 'bɔn'],
    ['un', 'œ̃'],
    ['science', 'sjɑ̃s'],
    // e: silent at the end, "eh" before two consonants, a schwa in an open syllable
    ['petit', 'pə.ti'],
    ['belle', 'bɛl'],
    ['porte', 'pɔʁt'],
    ['rose', 'ʁoz'],
    ['exemple', 'ɛg.zɑ̃pl'],
    ['le', 'lə'],
    ['que', 'kə'],
    // Endings
    ['parler', 'paʁ.le'],
    ['mer', 'mɛʁ'],
    ['parlent', 'paʁl'],
    ['étaient', 'e.tɛ'],
    ['moment', 'mo.mɑ̃'],
    ['vent', 'vɑ̃'],
    ['pied', 'pje'],
    ['blanc', 'blɑ̃'],
    ['voix', 'vwa'],
    ['ouvert', 'u.vɛʁ'],
    ['reflets', 'ʁə.flɛ'],
    ['partie', 'paʁ.ti'],
    ['rue', 'ʁy'],
    ['étudient', 'e.ty.di'],
    ['eh', 'ɛ'],
    // Consonants
    ['garçon', 'gaʁ.sɔ̃'],
    ['manger', 'mɑ̃.ʒe'],
    ['mangeait', 'mɑ̃.ʒɛ'],
    ['gens', 'ʒɑ̃'],
    ['guerre', 'gɛʁ'],
    ['qui', 'ki'],
    ['nation', 'na.sjɔ̃'],
    ['question', 'kɛs.tjɔ̃'],
    // ill
    ['fille', 'fij'],
    ['travail', 'tʁa.vaj'],
    ['soleil', 'so.lɛj'],
    ['feuille', 'fœj'],
    // Words the rules would get wrong
    ['les', 'le'],
    ['est', 'ɛ'],
    ['et', 'e'],
    ['femme', 'fam'],
    ['monsieur', 'mə.sjø'],
    ['Athos', 'a.tos'],
  ])('says “%s” as /%s/', (word, sounds) => {
    expect(said(word)).toBe(sounds);
  });

  it('joins an elided word to the next', () => {
    expect(said('l’homme')).toBe('lɔm');
    expect(said("qu'il")).toBe('kil');
    expect(said('d’Artagnan')).toBe('daʁ.ta.ɲɑ̃');
    expect(said('jusqu’à')).toBe('ʒys.ka');
  });

  it('keeps a word that has an apostrophe of its own whole', () => {
    expect(said('aujourd’hui')).toBe('o.ʒuʁ.dɥi');
  });

  it('says each part of a hyphenated word, joining a part without a vowel to its neighbour', () => {
    expect(said('peut-être')).toBe('pø ɛtʁ');
    expect(said('a-t-il')).toBe('a til');
  });

  it('reads the M. of M. de Tréville as monsieur', () => {
    expect(said('M')).toBe('mə.sjø');
  });

  it('leaves stress to the phrase', () => {
    expect(pronounceFrench('château').every((part) => part.stress === null)).toBe(true);
  });
});
