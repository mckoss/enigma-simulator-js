import { expect, test } from '@playwright/test';
import { Enigma } from '../../src/enigma';

test('encodes the sample message and responds to settings', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#cipher_out')).toHaveText('ENIGMA REVEALED');
  await expect(page.locator('#rotors')).toHaveValue('I-II-III');
  await expect(page.locator('#position')).toHaveValue('MCK');
  await expect(page.locator('#app-version')).toContainText(/^v\d+\.\d+\.\d+$/);

  await page.locator('#plain').fill('HELLO WORLD!');
  await expect(page.locator('#cipher_out')).not.toBeEmpty();
  const spaced = await page.locator('#cipher_out').textContent();
  await page.locator('#keep_spacing').uncheck();
  await expect(page.locator('#cipher_out')).not.toHaveText(spaced ?? '');
  await expect(page.locator('#cipher_out')).toContainText(/^[A-Z]{5} [A-Z]+$/);
  await page.locator('#plugs').fill('AB');
  const withPlug = await page.locator('#cipher_out').textContent();
  await page.locator('#plugs').fill('');
  await expect(page.locator('#cipher_out')).not.toHaveText(withPlug ?? '');
});

test('sets repeatable machine settings from an inline passkey', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#passkey-input')).toHaveValue(/^\d{4}-\d{1,2}-\d{1,2}$/);
  await page.locator('#passkey-input').fill('test passkey');
  await page.locator('#passkey-input').press('Enter');
  const first = await page.locator('#rotors').inputValue();
  expect(first.split('-')).toHaveLength(3);
  await expect(page.locator('#position')).toHaveValue(/^[A-Z]{3}$/);
  await page.locator('#passkey').click();
  await expect(page.locator('#rotors')).toHaveValue(first);
  await page.locator('#passkey-input').fill('');
  await page.locator('#passkey').click();
  await expect(page.locator('#settings-error')).toHaveText('Enter a passkey.');
});

test('copies the visible output including a message key', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await page.locator('#plain').fill('ABCABCHELLO');
  const output = await page.locator('#cipher').textContent();
  await page.locator('#copy-output').click();
  await expect(page.locator('#copy-output')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(output);
});

test('logs the machine path for each encoded letter', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'log') logs.push(message.text());
  });
  await page.goto('./');
  logs.length = 0;
  await page.locator('#plain').fill('AB');

  await expect.poll(() => logs.filter((message) => message.includes('->')).length).toBe(2);
  const paths = logs.filter((message) => message.includes('->'));
  expect(paths[0]).toMatch(/^A(?:->[A-Z]){9} Enigma Rotors: I-II-III Position: /);
  expect(paths[1]).toMatch(/^B(?:->[A-Z]){9} Enigma Rotors: I-II-III Position: /);
});

test('reports incomplete settings and recovers after correction', async ({ page }) => {
  await page.goto('./');
  const original = await page.locator('#cipher_out').textContent();
  await page.locator('#rotors').fill('I-II-');
  await expect(page.locator('#settings-error')).toContainText(/rotor/i);
  await expect(page.locator('#cipher_out')).toHaveText(original ?? '');
  await page.locator('#rotors').fill('I-II-III');
  await expect(page.locator('#settings-error')).toBeEmpty();

  await page.locator('#plugs').fill('AB AC');
  await expect(page.locator('#settings-error')).toContainText(/plugboard/i);
  await page.locator('#plugs').fill('AB CD');
  await expect(page.locator('#settings-error')).toBeEmpty();
});

test('handles a repeated three-letter message key', async ({ page }) => {
  await page.goto('./');
  await page.locator('#plain').fill('ABCABCHELLO');
  await expect(page.locator('#key_out')).toHaveText(/^[A-Z]{6} $/);
  await expect(page.locator('#cipher_out')).toHaveText(/^[A-Z]{5}$/);
});

test('simulator and solver fit tablet and phone viewports and start at the top', async ({ page }) => {
  for (const width of [820, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['./', './enigma-solver.html']) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        scrollY: window.scrollY,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(width);
      expect(dimensions.scrollY).toBe(0);
    }
  }
});

