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

  get sampleSize(): number {
    return this.count;
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

// Expected empirical entropy of uniformly random A–Z text with this many letters.
// The finite-sample correction matters most for short messages.
export function expectedRandomEntropy(sampleSize: number): number {
  if (sampleSize <= 1) return 0;
  const alphabetSize = 26;
  if (sampleSize > 1000) {
    return Math.log2(alphabetSize) - (alphabetSize - 1) / (2 * sampleSize * Math.LN2);
  }

  const probability = 1 / alphabetSize;
  const complement = 1 - probability;
  let binomial = complement ** sampleSize;
  let weightedCount = 0;
  for (let count = 1; count <= sampleSize; count++) {
    binomial *= ((sampleSize - count + 1) / count) * (probability / complement);
    weightedCount += binomial * count * Math.log2(count);
  }
  return Math.log2(sampleSize) - alphabetSize * weightedCount / sampleSize;
}
