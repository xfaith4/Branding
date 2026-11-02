# Naming Lab

A small browser tool for comparing product and brand names. Add ideas, grade them, adjust priorities, and export a shortlist for review.

## Use it

Open **`index.html`** in a modern browser. That's it: no installation, account, API key, or server required. The checked-in HTML includes its JavaScript and styles, so the workshop works offline.

1. Replace the example ideas with your own names and descriptions.
2. Adjust each idea's grades and the shared signal weights.
3. Select finalists and add notes.
4. Copy or download the generated review prompt.
5. **Export session** to save a JSON backup; **Import session** restores it after confirming replacement of the current board.

The board, weights, notes, shortlist, and review objective save in browser storage. Storage can be unavailable or cleared, and moving the HTML file or changing browsers can change which saved board you see. Export JSON before moving or sharing your work. The app supports 200 ideas per board. Lookup results are temporary and are not included in session files.

## Scoring and optional lookups

The composite is a weighted average of five human grades and a repeatable name-shape heuristic, scaled to 100. Turning all weights to zero produces a score of zero. The heuristic considers English letters, length, vowel balance, consonant clusters, approximate syllables, letter rarity, repetition, simplicity, and word endings. It is a discussion aid, not measured audience preference, and is not designed to assess names in other writing systems.

**Check now** and **Look up all names** make optional requests to [Google Public DNS](https://developers.google.com/speed/public-dns/docs/doh/json) and the [GitHub API](https://docs.github.com/en/rest/users/users#get-a-user). Those services receive the normalized candidate names and ordinary connection information. There are no network requests until you request a lookup. No analytics, AI calls, accounts, or backend are included.

- DNS results report an A record, no A record, NXDOMAIN, or unknown. None establishes domain registration availability.
- A missing GitHub account does not establish that a username can be registered.
- Exact repository names are counted only within the first five search results, not across all repositories.
- Failures, timeouts, incomplete searches, and rate limits remain unknown. Lookups never affect rankings.

Check registration and naming rights separately before adopting a name. Browser network policy and service rate limits may prevent lookups, especially when opening the HTML directly. The rest of the app still works.

## Develop

Requires Node.js 20 or newer and npm. Run these commands from the project folder:

```sh
npm ci
npm run build
npm test
npm start
```

Open the localhost URL printed by `npm start`. The server serves only the app and binds to the local machine. Edit `src/`, then rebuild and refresh; there is no development watcher. `index.html` is generated; commit it after changes so users can run the tool without installing dependencies.

## Prepare a public repository

```sh
npm run package
```

This builds the standalone app, checks the public files for machine-specific paths, and copies an explicit allowlist into **`release/naming-lab/`**. Copy that folder's contents into your new repository. It includes the app, source, tests, build scripts, dependency lockfile, documentation, third-party notices, and ignore rules.

The package excludes original branding assets, the legacy Naming folder, editor settings, local planning records, dependencies, and browser test artifacts. Packaging refuses to overwrite an existing nonempty release folder; move the previous package before running it again.

The single `index.html` also works on a static host, including a repository subdirectory. No root-relative assets or local filesystem paths are required. Keep `THIRD_PARTY_NOTICES.md` with redistributions. A project license has not been selected; add a `LICENSE` if you want to grant open-source reuse rights.

## Source layout

```text
index.html                 Standalone, generated app
src/App.jsx                Workshop interface
src/scoring.js             Pure scoring functions
src/lookups.js             Optional DNS and GitHub observations
src/session.js             Validated import/export and browser storage
src/defaults.js            Generic samples, criteria, and weights
src/styles.css             Styles compiled during the build
scripts/                   Build, localhost server, and public packaging
tests/core.test.js        Scoring, import, lookup, and portability checks
```
