import { random } from './random';

export type RotorName = 'I' | 'II' | 'III' | 'IV' | 'V';
export type ReflectorName = 'B' | 'C';
export interface Settings {
  rotors: RotorName[];
  reflector: ReflectorName;
  position: string[];
  rings: string[];
  plugs: string;
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
  notch?: string;
  map: number[];
  reverse: number[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_A = 'A'.charCodeAt(0);

export function indexFromChar(character: string): number {
  return character.toUpperCase().charCodeAt(0) - CODE_A;
}

export function charFromIndex(index: number): string {
  return String.fromCharCode(index + CODE_A);
}

function rotor(wires: string, notch?: string): Rotor {
  const map: number[] = [];
  const reverse: number[] = [];
  for (let from = 0; from < 26; from++) {
    const to = indexFromChar(wires[from]);
    map[from] = (26 + to - from) % 26;
    reverse[to] = (26 + from - to) % 26;
  }
  return { wires, notch, map, reverse };
}

const ROTORS: Record<RotorName, Rotor> = {
  I: rotor('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'),
  II: rotor('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'),
  III: rotor('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'),
  IV: rotor('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'),
  V: rotor('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'),
};
const REFLECTORS: Record<ReflectorName, Rotor> = {
  B: rotor('YRUHQSLDPXNGOKMIEBFZCWVJAT'),
  C: rotor('FVPJIAOYEDRZXWGCTKUQSBNMHL'),
};

export function settingsFromStrings(state: Partial<SettingsStrings>): Partial<Settings> {
  return {
    ...(state.rotors && { rotors: state.rotors.split('-') as RotorName[] }),
    ...(state.reflector && { reflector: state.reflector as ReflectorName }),
    ...(state.position && { position: state.position.split('') }),
    ...(state.rings && { rings: state.rings.split('') }),
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
  rotors: Rotor[] = [];
  reflector: Rotor = REFLECTORS.B;
  position: number[] = [];
  rings: number[] = [];
  plugs: number[] = [];
  trace?: (message: string) => void;

  constructor(settings: Partial<Settings> = {}) {
    this.init(settings);
  }

  init(settings: Partial<Settings> = {}): this {
    this.settings = { ...this.settings, ...settings };
    this.rotors = this.settings.rotors.map((name) => ROTORS[name]);
    this.reflector = REFLECTORS[this.settings.reflector];
    this.position = this.settings.position.map(indexFromChar);
    this.rings = this.settings.rings.map(indexFromChar);
    this.settings.plugs = this.settings.plugs.toUpperCase().replace(/[^A-Z]/g, '');
    this.plugs = Array.from({ length: 26 }, (_, index) => index);
    for (let i = 0; i + 1 < this.settings.plugs.length; i += 2) {
      const from = indexFromChar(this.settings.plugs[i]);
      const to = indexFromChar(this.settings.plugs[i + 1]);
      this.plugs[from] = to;
      this.plugs[to] = from;
    }
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
    if (this.position[1] === indexFromChar(this.rotors[1].notch!)) {
      this.position[0]++;
      this.position[1]++;
    } else if (this.position[2] === indexFromChar(this.rotors[2].notch!)) {
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
    const trace = [indexFromChar(upper), index];
    for (let r = 2; r >= 0; r--) {
      const offset = (26 + index + this.position[r] - this.rings[r]) % 26;
      index = (index + this.rotors[r].map[offset]) % 26;
      trace.push(index);
    }
    index = (index + this.reflector.map[index]) % 26;
    trace.push(index);
    for (let r = 0; r < 3; r++) {
      const offset = (26 + index + this.position[r] - this.rings[r]) % 26;
      index = (index + this.rotors[r].reverse[offset]) % 26;
      trace.push(index);
    }
    index = this.plugs[index];
    trace.push(index);
    this.trace?.(`${trace.map(charFromIndex).join('->')} ${this.toString()}`);
    return charFromIndex(index);
  }

  encode(text: string): string {
    return Array.from(text, (character) => this.encodeChar(character)).join('');
  }
}
