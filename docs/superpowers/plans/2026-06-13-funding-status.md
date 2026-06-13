# Funding Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manually managed project funding status so the dashboard shows Full, Partial, or unset funding without changing the existing timeline Status column.

**Architecture:** Store funding as a nullable `projects.funding_status` value with allowed values `full` and `partial`. Keep formatting in pure helpers (`auditDetails`, `projectOverviewRows`) and let React components consume formatted row fields and editable form state.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Supabase Postgres, Vitest.

---

## File Structure

- Modify `supabase/schema.sql`: add nullable `funding_status`, a check constraint, seed values for known projects, and idempotent backfill statements.
- Modify `src/types/project.ts`: add `FundingStatus` and thread `funding_status` through project input and patch types.
- Modify `src/lib/auditDetails.ts`: add the `funding_status` audit label required by `ProjectPatch`.
- Modify `src/lib/auditDetails.test.ts`: add `funding_status` to the typed `Project` fixture.
- Modify `src/lib/projectOverviewRows.test.ts`: add `funding_status` to the typed `Project` fixture.
- Modify `src/lib/auditDetails.test.ts`: add failing tests for funding change audit text.
- Modify `src/lib/auditDetails.ts`: add funding labels and audit details.
- Modify `src/lib/projectOverviewRows.test.ts`: add failing tests for Full, Partial, unset, and invalid funding dashboard display.
- Modify `src/lib/projectOverviewRows.ts`: add funding display fields to dashboard rows.
- Modify `src/components/Dashboard.source.test.ts`: add source-level coverage that Funding remains separate from timeline Status.
- Modify `src/components/Dashboard.tsx`: render Funding after Project on desktop and mobile.
- Modify `src/components/ProjectDetail.source.test.ts`: add source-level coverage for the Funding selector.
- Modify `src/components/ProjectDetail.tsx`: add editable Funding selector and save it through the audited update flow.

### Task 1: Schema And Type Model

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/types/project.ts`
- Modify: `src/lib/auditDetails.ts`
- Modify: `src/lib/auditDetails.test.ts`
- Modify: `src/lib/projectOverviewRows.test.ts`

- [ ] **Step 1: Update the project type model**

In `src/types/project.ts`, add the funding type next to `ProjectStatus`:

```ts
export type ProjectStatus = 'active' | 'archived'
export type FundingStatus = 'full' | 'partial'
```

Add this field to `Project`:

```ts
  funding_status: FundingStatus | null
```

Add this field to `ProjectInput`:

```ts
  funding_status?: FundingStatus | null
```

Add `funding_status` to the `ProjectPatch` pick list:

```ts
    | 'funding_status'
```

- [ ] **Step 2: Update the Supabase schema**

In `supabase/schema.sql`, add `funding_status text` inside the `projects` table definition after `status text default 'active',`:

```sql
  status text default 'active',
  funding_status text,
```

After the `create table if not exists projects (...)` block, add the idempotent column and constraint setup:

```sql
alter table projects
  add column if not exists funding_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_funding_status_check'
  ) then
    alter table projects
      add constraint projects_funding_status_check
      check (funding_status in ('full', 'partial') or funding_status is null);
  end if;
end $$;
```

Change the seed insert column list from:

```sql
  (project_name, start_date, capital_invested, revenue, cost_percentage, split_percentage, notes)
```

to:

```sql
  (project_name, start_date, capital_invested, revenue, cost_percentage, split_percentage, notes, funding_status)
```

Add `'full'` as the final value for each existing seed row:

```sql
  ('Air Oven',           '2026-01-08',  85800,  160000, 10, 50, '', 'full'),
  ('Air Oven 2',         '2026-03-03',  86000,  160000, 10, 50, '', 'full'),
  ('Trash Bags',         '2026-01-25', 260000,  480000, 10, 50, '', 'full'),
  ('Steel Wool',         '2026-02-06',  70000,  150000, 10, 50, '', 'full'),
  ('Bull Caps',          '2026-02-16', 305000,  585900, 10, 50, '', 'full'),
  ('Vinyl Stickers',     '2026-03-18', 378420,  710400, 10, 50, '', 'full'),
  ('Furniture',          '2026-03-18', 381700,  748000, 10, 50, '', 'full'),
  ('Dignity Advocacy',   '2026-04-15', 389800,  783800, 10, 50, '', 'full'),
  ('Surgical Equipment', '2026-05-15', 725000, 1554195, 10, 50, '', 'full'),
  ('Breast Moulds',      '2026-02-25',  96000,  179000, 10, 50, '', 'full');
