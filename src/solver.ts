import { Enigma, settingsFromStrings } from './enigma';
import { version } from '../package.json';
import type { RotorCandidate, RotorSearchMessage, RotorSearchRequest } from './solver-types';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found as T;
}

const input = element<HTMLTextAreaElement>('text_input');
const searchRotors = element<HTMLInputElement>('search-rotors');
const searchAllOrders = element<HTMLInputElement>('search-all-orders');
const searchReflector = element<HTMLSelectElement>('search-reflector');
const searchRings = element<HTMLInputElement>('search-rings');
const searchPlugs = element<HTMLInputElement>('search-plugs');
const searchError = element<HTMLElement>('search-error');
const solve = element<HTMLInputElement>('solve');
const output = element<HTMLElement>('solver-output');
const summary = element<HTMLElement>('entropy-summary');
const cipherEntropy = element<HTMLElement>('cipher-entropy');
const bestEntropy = element<HTMLElement>('best-entropy');
const randomEntropy = element<HTMLElement>('random-entropy');
const comparison = element<HTMLElement>('entropy-comparison');
const candidates = element<HTMLElement>('candidates');
const candidateList = element<HTMLOListElement>('candidate-list');
const worker = new Worker(new URL('./solver-worker.ts', import.meta.url), { type: 'module' });

element<HTMLElement>('app-version').textContent = `v${version}`;
searchAllOrders.addEventListener('change', () => {
  searchRotors.disabled = searchAllOrders.checked;
});

function score(bits: number): string {
  return bits.toFixed(2);
}

function candidateRow(candidate: RotorCandidate): HTMLLIElement {
  const row = document.createElement('li');
  const heading = document.createElement('div');
  heading.className = 'candidate-heading';
  const setting = document.createElement('span');
  setting.className = 'candidate-setting';
  const rotorsLabel = document.createElement('span');
  rotorsLabel.className = 'candidate-label';
  rotorsLabel.textContent = 'Rotors';
  const rotors = document.createElement('strong');
  rotors.className = 'candidate-rotors';
  rotors.textContent = candidate.rotors;
  const positionLabel = document.createElement('span');
  positionLabel.className = 'candidate-label';
  positionLabel.textContent = 'Rotor start';
  const position = document.createElement('strong');
  position.className = 'candidate-position';
  position.textContent = candidate.position;
  setting.append(rotorsLabel, rotors, positionLabel, position);
  const entropy = document.createElement('span');
  entropy.className = 'candidate-score';
  entropy.textContent = `${score(candidate.entropy)} bits / letter`;
  heading.append(setting, entropy);
  const preview = document.createElement('p');
  preview.className = 'candidate-preview';
  preview.textContent = candidate.text.slice(0, 90) + (candidate.text.length > 90 ? '…' : '');
  row.append(heading, preview);
  return row;
}

solve.addEventListener('click', () => {
  const request: RotorSearchRequest = {
    cipher: input.value,
    rotors: searchRotors.value.trim().toUpperCase(),
    allOrders: searchAllOrders.checked,
    reflector: searchReflector.value,
    rings: searchRings.value.trim().toUpperCase(),
    plugs: searchPlugs.value.trim().toUpperCase(),
  };
  try {
    new Enigma(settingsFromStrings({
      rotors: request.allOrders ? 'I-II-III' : request.rotors,
      reflector: request.reflector,
      position: 'AAA',
      rings: request.rings,
      plugs: request.plugs,
    }));
  } catch (error) {
    searchError.textContent = error instanceof Error ? error.message : String(error);
    return;
  }
  searchError.textContent = '';
  solve.disabled = true;
  output.textContent = 'Searching rotor settings…';
  summary.hidden = true;
  candidates.hidden = true;
  worker.postMessage(request);
});
worker.addEventListener('message', (event: MessageEvent<RotorSearchMessage>) => {
  const message = event.data;
  if (message.kind === 'progress') {
    output.textContent = `Searching rotor settings… ${message.completedOrders} of ${message.totalOrders} rotor orders checked.`;
    return;
  }
  solve.disabled = false;
  if (message.kind === 'error') {
    output.textContent = `Search error: ${message.message}`;
    return;
  }
  const result = message.result;
  const best = result.candidates[0];
  if (!best) {
    output.textContent = 'Enter a coded message with letters to search.';
    return;
  }

  output.textContent = `${best.text}\n${best.description}`;
  cipherEntropy.textContent = score(result.cipherEntropy);
  bestEntropy.textContent = score(best.entropy);
  randomEntropy.textContent = score(result.randomEntropy);
  const difference = best.entropy - result.randomEntropy;
  const relation = difference === 0 ? 'the same as'
    : `${score(Math.abs(difference))} bits per letter ${difference < 0 ? 'below' : 'above'}`;
  const shortSample = result.letterCount < 100
    ? ' This short sample can rank nonsense first; try about 100 or more letters.'
    : '';
  comparison.textContent = `${result.letterCount} letters analyzed across ${result.searchedSettings.toLocaleString()} settings. The best guess is ${relation} the same-length random expectation.${shortSample} A low score alone does not prove a readable decode.`;
  candidateList.replaceChildren(...result.candidates.map(candidateRow));
  summary.hidden = false;
  candidates.hidden = false;
});
worker.addEventListener('error', (event) => {
  output.textContent = `Worker error: ${event.message}`;
  solve.disabled = false;
});
input.focus({ preventScroll: true });
