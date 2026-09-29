import { describe, expect, it } from 'vitest';
import { MersenneTwister } from '../../src/mersenne-twister';
import { Random } from '../../src/random';

const seed = [0x123, 0x234, 0x345, 0x456];

describe('Mersenne Twister', () => {
  it('matches reference 32-bit output', () => {
    const expected = [
      1067595299, 955945823, 477289528, 4107218783, 4228976476,
      3344332714, 3355579695, 227628506, 810200273, 2591290167,
      2560260675, 3242736208, 646746669, 1479517882, 4245472273,
    ];
    const generator = new MersenneTwister();
    generator.seedArray(seed);
    expect(expected.map(() => generator.nextInt32())).toEqual(expected);
  });

  it('matches reference real output', () => {
    const expected = [
      0.24856890, 0.22257348, 0.11112763, 0.95628639, 0.98463532,
      0.77866314, 0.78128178, 0.05299889, 0.18863945, 0.60333176,
      0.59610714, 0.75500836, 0.15058244, 0.34447710, 0.98847604,
      0.26621219, 0.89958089, 0.74995262, 0.41295089, 0.26512361,
    ];
    const generator = new MersenneTwister();
    generator.seedArray(seed);
    for (const value of expected) expect(generator.real1()).toBeCloseTo(value, 7);
  });

  it('matches reference 53-bit output', () => {
    const expected = [
      0.2485689015878, 0.1111276295504, 0.9846353141864, 0.7812817771211, 0.1886394515882,
      0.5961071458087, 0.1505824427640, 0.9884760399626, 0.8995808865871, 0.4129508828008,
      0.3310613579726, 0.6658802808137, 0.9021936127785, 0.0168917816510, 0.6054105963840,
      0.6502730486458, 0.1410585423049, 0.1665058342209, 0.3080269246159, 0.3248199587299,
      0.4893466447929, 0.6869515209418, 0.6741796549553, 0.2337834128975, 0.4915619250667,
    ];
    const generator = new MersenneTwister();
    generator.seedArray(seed);
    for (const value of expected) expect(generator.resolution53()).toBeCloseTo(value, 10);
  });
});

describe('Random', () => {
  it('returns values in range', () => {
    const random = new Random();
    for (let i = 0; i < 20; i++) {
      expect(random.random()).toBeGreaterThanOrEqual(0);
      expect(random.random()).toBeLessThanOrEqual(1);
      const integer = random.randint(0, 100);
      expect(Number.isInteger(integer)).toBe(true);
      expect(integer).toBeGreaterThanOrEqual(0);
      expect(integer).toBeLessThanOrEqual(100);
    }
  });

  it('repeats a sequence for the same seed', () => {
    const random = new Random();
    for (const seed of [123, 0.1234, 'hello', new Date(), [123, 456]]) {
      random.seed(seed);
      const sequence = Array.from({ length: 30 }, () => random.random());
      random.seed(seed);
      expect(Array.from({ length: 30 }, () => random.random())).toEqual(sequence);
    }
  });

  it('samples without replacement and shuffles in place', () => {
    const random = new Random();
    const items = [0, 1, 2, 3, 4];
    for (let i = 0; i < 20; i++) {
      const sample = random.sample(items, 5);
      expect(sample).toHaveLength(5);
      expect([...sample].sort()).toEqual([0, 1, 2, 3, 4]);
      expect(random.shuffle(items)).toBe(items);
      expect([...items].sort()).toEqual([0, 1, 2, 3, 4]);
    }
    expect(random.sample(items, 3)).toHaveLength(3);
  });
});
