import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createTranslator } from 'next-intl';
import { languages, resolveLocale } from '../i18n/locales.ts';

test('every language contains renderable messages with working interpolations and plurals', async () => {
  const english = JSON.parse(await readFile(new URL('../messages/en.json', import.meta.url), 'utf8'));
  for (const {code} of languages) {
    const messages = JSON.parse(await readFile(new URL(`../messages/${code}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(Object.keys(messages.ui).sort(), Object.keys(english.ui).sort(), code);
    const t = createTranslator({locale: code, messages, onError(error) {throw error;}});
    for (const key of Object.keys(messages.ui)) {
      for (const count of [0, 1, 2, 20]) {
        const value = t(`ui.${key}`, {count, page: 2, pages: 4, category: 'Slots', name: 'Player', game: 'Example', provider: 'Studio'});
        assert.ok(value.trim().length > 0, `${code}: ${key}`);
        assert.ok(!value.includes('{count'), `${code}: ${key}`);
      }
    }
    assert.ok(t('ui.playGame', {game: 'Example', provider: 'Studio'}).includes('Example'));
  }
});

test('unknown or malformed saved preferences safely fall back to English', () => {
  for (const value of [undefined, null, '', 'ar', '../ja', 'constructor', '<script>', 'EN']) {
    assert.equal(resolveLocale(value), 'en');
  }
  for (const {code} of languages) assert.equal(resolveLocale(code), code);
});
