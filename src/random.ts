import { MersenneTwister } from './mersenne-twister';

export type Seed = string | number | Date | readonly number[];

export class Random {
  private readonly generator = new MersenneTwister();

  constructor(seed: Seed = new Date()) {
    this.seed(seed);
  }

  seed(value: Seed = new Date()): void {
    if (value instanceof Date) value = value.getTime();
    if (typeof value === 'number') this.generator.seed(value);
    else if (typeof value === 'string') this.generator.seedArray(Array.from(value || '\0', (char) => char.charCodeAt(0)));
    else this.generator.seedArray(value);
  }

  random(): number {
    return this.generator.real1();
  }

  randint(min: number, max: number): number {
    return Math.floor(min + (max - min + 1) * this.generator.real2());
  }

  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const result: T[] = [];
    for (let i = 0; i < Math.min(count, items.length); i++) {
      const j = this.randint(0, pool.length - i - 1);
      result.push(pool[j]);
      pool[j] = pool[pool.length - i - 1];
    }
    return result;
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.randint(0, i);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}

export const random = new Random();
