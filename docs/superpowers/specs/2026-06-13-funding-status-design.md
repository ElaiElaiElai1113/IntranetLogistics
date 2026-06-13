# Funding Status Design

## Goal

Add a clear funding indicator to the logistics dashboard so the client can see whether each project is fully funded, partially funded, or not yet decided. This must not replace the existing timeline status column.

## Decisions

The dashboard will use a new column named `Funding`, placed immediately after `Project`.

Funding is a manually managed project attribute, not a calculated value. The app will not infer full or partial funding from capital, revenue, ROI, or any other financial formula.

Funding can have three display states:

- `Full`, shown with green styling.
- `Partial`, shown with orange styling.
- Unset, shown as a muted dash (`-`) on the dashboard.

New projects will not default to `Full` or `Partial`. They remain unset until someone chooses a funding value.

For currently known active dashboard data, the intended backfill is:

- `Probes`: `Partial`
- All other current projects: `Full`

If `Probes` does not exist in the local seed data, the schema should still include the backfill pattern for deployments where that project exists. The existing seed projects in `supabase/schema.sql` can be seeded as `Full` because the client said current dashboard projects are full aside from Probes.

## Dashboard UI

The existing dashboard timeline `Status` column stays unchanged. It continues to show values such as `On Track`, `Approaching Due`, `Overdue`, and `No Start Date`.

The new desktop table order will start:

- Project
- Funding
- Start Date
- Days Active
- Expected Completion
- Status
- Capital Invested
- Projected Revenue
- Profit Split
- ROI

The mobile project card will include the funding pill near the project name or before the timeline status so the funding state is visible without horizontal scrolling.

The Funding display colors will follow the existing dashboard pill style:

- Full: green
- Partial: orange
- Unset: muted gray dash (`-`)

## Project Detail UI

The project detail page will add a `Funding` selector in the editable Details section. It will use three options:

- Unset
- Full
- Partial

Changing funding will require the existing Save button. There will be no separate quick-toggle button in the dashboard for this first version.

After save, the dashboard and project detail data refresh through the existing project refresh flow.

## Data Model

Add a nullable `funding_status` column to `projects`.

Allowed stored values:

- `full`
- `partial`
- `null`

Use a database check constraint so only `full`, `partial`, or `null` can be stored.

The TypeScript `Project` type will include a nullable `funding_status` field. `ProjectInput` and `ProjectPatch` will support it so new projects can stay unset and existing projects can be updated.

## Audit Log

Funding changes should use the existing audited update flow.

When the funding value changes, the audit details should be readable, for example:

- `Changed funding from Unset to Full`
- `Changed funding from Partial to Full`
- `Changed funding from Full to Partial`

The audit action can remain `Updated project`, matching the existing project update behavior.

## Error Handling

If a save fails, the project detail page should continue using its existing error banner behavior. No special funding-specific error UI is needed.

If a row has an unexpected funding value from older or manually edited data, the display helper should render it as unset or muted rather than crashing the dashboard.

## Testing

Pure helper coverage should be added or updated for:

- Dashboard row builder returns `Full` with a positive/green funding tone.
- Dashboard row builder returns `Partial` with a warning/orange funding tone.
- Dashboard row builder returns unset display and muted tone when `funding_status` is `null`.
- Existing timeline `Status` behavior remains unchanged and separate from funding.
- Audit detail builder includes readable funding-change messages.

Full Supabase write behavior can remain covered by build/type checks and manual verification, consistent with the current project testing approach.

Verification commands for implementation:

- `npm test`
- `npm run build`
