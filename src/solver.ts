import { version } from '../package.json';

document.getElementById('app-version')!.textContent = `v${version}`;
const input = document.getElementById('text_input') as HTMLTextAreaElement;
const solve = document.getElementById('solve') as HTMLInputElement;
const output = document.getElementById('solver-output') as HTMLElement;
const worker = new Worker(new URL('./solver-worker.ts', import.meta.url), { type: 'module' });

solve.addEventListener('click', () => {
  solve.disabled = true;
  output.textContent = 'Searching rotor positions…';
  worker.postMessage(input.value);
});
worker.addEventListener('message', (event: MessageEvent<string>) => {
  output.textContent = event.data;
  solve.disabled = false;
});
worker.addEventListener('error', (event) => {
  output.textContent = `Worker error: ${event.message}`;
  solve.disabled = false;
});
input.focus({ preventScroll: true });
