# Portal languages

The left menu opens a compact language popover beside its language button. On
narrow screens it opens below the button, clamped to the viewport. The selected
language is highlighted blue. Escape/outside click dismiss the list; arrow keys
navigate its choices. English is the
default. Japanese, Spanish, Korean, Portuguese, Romanian, Italian and Simplified
Chinese are available. The preference uses a one-year, same-site, HTTP-only cookie
named `choicestakes-language`. URLs stay unchanged and the server renders the
saved language. Unknown cookie values fall back to English.

This first translation set covers the shared navigation/header, casino catalog
controls, categories and game-player controls. Remaining editorial, account and
payment-form copy retains English. Add translations in all eight `messages/*.json`
files and render migrated copy with `useText` (or `useTranslations`). Provider
names, game titles and text embedded in artwork are not translated by the portal.

New launches send `lang` to the player backend, which validates it and forwards it
in the signed API-MATIC launch body. `/sports` uses the same launch hook. Changing
language does not relaunch an active game. Portuguese uses `pt`; Simplified Chinese
uses the generic provider code `zh`. Individual vendors may ignore unsupported
languages or fall back to their default. Confirm vendor-specific variants with
API-MATIC; do not rewrite signed game URLs or automatically retry launches.

Deploy the backend update first (it accepts older launch requests without `lang`),
then install the portal lockfile dependencies with `npm ci`, build and restart the
portal. No environment-variable changes or database migrations are needed.

Validation: `node --experimental-strip-types --test tests/languages.test.mjs`
and `npm run typecheck`. The backend has `tests/launch-language.test.ts` for
HTTP validation, exact provider language forwarding, and signed request bodies.
