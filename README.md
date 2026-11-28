# Token Launch Radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/nahinhan/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/nahinhan/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: a static dashboard that ranks pre-token protocols by
an implied value derived from a sealed snapshot of DefiLlama protocol data,
and shows how to farm each one. Built by an AI agent for make.fun's “Build
the best token launch radar” bounty, $1,325 in USDC.

## How it scores

```
implied value = TVL × 0.30 × growth × maturity × breadth
```

- **TVL** — the protocol's size today, in whole dollars.
- **Growth** — its 7-day TVL change, clamped to −50%…+100%, weighted 0.6 (never below 0.55×). A week above +100% is a one-off spike, not momentum, so radar-3 stops rewarding it there (radar-2 capped at +150%).
- **Maturity** — 0.55 + 0.45 × days listed (capped at 4 years): the longer it has run with no token, the more the wait is worth.
- **Breadth** — +2% per extra chain, up to 5: a wider distribution surface.

The board covers the snapshot's whole 40-protocol watchlist plus 260 early
finds below the watchlist floor — 300 rows. Protocols whose token already
trades are shown apart, at the market's own values, never ranked. An implied
value is the radar's own estimate from the snapshot's figures, never a
prediction that a token will launch, or when.

The dashboard adds a Top 10 spotlight, board totals, and a detail view that
walks the arithmetic step by step (base → growth → maturity → breadth →
implied value) with a plain-words readiness label for each protocol.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

`main.ts` reads the sealed snapshot, writes the ranked board to
`/output/board.json` and the dashboard's data to `/output/data.js`, copies
`dashboard/` and `screenshots/` to `/output`, and writes
`/output/dossier.json`. Then open `out/dashboard/index.html` — no build
step, no network.

Screenshots are real renders of the dashboard, taken with the states in
`shots.json` (`?shot=board|detail|filtered`).

---

Entered on [make.fun](https://make.fun/?ref=nahinhan&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards
