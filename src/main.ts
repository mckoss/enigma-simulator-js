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
  passkey: element<HTMLInputElement>('passkey'),
  error: element<HTMLElement>('settings-error'),
  rotorsDisplay: [1, 2, 3].map((index) => element<HTMLElement>(`rot_${index}`)),
};

const initial = machine.stateStrings();
fields.rotors.value = initial.rotors;
fields.position.value = initial.position;
fields.rings.value = initial.rings;
fields.plugs.value = initial.plugs;
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
  fields.rotorsDisplay.forEach((display, index) => {
    display.textContent = charFromIndex(machine.position[index]);
  });
}

for (const field of [fields.rotors, fields.position, fields.rings, fields.plugs, fields.plain]) {
  field.addEventListener('input', updateDisplay);
}
fields.keepSpacing.addEventListener('change', updateDisplay);
fields.passkey.addEventListener('click', () => {
  const today = new Date();
  const defaultKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const passkey = prompt('Enter passkey to set initial Enigma settings.', defaultKey);
  if (!passkey) return;
  const settings = stringsFromSettings(settingsFromPasskey(passkey));
  fields.rotors.value = settings.rotors ?? '';
  fields.position.value = settings.position ?? '';
  fields.rings.value = settings.rings ?? '';
  fields.plugs.value = settings.plugs ?? '';
  updateDisplay();
});

updateDisplay();
fields.plain.focus();
