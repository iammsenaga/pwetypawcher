# PwetyPawcher Counter

**A lightweight browser tool for random sampling with replacement.**

[Try the live demo](https://iammsenaga.github.io/pwetypawcher/) · [Automated checks](https://github.com/iammsenaga/pwetypawcher/actions/workflows/checks.yml)

Choose an upper limit, draw a number from 1 to that limit and optionally save the result. Previously drawn or saved numbers remain eligible on every subsequent draw.

## Run locally

Open `index.html` in a modern browser. For consistent local-storage behavior, serve the folder locally:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Then visit [localhost:8080](http://localhost:8080). There is no build step, backend or package installation.

## Features

- Configurable upper limit, starting at 34.
- Independent draws with replacement: duplicates are expected.
- Save selected results with timestamps.
- View the 12 most recent entries in each list.
- Persist the limit, latest number and lists in browser local storage.
- Clear saved samples and draw history separately, with confirmation.
- Responsive layout, labeled controls and a live result region.

## Sampling model

To sample from a population, first assign its members the integers **1 through N**, then use **N** as the upper limit. The application uses `Math.floor(Math.random() * N) + 1` for each draw.

This is sampling **with replacement**. It does not select a unique subset: a member may be drawn more than once. Saving a result does not change the draw pool, and manually choosing which draws to save is not itself an unbiased sampling procedure. Use all draws when following a predefined sampling plan.

`Math.random()` is a pseudorandom browser generator. This tool is intended for ordinary sampling and demonstrations; it is not a cryptographic draw system or a reproducible seeded research pipeline. Keep the upper limit to practical positive integer population sizes.

## Design

The application uses plain HTML, CSS and JavaScript. A shared state object holds the sampling session; event handlers update it, persist it and render the latest result and lists. There are no third-party runtime dependencies or network requests in the application.

All sample history stays in the browser's local storage. Clearing browser data removes it. The full lists are retained even though the interface displays only the most recent 12 entries, so very long sessions can reach browser storage limits.

## Project files

| File | Responsibility |
| :--- | :--- |
| `index.html` | Controls, result display and history structure |
| `script.js` | Random draws, state, event handling and persistence |
| `styles.css` | Layout, typography and responsive styling |

## Validation

With Node.js 22 or newer installed:

```sh
node --test tests/counter.test.cjs
```

The tests cover draw boundaries, replacement behavior, persistence, changing the population, history rendering and independent clearing. They use a lightweight DOM/storage harness; they do not establish statistical quality or replace testing in a real browser. GitHub Actions runs the same checks.

## Author

[Dr. Osasenaga David Evbayiro](https://github.com/iammsenaga) · [Portfolio](https://senagadavid.netlify.app/)
