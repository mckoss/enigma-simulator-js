import { expect, test } from '@playwright/test';

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

test('sets repeatable machine settings from a passkey', async ({ page }) => {
  await page.goto('./');
  page.once('dialog', (dialog) => dialog.accept('test passkey'));
  await page.locator('#passkey').click();
  const first = await page.locator('#rotors').inputValue();
  expect(first.split('-')).toHaveLength(3);
  await expect(page.locator('#position')).toHaveValue(/^[A-Z]{3}$/);
  page.once('dialog', (dialog) => dialog.accept('test passkey'));
  await page.locator('#passkey').click();
  await expect(page.locator('#rotors')).toHaveValue(first);
});

test('logs the machine path for each encoded letter', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'log') logs.push(message.text());
  });
  await page.goto('./');
  logs.length = 0;
  await page.locator('#plain').fill('AB');

  const paths = logs.filter((message) => message.includes('->'));
  expect(paths).toHaveLength(2);
  expect(paths[0]).toMatch(/^A(?:->[A-Z]){9} Enigma Rotors: I-II-III Position: /);
  expect(paths[1]).toMatch(/^B(?:->[A-Z]){9} Enigma Rotors: I-II-III Position: /);
});

test('solver starts a module worker and returns a result', async ({ page }) => {
  await page.goto('./enigma-solver.html');
  await page.locator('#text_input').fill('QMJIDO MZWZJFJR');
  await page.locator('#solve').click();
  await expect(page.locator('#solver-output')).not.toHaveText('Searching rotor positions…', { timeout: 30_000 });
  await expect(page.locator('#solver-output')).toContainText('Enigma Rotors:');
  await expect(page.locator('#solve')).toBeEnabled();
});
