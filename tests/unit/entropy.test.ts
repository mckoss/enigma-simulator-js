import { describe, expect, it } from 'vitest';
import { Entropy, expectedRandomEntropy } from '../../src/entropy';
import { Enigma } from '../../src/enigma';

describe('Entropy', () => {
  it('calculates bits per character', () => {
    const samples: [string, number][] = [
      ['', 0], ['a', 0], ['aaaa', 0], ['ab', 1], ['abcd', 2], ['aA', 1],
    ];
    const entropy = new Entropy();
    for (const [text, expected] of samples) {
      expect(entropy.init().addString(text).bitsPerChar()).toBe(expected);
    }
    expect(new Entropy('aA', Entropy.alphaOnly).bitsPerChar()).toBe(0);
  });

  it('compares with expected entropy for random text of the same length', () => {
    expect(expectedRandomEntropy(0)).toBe(0);
    expect(expectedRandomEntropy(1)).toBe(0);
    expect(expectedRandomEntropy(2)).toBeCloseTo(25 / 26);
    expect(expectedRandomEntropy(100)).toBeGreaterThan(expectedRandomEntropy(2));
    expect(expectedRandomEntropy(100)).toBeLessThan(Math.log2(26));
    expect(expectedRandomEntropy(2000)).toBeGreaterThan(4.68);
    expect(expectedRandomEntropy(2000)).toBeLessThan(Math.log2(26));
  });

  it('finds encrypted text more entropic at successive positions', () => {
    const machine = new Enigma();
    const plain = 'This is the test message - it should have a low entropy compared to ramdom text.';
    const entropy = new Entropy(plain, Entropy.alphaOnly);
    const plainBits = entropy.bitsPerChar();
    for (let i = 0; i < 1000; i++) {
      const position = [...machine.position];
      const cipher = machine.encode(plain);
      expect(entropy.init().addString(cipher).bitsPerChar()).toBeGreaterThan(plainBits);
      machine.position = position;
      machine.incrementRotors();
    }
  });
});
