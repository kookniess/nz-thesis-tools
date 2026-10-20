# Free NZ Thesis Tools

Free, no-sign-up tools for New Zealand thesis students, published by [MyThesis](https://mythesis.co.nz/) (Auckland).
Live site: https://tools.mythesis.co.nz/

| Tool | Path | Status |
|---|---|---|
| Thesis printing cost comparison | `/thesis-printing-cost/` | live |
| Spine text generator, margin checker, deadline calculator | | planned |

## How it is built
- Plain static HTML + CSS, no build step. `assets/calc-core.js` holds every calculation as pure functions; `assets/pricing.json` is a dated snapshot of the published rates used (each with its source URL and check date).
- Tests: `node --test 'tests/*.test.mjs'` (Node 20+, no dependencies).
- `artifact/` holds the single-file calculator variant published as a Claude Artifact for a separate indexing experiment (see `../mythesis/docs/thesis-cost-calculator-proposal.md` in the private project notes).

## Updating prices
Edit `assets/pricing.json`, bump `version` and `asOf`, update each `checked` date after re-checking the source page, then run the tests.

## Honesty rules
Every third-party rate links to the provider's own page and shows when it was checked. The "printing value included" figure is a reference, never described as a discount. MyThesis is named as the publisher on every page.
