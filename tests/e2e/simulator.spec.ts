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

  const paths = logs.filter((message) => message.includes('->'));
  expect(paths).toHaveLength(2);
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
  await expect(page.locator('#solver-output')).not.toHaveText('Searching rotor positions…', { timeout: 30_000 });
  await expect(page.locator('#solver-output')).toContainText('Enigma Rotors:');
  await expect(page.locator('#solve')).toBeEnabled();
});
