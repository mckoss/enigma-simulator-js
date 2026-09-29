import { charFromIndex, Enigma, settingsFromStrings, type RotorName } from './enigma';
import { Entropy, expectedRandomEntropy } from './entropy';
import type { RotorCandidate, RotorSearchMessage, RotorSearchRequest, RotorSearchResult } from './solver-types';

const TOP_CANDIDATES = 10;
const ALPHABET_SIZE = 26;
const START_COUNT = ALPHABET_SIZE ** 3;
const ROTOR_NAMES: RotorName[] = ['I', 'II', 'III', 'IV', 'V'];

function rotorOrders(): RotorName[][] {
  const orders: RotorName[][] = [];
  for (const left of ROTOR_NAMES) {
    for (const middle of ROTOR_NAMES) {
      if (middle === left) continue;
      for (const right of ROTOR_NAMES) {
        if (right !== left && right !== middle) orders.push([left, middle, right]);
      }
    }
  }
  return orders;
}

function compareCandidates(a: RotorCandidate, b: RotorCandidate): number {
  return a.entropy - b.entropy || a.rotors.localeCompare(b.rotors) || a.position.localeCompare(b.position);
}

function search(request: RotorSearchRequest): RotorSearchResult {
  const input = new Entropy(request.cipher, Entropy.alphaOnly);
  const result: RotorSearchResult = {
    letterCount: input.sampleSize,
    cipherEntropy: input.bitsPerChar(),
    randomEntropy: expectedRandomEntropy(input.sampleSize),
    searchedSettings: 0,
    candidates: [],
  };
  if (result.letterCount === 0) return result;

  const orders = request.allOrders ? rotorOrders() : [request.rotors.split('-') as RotorName[]];
  const entropy = new Entropy('', Entropy.alphaOnly);
  for (const [orderIndex, order] of orders.entries()) {
    const rotors = order.join('-');
    const machine = new Enigma(settingsFromStrings({
      rotors,
      reflector: request.reflector,
      position: 'AAA',
      rings: request.rings,
      plugs: request.plugs,
    }));
    for (let start = 0; start < START_COUNT; start++) {
      const initialPosition = [
        Math.floor(start / (ALPHABET_SIZE ** 2)),
        Math.floor(start / ALPHABET_SIZE) % ALPHABET_SIZE,
        start % ALPHABET_SIZE,
      ];
      const position = initialPosition.map(charFromIndex).join('');
      machine.position = initialPosition;
      const decoded = machine.encode(request.cipher);
      const bits = entropy.init().addString(decoded).bitsPerChar();
      const last = result.candidates.at(-1);
      if (result.candidates.length < TOP_CANDIDATES ||
          (last && (bits < last.entropy ||
            (bits === last.entropy && `${rotors}${position}` < `${last.rotors}${last.position}`)))) {
        machine.position = initialPosition;
        const candidate: RotorCandidate = {
          rotors, position, text: decoded, entropy: bits, description: `${machine.toString()} Reflector: ${request.reflector}`,
        };
        result.candidates.push(candidate);
        result.candidates.sort(compareCandidates);
        if (result.candidates.length > TOP_CANDIDATES) result.candidates.pop();
      }
    }
    self.postMessage({ kind: 'progress', completedOrders: orderIndex + 1, totalOrders: orders.length } satisfies RotorSearchMessage);
  }
  result.searchedSettings = orders.length * START_COUNT;
  return result;
}

self.addEventListener('message', (event: MessageEvent<RotorSearchRequest>) => {
  try {
    self.postMessage({ kind: 'result', result: search(event.data) } satisfies RotorSearchMessage);
  } catch (error) {
    self.postMessage({ kind: 'error', message: error instanceof Error ? error.message : String(error) } satisfies RotorSearchMessage);
  }
});
