export function append<T>(...vectors: readonly (readonly T[])[]): T[] {
  return vectors.flatMap((vector) => [...vector]);
}

export function copy<T>(vector: readonly T[]): T[] {
  return [...vector];
}

export function equal<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
