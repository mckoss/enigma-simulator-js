export type CharacterFilter = (character: string) => string | undefined;

export class Entropy {
  static asciiOnly: CharacterFilter = (character) => character.charCodeAt(0) < 128 ? character : undefined;
  static alphaOnly: CharacterFilter = (character) => {
    const upper = character.toUpperCase();
    return upper >= 'A' && upper <= 'Z' ? upper : undefined;
  };

  private count = 0;
  private histogram = new Map<string, number>();

  constructor(text = '', private readonly filter: CharacterFilter = Entropy.asciiOnly) {
    this.addString(text);
  }

  init(): this {
    this.count = 0;
    this.histogram.clear();
    return this;
  }

  addString(text = ''): this {
    for (const character of text) {
      const filtered = this.filter(character);
      if (filtered === undefined) continue;
      this.histogram.set(filtered, (this.histogram.get(filtered) ?? 0) + 1);
      this.count++;
    }
    return this;
  }

  bitsPerChar(): number {
    let bits = 0;
    for (const count of this.histogram.values()) {
      const probability = count / this.count;
      bits -= probability * Math.log2(probability);
    }
    return bits;
  }
}
