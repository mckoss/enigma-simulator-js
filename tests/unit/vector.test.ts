import { expect, it } from 'vitest';
import { append, copy, equal } from '../../src/vector';

it('copies and appends vectors', () => {
  const original = [1, 2, 3];
  const copied = copy(original);
  expect(equal(original, copied)).toBe(true);
  expect(copied).not.toBe(original);
  expect(append(original, copied, [7, 8, 9])).toEqual([1, 2, 3, 1, 2, 3, 7, 8, 9]);
});
