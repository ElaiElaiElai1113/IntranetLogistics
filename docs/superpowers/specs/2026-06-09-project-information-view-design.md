# Project Information View Design

## Goal

Show project source information separately from calculated financial results on the project detail page.

## Design

Add a read-only `Information` card to `ProjectDetail`. It will display the project name, start date, capital invested, revenue, cost percentage, split percentage, status, and notes. It will not display calculated values such as total cost, profit, split amount, ROI, or final amount.

The existing editable `Details` card remains the source of edits. The existing `Calculated` card remains the formula output. On large screens, the page uses three columns. On smaller screens, the cards stack vertically.

## Data Flow

`ProjectDetail` already stores editable form state. A small helper will convert that form state into display rows for the `Information` card. The helper keeps formatting testable without adding a React DOM testing library.

## Testing

Add Vitest coverage for the helper to confirm it returns the raw/input display rows, formats currency and percentages, and substitutes a dash for missing notes or dates.
