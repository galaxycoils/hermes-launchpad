# Mobile Trade Sheet Spec (r2)

> Per plan §6C. Bottom-sheet trade sheet for mobile-first trading. No optimistic mutation.

## Layout
- Bottom-sheet, safe-area insets (`env(safe-area-inset-*)`), max-height ~90vh, draggable handle.
- Touch targets ≥ 44px (Apple HIG / WCAG 2.5.5). Buy/Sell thumb-zone reachable one-handed.
- Single primary action (Buy or Sell) per sheet; secondary actions (max/min, slippage) collapsed.

## Interaction
- One-hand amount entry: large numeric input, no precision friction; percentage quick-taps (25/50/75/100%).
- Keyboard-dismiss on submit; focus trap within sheet; Escape / scrim tap closes.
- Screen-reader transaction summary announced **before** wallet prompt (program, mint, side, amount, min-out, fee recipients, cluster, est. priority/rent).

## Transaction review (pre-sign)
- Explicit: devnet cluster, program ID, instruction, mint, fee payer, SOL/token amount, min-out, fee recipients + amounts, priority fee, estimated rent.
- Simulate first (`simulateTrade`); disable confirm if mismatch / stale / unknown config / preflight fail.

## States
- Disabled when `navigator.onLine === false`, Worker health `degraded`, or unverified config.
- No optimistic price/quote mutation: sheet inert until Worker confirmation.
- Explicit banner: "Trading disabled — {reason}" (offline / degraded / unverified).
