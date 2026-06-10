# Dashboard Project Tracking Updates Design

## Goal

Update the project dashboard and project detail workflow so the client can track project age, expected completion, capital additions, and change history without adding user login yet.

## Dashboard Changes

The dashboard remains focused on active projects. Rows will be sorted by `start_date` ascending, with projects missing a start date placed after dated projects.

The project table columns will be:

- Project
- Start Date
- Days Active
- Expected Completion Date
- Status
- Capital Invested
- Projected Revenue
- Profit Split
- ROI
- Total Return (Profit + Capital)

The dashboard will remove these project columns:

- Cost %
- Split %
- Total Cost

The dashboard summary cards will remove Total Cost. Revenue labels will change to Projected Revenue.

`Days Active` is the whole calendar-day difference between today and `start_date`. If `start_date` is missing, show a dash.

`Expected Completion Date` is `start_date` plus 8 calendar months. If `start_date` is missing, show a dash.

The dashboard status uses the expected completion date:

- Green, On Track: more than 30 days remain.
- Orange, Approaching Due: 0 to 30 days remain.
- Red, Overdue: expected completion date is before today.
- Gray, No Start Date: start date is missing.

## Financial Label Changes

Existing formulas remain unchanged.

Displayed labels change as follows:

- Revenue becomes Projected Revenue.
- Profit becomes Profit Split where the displayed value is the investor split amount currently computed as `splitAmount`.
- Final Amount becomes Total Return (Profit + Capital), using the existing `finalAmount` formula.

The internal helper names can change if useful, but the behavior must remain formula-compatible with the current tests and spreadsheet assumptions.

## Capital Additions

Add a Supabase-backed `project_capital_entries` table for capital history. Each row stores:

- `id`
- `project_id`
- `amount`
- `note`
- `updated_by`
- `created_at`

The existing `projects.capital_invested` value will represent total capital invested. Existing projects keep their current value as the starting total. When a user clicks Add Capital and saves an amount, the app inserts a capital entry and increments `projects.capital_invested` by that amount.

The project detail page will keep the existing Capital Invested field visible as the current total. It will add an Add Capital button that opens a small form with:

- Amount
- Updated by
- Optional note

Saving the form updates the total, refreshes the project, and records an audit log entry.

## Audit Log / Version Control

Add a Supabase-backed `project_audit_logs` table. Each row stores:

- `id`
- `project_id`
- `updated_by`
- `action`
- `details`
- `created_at`

No login will be added. The app will use a small `Updated by` text field for save and add-capital actions. This value is stored in the audit log. The first implementation will not persist the updater name outside the saved audit rows.

Every project update creates an audit entry. The audit details should be readable, for example:

- Updated projected revenue from PHP 160,000.00 to PHP 175,000.00
- Added capital PHP 50,000.00
- Changed status from Active to Archived

The project detail page will include an Audit Log section inside each project. It lists newest entries first with:

- Date/time
- Updated by
- Action
- Details

Archive and restore actions should also write audit entries when invoked through the project detail workflow.

## Mobile Responsiveness

The existing mobile card approach stays. Mobile project cards should show the new tracking fields instead of the removed cost/split/total-cost fields:

- Start date
- Days active
- Expected completion date
- Status
- Capital invested
- Projected revenue
- Profit split
- ROI
- Total return

The project detail layout should continue stacking sections on small screens. Add Capital and Audit Log controls must be usable without horizontal scrolling.

## Data Flow

`src/lib/projectOverviewRows.ts` remains the central dashboard row builder. It will calculate and format days active, expected completion, due status, profit split, and total return.

`src/lib/calculations.ts` remains responsible for financial formulas.

`src/lib/projects.ts` will add data functions for:

- adding capital
- listing audit logs
- creating audit log entries
- updating projects with audit metadata

The React components should call these helpers rather than duplicating Supabase query logic.

## Testing

Add or update Vitest coverage for pure helper behavior:

- Dashboard rows sort by start date.
- Days Active is calculated from an injected current date.
- Expected Completion Date is 8 calendar months after start date.
- Status returns On Track, Approaching Due, Overdue, and No Start Date.
- Dashboard rows use Projected Revenue, Profit Split, and Total Return values.
- Missing start dates display dashes and sort after dated projects.

Supabase write flows can be kept thin and manually verified unless the existing project adds database mocking. The implementation should still run `npm test` and `npm run build`.
