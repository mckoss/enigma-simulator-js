import { random } from './random';

export type RotorName = 'I' | 'II' | 'III' | 'IV' | 'V';
export type ReflectorName = 'B' | 'C';
export interface SettingsInput {
  rotors: string[];
  reflector: string;
  position: string[];
  rings: string[];
  plugs: string;
}
export interface Settings extends SettingsInput {
  rotors: RotorName[];
  reflector: ReflectorName;
}
export interface SettingsStrings {
  rotors: string;
  reflector: string;
  position: string;
  rings: string;
  plugs: string;
}
interface Rotor {
  wires: string;
  map: number[];
  reverse: number[];
}
interface Wheel extends Rotor {
  notch: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_A = 'A'.charCodeAt(0);

export function indexFromChar(character: string): number {
  return character.toUpperCase().charCodeAt(0) - CODE_A;
}

export function charFromIndex(index: number): string {
  return String.fromCharCode(index + CODE_A);
}

function rotor(wires: string): Rotor {
  const map: number[] = [];
  const reverse: number[] = [];
  for (let from = 0; from < 26; from++) {
    const to = indexFromChar(wires[from]);
    map[from] = (26 + to - from) % 26;
    reverse[to] = (26 + from - to) % 26;
  }
  return { wires, map, reverse };
}

function wheel(wires: string, notch: string): Wheel {
  return { ...rotor(wires), notch };
}

const ROTORS: Record<RotorName, Wheel> = {
  I: wheel('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'),
  II: wheel('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'),
  III: wheel('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'),
  IV: wheel('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'),
  V: wheel('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'),
};
const REFLECTORS: Record<ReflectorName, Rotor> = {
  B: rotor('YRUHQSLDPXNGOKMIEBFZCWVJAT'),
  C: rotor('FVPJIAOYEDRZXWGCTKUQSBNMHL'),
};

function isRotorName(name: string): name is RotorName {
  return Object.hasOwn(ROTORS, name);
}

function isReflectorName(name: string): name is ReflectorName {
  return Object.hasOwn(REFLECTORS, name);
}

export function settingsFromStrings(state: Partial<SettingsStrings>): Partial<SettingsInput> {
  return {
    ...(state.rotors !== undefined && { rotors: state.rotors.split('-') }),
    ...(state.reflector !== undefined && { reflector: state.reflector }),
    ...(state.position !== undefined && { position: state.position.split('') }),
    ...(state.rings !== undefined && { rings: state.rings.split('') }),
    ...(state.plugs !== undefined && { plugs: state.plugs }),
  };
}

export function stringsFromSettings(settings: Partial<Settings>): Partial<SettingsStrings> {
  return {
    ...(settings.rotors && { rotors: settings.rotors.join('-') }),
    ...(settings.reflector && { reflector: settings.reflector }),
    ...(settings.position && { position: settings.position.join('') }),
    ...(settings.rings && { rings: settings.rings.join('') }),
    ...(settings.plugs !== undefined && { plugs: settings.plugs }),
  };
}

function groupBy(text: string, size: number): string {
  return text.match(new RegExp(`.{1,${size}}`, 'g'))?.join(' ') ?? '';
}

export function groupLetters(text: string): string {
  return groupBy(text.toUpperCase().replace(/[^A-Z]/g, ''), 5);
}

export function settingsFromPasskey(passkey: string): Partial<Settings> {
  random.seed(passkey);
  return {
    rotors: random.sample<RotorName>(['I', 'II', 'III', 'IV', 'V'], 3),
    position: Array.from({ length: 3 }, () => charFromIndex(random.randint(0, 25))),
    rings: Array.from({ length: 3 }, () => charFromIndex(random.randint(0, 25))),
    plugs: groupBy(random.sample(ALPHABET.split(''), 20).join(''), 2),
  };
}

export class Enigma {
  settings: Settings = {
    rotors: ['I', 'II', 'III'],
    reflector: 'B',
    position: ['M', 'C', 'K'],
    rings: ['A', 'A', 'A'],
    plugs: '',
  };
  rotors: Wheel[] = [];
  reflector: Rotor = REFLECTORS.B;
  position: number[] = [];
  rings: number[] = [];
  plugs: number[] = [];
  trace?: (message: string) => void;

  constructor(settings: Partial<SettingsInput> = {}) {
    this.init(settings);
  }