```

After the seed insert, add exact backfill statements for known current data:

```sql
update projects
set funding_status = 'partial'
where project_name = 'Probes'
  and funding_status is null;

update projects
set funding_status = 'full'
where project_name in (
  'Air Oven',
  'Air Oven 2',
  'Trash Bags',
  'Steel Wool',
  'Bull Caps',
  'Vinyl Stickers',
  'Furniture',
  'Dignity Advocacy',
  'Surgical Equipment',
  'Breast Moulds'
)
  and funding_status is null;
```

- [ ] **Step 3: Update the audit label map and typed test fixtures**

In `src/lib/auditDetails.ts`, add this entry to `labels` so `Record<keyof ProjectPatch, string>` remains complete:

```ts
  funding_status: 'funding',
```

In `src/lib/auditDetails.test.ts`, add this field to the `project` fixture:

```ts
  funding_status: 'partial',
```

In `src/lib/projectOverviewRows.test.ts`, add this field to `baseProject`:

```ts
  funding_status: 'full',
```

- [ ] **Step 4: Run typecheck to confirm the data model compiles**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit schema and type model**

```bash
git add supabase/schema.sql src/types/project.ts src/lib/auditDetails.ts src/lib/auditDetails.test.ts src/lib/projectOverviewRows.test.ts
git commit -m "feat: add funding status data model"
```

### Task 2: Funding Audit Details

**Files:**
- Modify: `src/lib/auditDetails.test.ts`
- Modify: `src/lib/auditDetails.ts`
- Read: `src/lib/formatters.ts`

- [ ] **Step 1: Write failing audit tests**

Add this test inside the existing `describe('buildProjectUpdateDetails', () => { ... })` block:

```ts
  it('describes funding status changes', () => {
    expect(buildProjectUpdateDetails(project, { funding_status: 'full' })).toEqual([
      'Changed funding from Partial to Full',
    ])

    expect(
      buildProjectUpdateDetails(
        {
          ...project,
          funding_status: null,
        },
        { funding_status: 'partial' },
      ),
    ).toEqual(['Changed funding from Unset to Partial'])

    expect(buildProjectUpdateDetails(project, { funding_status: null })).toEqual([
      'Changed funding from Partial to Unset',
    ])
  })
```

- [ ] **Step 2: Run the audit test and verify it fails**

Run:

```bash
npm test -- src/lib/auditDetails.test.ts
```

Expected: FAIL because `funding_status` still uses the generic text fallback instead of the readable funding-specific message.

- [ ] **Step 3: Implement funding audit labels**

In `src/lib/auditDetails.ts`, update the import:

```ts
import type { FundingStatus, Project, ProjectPatch, ProjectStatus } from '../types/project'
```

Add this function after `statusLabel`:

```ts
function fundingStatusLabel(status: FundingStatus | null | undefined): string {
  if (status === 'full') return 'Full'
  if (status === 'partial') return 'Partial'
  return 'Unset'
}
```

Add this branch before the final fallback branch in `buildProjectUpdateDetails`:

```ts
    if (key === 'funding_status') {
      return [
        `Changed funding from ${fundingStatusLabel(
          current as FundingStatus | null,
        )} to ${fundingStatusLabel(next as FundingStatus | null)}`,
      ]
    }
```

- [ ] **Step 4: Run the audit test and verify it passes**

Run:

```bash
npm test -- src/lib/auditDetails.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit audit detail support**

```bash
git add src/lib/auditDetails.ts src/lib/auditDetails.test.ts
git commit -m "feat: audit funding status changes"
```

### Task 3: Dashboard Row Funding Data

**Files:**
- Modify: `src/lib/projectOverviewRows.test.ts`
- Modify: `src/lib/projectOverviewRows.ts`

- [ ] **Step 1: Write failing dashboard row tests**

Update the first expected row object to include:

```ts
        fundingStatus: 'Full',
        fundingTone: 'positive',
```

Add these tests inside the existing `describe('buildProjectOverviewRows', () => { ... })` block:

