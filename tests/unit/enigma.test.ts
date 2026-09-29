import { describe, expect, it } from 'vitest';
import { Enigma, groupLetters, settingsFromPasskey, settingsFromStrings } from '../../src/enigma';

describe('Enigma', () => {
  it('encodes reciprocally', () => {
    const machine = new Enigma();
    const cipher = machine.encode('plain text');
    machine.init();
    expect(machine.encode(cipher)).toBe('PLAIN TEXT');
  });

  it('matches the sample messages', () => {
    const machine = new Enigma();
    const examples = [
      ['ENIGMA REVEALED', 'QMJIDO MZWZJFJR'],
      ['QMJIDO PQDPSRJLCV', 'ENIGMA AUFGEDECKT'],
    ];
    for (const [plain, cipher] of examples) {
      expect(machine.encode(plain)).toBe(cipher);
      machine.init();
      expect(machine.encode(cipher)).toBe(plain);
      machine.init();
    }
  });

  it('turns the rotors at the notch', () => {
    const machine = new Enigma();
    machine.init({ position: ['A', 'D', 'V'] });
    expect(machine.toString()).toBe('Enigma Rotors: I-II-III Position: ADV');
    expect(machine.encode('A')).toBe('Q');
    expect(machine.positionString()).toBe('AEW');
    expect(machine.encode('A')).toBe('I');
    expect(machine.positionString()).toBe('BFX');
    expect(machine.encode('A')).toBe('B');
    expect(machine.positionString()).toBe('BFY');
    machine.init();
    expect(machine.encode('AA')).toBe('QI');
    expect(machine.positionString()).toBe('BFX');
  });

  it('uses ring settings', () => {
    const machine = new Enigma();
    machine.init({ position: ['A', 'A', 'A'] });
    expect(machine.toString()).toBe('Enigma Rotors: I-II-III Position: AAA');
    expect(machine.encode('AAA')).toBe('BDZ');
    machine.init({ rings: ['A', 'A', 'B'] });
    expect(machine.toString()).toBe('Enigma Rotors: I-II-III Position: AAA Rings: AAB');
    expect(machine.encode('AAA')).toBe('UBD');
    machine.init({ position: ['A', 'A', 'U'] });
    expect(machine.encode('AAA')).toBe('BTU');
  });

  it('uses plugboard settings', () => {
    const machine = new Enigma();
    machine.init({ plugs: 'AB CD E-F' });
    expect(machine.toString()).toBe('Enigma Rotors: I-II-III Position: MCK Plugboard: AB CD EF');
    const cipher = machine.encode('ABCDEF');
    machine.init();
    expect(machine.encode(cipher)).toBe('ABCDEF');
    machine.init(settingsFromStrings({ plugs: '' }));
    expect(machine.stateStrings().plugs).toBe('');
  });

  it('converts settings to and from strings', () => {
    const machine = new Enigma();
    expect(machine.stateStrings()).toEqual({
      rotors: 'I-II-III', reflector: 'B', position: 'MCK', rings: 'AAA', plugs: '',
    });
    machine.init(settingsFromStrings({
      rotors: 'III-II-I', reflector: 'C', rings: 'XYZ', position: 'UVW', plugs: 'AB CD',
    }));
    expect(machine.toString()).toBe('Enigma Rotors: III-II-I Position: UVW Rings: XYZ Plugboard: AB CD');
  });

  it('groups only letters', () => {
    expect(groupLetters('a')).toBe('A');
    expect(groupLetters('aaaaa')).toBe('AAAAA');
    expect(groupLetters('aaaaaa')).toBe('AAAAA A');
    expect(groupLetters('aaaaaaaaaaaaaa')).toBe('AAAAA AAAAA AAAA');
  });

  it('derives three rotors, positions, and rings from a passkey', () => {
    const settings = settingsFromPasskey('');
    expect(settings.rotors).toHaveLength(3);
    expect(settings.position).toHaveLength(3);
    expect(settings.rings).toHaveLength(3);
    expect(settingsFromPasskey('test')).toEqual(settingsFromPasskey('test'));
  });

  it('repeats rotor positions after the original cycle length', () => {
    const machine = new Enigma();
    const start = machine.positionString();
    let count = 0;
    do {
      machine.incrementRotors();
      count++;
    } while (machine.positionString() !== start && count <= 26 * 26 * 26);
    expect(count).toBe(26 * 26 * 25);
  });
});