  init(settings: Partial<SettingsInput> = {}): this {
    const candidate: SettingsInput = { ...this.settings, ...settings };
    const rotors = candidate.rotors.map((name) => name.trim().toUpperCase());
    if (rotors.length !== 3 || new Set(rotors).size !== 3 || !rotors.every(isRotorName)) {
      throw new Error('Rotors must be three different names from I through V.');
    }
    const reflector = candidate.reflector.toUpperCase();
    if (!isReflectorName(reflector)) {
      throw new Error('Reflector must be B or C.');
    }
    const position = candidate.position.map((letter) => letter.toUpperCase());
    if (position.length !== 3 || position.some((letter) => !/^[A-Z]$/.test(letter))) {
      throw new Error('Position must be three letters from A through Z.');
    }
    const rings = candidate.rings.map((letter) => letter.toUpperCase());
    if (rings.length !== 3 || rings.some((letter) => !/^[A-Z]$/.test(letter))) {
      throw new Error('Rings must be three letters from A through Z.');
    }
    const plugLetters = candidate.plugs.toUpperCase().replace(/[^A-Z]/g, '');
    if (plugLetters.length % 2 !== 0 || new Set(plugLetters).size !== plugLetters.length) {
      throw new Error('Plugboard must contain pairs of different, unused letters.');
    }

    const plugs = Array.from({ length: 26 }, (_, index) => index);
    for (let i = 0; i < plugLetters.length; i += 2) {
      const from = indexFromChar(plugLetters[i]);
      const to = indexFromChar(plugLetters[i + 1]);
      plugs[from] = to;
      plugs[to] = from;
    }
    this.settings = { ...candidate, rotors, reflector, position, rings, plugs: plugLetters };
    this.rotors = rotors.map((name) => ROTORS[name]);
    this.reflector = REFLECTORS[reflector];
    this.position = position.map(indexFromChar);
    this.rings = rings.map(indexFromChar);
    this.plugs = plugs;
    this.trace?.(`Init: ${this.toString()}`);
    return this;
  }

  stateStrings(): SettingsStrings {
    const plugs: string[] = [];
    for (let i = 0; i < 26; i++) {
      if (i < this.plugs[i]) plugs.push(charFromIndex(i) + charFromIndex(this.plugs[i]));
    }
    return {
      rotors: this.settings.rotors.join('-'),
      reflector: this.settings.reflector,
      position: this.position.map(charFromIndex).join(''),
      rings: this.settings.rings.join(''),
      plugs: plugs.join(' '),
    };
  }

  positionString(): string {
    return this.position.map(charFromIndex).join('');
  }

  toString(): string {
    const state = this.stateStrings();
    return `Enigma Rotors: ${state.rotors} Position: ${state.position}` +
      (state.rings === 'AAA' ? '' : ` Rings: ${state.rings}`) +
      (state.plugs ? ` Plugboard: ${state.plugs}` : '');
  }

  incrementRotors(): void {
    if (this.position[1] === indexFromChar(this.rotors[1].notch)) {
      this.position[0]++;
      this.position[1]++;
    } else if (this.position[2] === indexFromChar(this.rotors[2].notch)) {
      this.position[1]++;
    }
    this.position[2]++;
    this.position = this.position.map((position) => position % 26);
  }

  encodeChar(character: string): string {
    const upper = character.toUpperCase();
    if (upper < 'A' || upper > 'Z') return upper;
    this.incrementRotors();
    let index = this.plugs[indexFromChar(upper)];
    const trace = this.trace ? [indexFromChar(upper), index] : undefined;
    for (let r = 2; r >= 0; r--) {
      const offset = (26 + index + this.position[r] - this.rings[r]) % 26;
      index = (index + this.rotors[r].map[offset]) % 26;
      trace?.push(index);
    }
    index = (index + this.reflector.map[index]) % 26;
    trace?.push(index);
    for (let r = 0; r < 3; r++) {
      const offset = (26 + index + this.position[r] - this.rings[r]) % 26;
      index = (index + this.rotors[r].reverse[offset]) % 26;
      trace?.push(index);
    }
    index = this.plugs[index];
    trace?.push(index);
    if (trace) this.trace?.(`${trace.map(charFromIndex).join('->')} ${this.toString()}`);
    return charFromIndex(index);
  }

  encode(text: string): string {
    return Array.from(text, (character) => this.encodeChar(character)).join('');
  }
}
