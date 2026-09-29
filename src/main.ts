import { charFromIndex, Enigma, groupLetters, settingsFromPasskey, settingsFromStrings, stringsFromSettings } from './enigma';
import { version } from '../package.json';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found as T;
}

const machine = new Enigma();
machine.trace = (message) => console.log(message);
const fields = {
  rotors: element<HTMLInputElement>('rotors'),
  position: element<HTMLInputElement>('position'),
  rings: element<HTMLInputElement>('rings'),
  plugs: element<HTMLInputElement>('plugs'),
  keepSpacing: element<HTMLInputElement>('keep_spacing'),
  plain: element<HTMLTextAreaElement>('plain'),
  key: element<HTMLElement>('key_out'),
  cipher: element<HTMLElement>('cipher_out'),
  copy: element<HTMLButtonElement>('copy-output'),
  passkey: element<HTMLInputElement>('passkey'),
  passkeyInput: element<HTMLInputElement>('passkey-input'),
  error: element<HTMLElement>('settings-error'),
  rotorsDisplay: [1, 2, 3].map((index) => element<HTMLElement>(`rot_${index}`)),
};

const initial = machine.stateStrings();
fields.rotors.value = initial.rotors;
fields.position.value = initial.position;
fields.rings.value = initial.rings;
fields.plugs.value = initial.plugs;
const today = new Date();
fields.passkeyInput.value = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
element<HTMLElement>('app-version').textContent = `v${version}`;

function updateDisplay(): void {
  const plain = fields.plain.value;
  const state = {
    rotors: fields.rotors.value,
    reflector: initial.reflector,
    position: fields.position.value,
    rings: fields.rings.value,
    plugs: fields.plugs.value,
  };
  try {
    machine.init(settingsFromStrings(state));
  } catch (error) {
    fields.error.textContent = error instanceof Error ? error.message : 'Invalid machine settings.';
    return;
  }
  fields.error.textContent = '';
  let cipher = machine.encode(plain);
  let keyOutput = '';
  const repeatedKey = /^([A-Z]{3})\1/i;
  const key = repeatedKey.test(plain) ? plain.slice(0, 3) :
    repeatedKey.test(cipher) ? cipher.slice(0, 3) : '';
  if (key) {
    keyOutput = `${cipher.slice(0, 6)} `;
    machine.init(settingsFromStrings({ ...state, position: key }));
    cipher = machine.encode(plain.slice(6).trim());
  }
  if (!fields.keepSpacing.checked) cipher = groupLetters(cipher);
  fields.key.textContent = keyOutput;
  fields.cipher.textContent = cipher;
  fields.copy.textContent = 'Copy text';
  fields.rotorsDisplay.forEach((display, index) => {
    display.textContent = charFromIndex(machine.position[index]);
  });
}

for (const field of [fields.rotors, fields.position, fields.rings, fields.plugs, fields.plain]) {
  field.addEventListener('input', updateDisplay);
}
fields.keepSpacing.addEventListener('change', updateDisplay);
fields.copy.addEventListener('click', async () => {
  const output = `${fields.key.textContent ?? ''}${fields.cipher.textContent ?? ''}`;
  try {
    await navigator.clipboard.writeText(output);
    fields.copy.textContent = 'Copied';
  } catch {
    fields.copy.textContent = 'Copy failed';
  }
});
fields.passkey.addEventListener('click', () => {
  const passkey = fields.passkeyInput.value.trim();
  if (!passkey) {
    fields.error.textContent = 'Enter a passkey.';
    fields.passkeyInput.focus();
    return;
  }
  const settings = stringsFromSettings(settingsFromPasskey(passkey));
  fields.rotors.value = settings.rotors ?? '';
  fields.position.value = settings.position ?? '';
  fields.rings.value = settings.rings ?? '';
  fields.plugs.value = settings.plugs ?? '';
  updateDisplay();
});
fields.passkeyInput.addEventListener('input', () => {
  if (fields.error.textContent === 'Enter a passkey.') fields.error.textContent = '';
});
fields.passkeyInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    fields.passkey.click();
  }
});

updateDisplay();
fields.plain.focus({ preventScroll: true });