test('solver starts a module worker and returns a result', async ({ page }) => {
  await page.goto('./enigma-solver.html');
  await page.locator('#text_input').fill('QMJIDO MZWZJFJR');
  await page.locator('#solve').click();
  await expect(page.locator('#solve')).toBeEnabled({ timeout: 30_000 });
  await expect(page.locator('#solver-output')).toContainText('Enigma Rotors:');
  await expect(page.locator('#solve')).toBeEnabled();
  await expect(page.locator('#cipher-entropy')).toHaveText(/^\d+\.\d{2}$/);
  await expect(page.locator('#best-entropy')).toHaveText(/^\d+\.\d{2}$/);
  await expect(page.locator('#random-entropy')).toHaveText(/^\d+\.\d{2}$/);
  await expect(page.locator('#candidate-list li')).toHaveCount(10);
  const positions = await page.locator('.candidate-position').allTextContents();
  expect(positions).toHaveLength(10);
  expect(positions.every((position) => /^[A-Z]{3}$/.test(position))).toBe(true);
  await expect(page.locator('.candidate-label')).toHaveCount(20);
  await expect(page.locator('.candidate-rotors')).toHaveCount(10);
  expect(await page.locator('.candidate-rotors').allTextContents()).toEqual(Array(10).fill('I-II-III'));
  const scores = (await page.locator('.candidate-score').allTextContents())
    .map((text) => Number.parseFloat(text));
  expect(scores).toEqual([...scores].sort((a, b) => a - b));
  await expect(page.locator('#entropy-comparison')).toContainText('short sample');
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  await page.locator('#text_input').fill('1234');
  await page.locator('#solve').click();
  await expect(page.locator('#solver-output')).toHaveText('Enter a coded message with letters to search.');
  await expect(page.locator('#entropy-summary')).toBeHidden();
  await expect(page.locator('#candidates')).toBeHidden();
});


test('solver uses chosen rotor order and known machine settings', async ({ page }) => {
  const plaintext = 'THIS IS A LONGER EXAMPLE MESSAGE TO SEARCH WITH THE ENIGMA MACHINE AND CHECK THE CHOSEN SETTINGS';
  const cipher = new Enigma({
    rotors: ['IV', 'II', 'V'], reflector: 'C', position: ['B', 'C', 'D'],
    rings: ['A', 'B', 'C'], plugs: 'AB CD',
  }).encode(plaintext);
  await page.goto('./enigma-solver.html');
  await page.locator('#text_input').fill(cipher);
  await page.locator('#search-rotors').fill('IV-II-V');
  await page.locator('#search-reflector').selectOption('C');
  await page.locator('#search-rings').fill('ABC');
  await page.locator('#search-plugs').fill('AB CD');
  await page.locator('#solve').click();
  await expect(page.locator('#solve')).toBeEnabled({ timeout: 30_000 });
  expect(await page.locator('.candidate-rotors').allTextContents()).toEqual(Array(10).fill('IV-II-V'));
  expect(await page.locator('.candidate-position').allTextContents()).toContain('BCD');
  await expect(page.locator('#solver-output')).toContainText('Reflector: C');
  await expect(page.locator('#solver-output')).toContainText('Rings: ABC');
  await expect(page.locator('#solver-output')).toContainText('Plugboard: AB CD');
  await expect(page.locator('#entropy-comparison')).toContainText('17,576 settings');

  await page.locator('#search-rotors').fill('I-I-III');
  await page.locator('#solve').click();
  await expect(page.locator('#search-error')).toContainText('three different');
});

test('solver can search every three-rotor arrangement', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('./enigma-solver.html');
  await page.locator('#text_input').fill('QMJIDO');
  await page.locator('#search-all-orders').check();
  await expect(page.locator('#search-rotors')).toBeDisabled();
  await page.locator('#solve').click();
  await expect(page.locator('#solve')).toBeEnabled({ timeout: 110_000 });
  await expect(page.locator('#entropy-comparison')).toContainText('1,054,560 settings');
  await expect(page.locator('#candidate-list li')).toHaveCount(10);
  const orders = await page.locator('.candidate-rotors').allTextContents();
  expect(orders.every((order) => {
    const rotors = order.split('-');
    return rotors.length === 3 && new Set(rotors).size === 3 &&
      rotors.every((rotor) => ['I', 'II', 'III', 'IV', 'V'].includes(rotor));
  })).toBe(true);
});