```ts
  it('formats partial funding with warning tone', () => {
    const rows = buildProjectOverviewRows(
      [
        {
          ...baseProject,
          funding_status: 'partial',
        },
      ],
      today,
    )

    expect(rows[0]).toMatchObject({
      fundingStatus: 'Partial',
      fundingTone: 'warning',
    })
  })

  it('formats unset funding with muted tone', () => {
    const rows = buildProjectOverviewRows(
      [
        {
          ...baseProject,
          funding_status: null,
        },
      ],
      today,
    )

    expect(rows[0]).toMatchObject({
      fundingStatus: '-',
      fundingTone: 'muted',
    })
  })

  it('treats unexpected funding values as unset display values', () => {
    const rows = buildProjectOverviewRows(
      [
        {
          ...baseProject,
          funding_status: 'unknown' as Project['funding_status'],
        },
      ],
      today,
    )

    expect(rows[0]).toMatchObject({
      fundingStatus: '-',
      fundingTone: 'muted',
    })
  })
```

- [ ] **Step 2: Run the dashboard row test and verify it fails**

Run:

```bash
npm test -- src/lib/projectOverviewRows.test.ts
```

Expected: FAIL because `ProjectOverviewRow` does not expose funding fields.

- [ ] **Step 3: Implement funding row display fields**

In `src/lib/projectOverviewRows.ts`, add this type near the imports:

```ts
type FundingTone = 'positive' | 'warning' | 'muted'
```

Add these properties to `ProjectOverviewRow`:

```ts
  fundingStatus: string
  fundingTone: FundingTone
```

Add this helper before `sortByStartDate`:

```ts
function getFundingDisplay(status: Project['funding_status']): {
  label: string
  tone: FundingTone
} {
  if (status === 'full') return { label: 'Full', tone: 'positive' }
  if (status === 'partial') return { label: 'Partial', tone: 'warning' }
  return { label: '-', tone: 'muted' }
}
```

Inside `buildProjectOverviewRows`, after `const timeline = getProjectTimelineStatus(project.start_date, today)`, add:

```ts
    const funding = getFundingDisplay(project.funding_status)
```

Add these properties to the returned row object:

```ts
      fundingStatus: funding.label,
      fundingTone: funding.tone,
```

- [ ] **Step 4: Run the dashboard row test and verify it passes**

Run:

```bash
npm test -- src/lib/projectOverviewRows.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit dashboard row support**

```bash
git add src/lib/projectOverviewRows.ts src/lib/projectOverviewRows.test.ts
git commit -m "feat: format dashboard funding status"
```

### Task 4: Dashboard Funding Column

**Files:**
- Modify: `src/components/Dashboard.source.test.ts`
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Write failing Dashboard source test**

In `src/components/Dashboard.source.test.ts`, add this test:

```ts
  it('renders Funding as a separate dashboard column before timeline Status', () => {
    const fundingHead = source.indexOf('<TableHead>Funding</TableHead>')
    const statusHead = source.indexOf('<TableHead>Status</TableHead>')
    const fundingValue = source.indexOf('row.fundingStatus')
    const timelineValue = source.indexOf('row.timelineStatus')

    expect(fundingHead).toBeGreaterThan(-1)
    expect(statusHead).toBeGreaterThan(-1)
    expect(fundingHead).toBeLessThan(statusHead)
    expect(fundingValue).toBeGreaterThan(-1)
    expect(timelineValue).toBeGreaterThan(-1)
  })
```

- [ ] **Step 2: Run the Dashboard source test and verify it fails**

Run:

```bash
npm test -- src/components/Dashboard.source.test.ts
```

Expected: FAIL because the Dashboard component does not render the Funding column.

- [ ] **Step 3: Render Funding in the desktop table**

In `src/components/Dashboard.tsx`, add the table head immediately after `<TableHead>Project</TableHead>`:

```tsx
                      <TableHead>Funding</TableHead>
```

Add this table cell immediately after the project-name `<td>`:

```tsx
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusPill label={row.fundingStatus} tone={row.fundingTone} />
                        </td>
```

- [ ] **Step 4: Render Funding in the mobile card**

In the mobile card header in `src/components/Dashboard.tsx`, replace:

```tsx
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-blue-600">{row.projectName}</span>
                        <span className="shrink-0 text-xs text-gray-400">{row.startDate}</span>
                      </div>
