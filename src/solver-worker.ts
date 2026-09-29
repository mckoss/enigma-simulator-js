import { Enigma } from './enigma';
import { Entropy } from './entropy';

self.addEventListener('message', (event: MessageEvent<string>) => {
  const cipher = event.data;
  let best = cipher;
  const machine = new Enigma();
  const entropy = new Entropy(cipher, Entropy.alphaOnly);
  let bestBits = entropy.bitsPerChar();
  for (let i = 0; i < 26 * 26 * 25; i++) {
    const position = [...machine.position];
    const decoded = machine.encode(cipher);
    const bits = entropy.init().addString(decoded).bitsPerChar();
    machine.position = position;
    if (bits < bestBits) {
      bestBits = bits;
      best = `${decoded} (${machine.toString()})`;
    }
    machine.incrementRotors();
  }
  self.postMessage(best);
});