```

with:

```tsx
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-semibold text-blue-600">{row.projectName}</span>
                          <div className="mt-2">
                            <StatusPill label={row.fundingStatus} tone={row.fundingTone} />
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">{row.startDate}</span>
                      </div>
```

- [ ] **Step 5: Run the Dashboard source test and verify it passes**

Run:

```bash
npm test -- src/components/Dashboard.source.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit dashboard rendering**

```bash
git add src/components/Dashboard.tsx src/components/Dashboard.source.test.ts
git commit -m "feat: show funding on dashboard"
```

### Task 5: Project Detail Funding Editor

**Files:**
- Modify: `src/components/ProjectDetail.source.test.ts`
- Modify: `src/components/ProjectDetail.tsx`

- [ ] **Step 1: Write failing ProjectDetail source test**

In `src/components/ProjectDetail.source.test.ts`, add this test:

```ts
  it('includes a funding selector with unset, full, and partial options', () => {
    expect(source).toContain('<Field label="Funding">')
    expect(source).toContain('<option value="">Unset</option>')
    expect(source).toContain('<option value="full">Full</option>')
    expect(source).toContain('<option value="partial">Partial</option>')
    expect(source).toContain('funding_status: form.funding_status || null')
  })
```

- [ ] **Step 2: Run the ProjectDetail source test and verify it fails**

Run:

```bash
npm test -- src/components/ProjectDetail.source.test.ts
```

Expected: FAIL because ProjectDetail has no Funding selector.

- [ ] **Step 3: Add funding to ProjectDetail form state**

In `src/components/ProjectDetail.tsx`, update the type import:

```ts
import type { FundingStatus, Project, ProjectAuditLog, ProjectStatus } from '../types/project'
```

Add this field to `FormState`:

```ts
  funding_status: FundingStatus | ''
```

Add this field in `toFormState`:

```ts
    funding_status: p.funding_status ?? '',
```

- [ ] **Step 4: Save funding through the audited update flow**

In the `patch` object passed to `updateProjectWithAudit` in `handleSave`, add:

```ts
          funding_status: form.funding_status || null,
```

- [ ] **Step 5: Render the Funding selector in Details**

In the Details form in `src/components/ProjectDetail.tsx`, add this block after the Project name field and before Start date:

```tsx
            <Field label="Funding">
              <select
                value={form.funding_status}
                onChange={(e) => update('funding_status', e.target.value as FundingStatus | '')}
                className={inputClass}
              >
                <option value="">Unset</option>
                <option value="full">Full</option>
                <option value="partial">Partial</option>
              </select>
            </Field>
```

- [ ] **Step 6: Run the ProjectDetail source test and verify it passes**

Run:

```bash
npm test -- src/components/ProjectDetail.source.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit ProjectDetail editor**

```bash
git add src/components/ProjectDetail.tsx src/components/ProjectDetail.source.test.ts
git commit -m "feat: edit project funding status"
```

### Task 6: Update Remaining Project Fixtures And Integration Tests

**Files:**
- Modify: `src/lib/projects.test.ts`

- [ ] **Step 1: Run the full test suite before mock cleanup**

Run:

```bash
npm test
```

Expected: PASS. This confirms the remaining change in this task is mock-shape consistency, not a required fix for earlier tests.

- [ ] **Step 2: Update the mocked Supabase project fixture**

In `src/lib/projects.test.ts`, add this field to the hoisted `project` object:

```ts
    funding_status: 'full',
```

- [ ] **Step 3: Run the full test suite and verify it passes**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit fixture updates**

```bash
git add src/lib/projects.test.ts
git commit -m "test: update project fixtures for funding status"
```

### Task 7: Final Verification

**Files:**
- Read: all files changed in this plan

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git diff --stat HEAD
```

Expected: no unstaged implementation diff. The `.superpowers/` brainstorm directory can remain untracked and must not be committed.

- [ ] **Step 4: Confirm recent commits**

Run:

```bash
git log --oneline -6
```

Expected: recent commits include:

```text
feat: add funding status data model
feat: audit funding status changes
feat: format dashboard funding status
feat: show funding on dashboard
feat: edit project funding status
test: update project fixtures for funding status
```

If Task 6 produced no fixture changes, the final test fixture commit will not exist.
