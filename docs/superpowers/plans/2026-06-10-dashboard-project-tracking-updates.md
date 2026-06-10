# Dashboard Project Tracking Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update dashboard tracking, capital additions, and project audit history without adding login/auth.

**Architecture:** Keep financial formulas pure and tested, add a small timeline/status helper for date-driven dashboard fields, and keep Supabase calls behind `src/lib/projects.ts`. The dashboard continues using row-builder output, while project detail owns the Add Capital form and Audit Log section.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Vitest, Supabase JS v2, Supabase SQL.

---

## File Structure

- Modify `supabase/schema.sql`: add `project_capital_entries` and `project_audit_logs` tables.
- Modify `src/types/project.ts`: add audit/capital entry types and optional input types.
- Create `src/lib/projectTimeline.ts`: pure date helpers for days active, expected completion, and traffic status.
- Create `src/lib/projectTimeline.test.ts`: Vitest coverage for date helper behavior.
- Modify `src/lib/projectOverviewRows.ts`: sort rows by start date and add the new dashboard display fields.
- Modify `src/lib/projectOverviewRows.test.ts`: update expected row shape and add sorting/status cases.
- Create `src/lib/auditDetails.ts`: pure helper for readable field-change audit details.
- Create `src/lib/auditDetails.test.ts`: Vitest coverage for readable change descriptions.
- Modify `src/lib/projects.ts`: add audit log, capital addition, and audited update functions.
- Modify `src/components/Dashboard.tsx`: remove old columns/cards, rename labels, add status pill, and update mobile cards.
- Modify `src/components/ProjectDetail.tsx`: add Updated by field, Add Capital form, Audit Log section, and audited save/archive flows.
- Modify `src/components/ProjectForm.tsx`: rename Revenue label to Projected Revenue and Capital label to Capital Invested.
- Modify `src/components/Sidebar.tsx`: use audited restore flow only if updater is available; otherwise keep existing restore without user attribution for now.

---

### Task 1: Add Project Timeline Helper

**Files:**
- Create: `src/lib/projectTimeline.ts`
- Create: `src/lib/projectTimeline.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/projectTimeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  addExpectedProjectMonths,
  calculateDaysActive,
  getProjectTimelineStatus,
} from './projectTimeline'

const today = new Date('2026-06-10T00:00:00+08:00')

describe('project timeline helpers', () => {
  it('calculates whole calendar days active from start date to today', () => {
    expect(calculateDaysActive('2026-06-01', today)).toBe(9)
  })

  it('returns null days active for a missing start date', () => {
    expect(calculateDaysActive(null, today)).toBeNull()
  })

  it('adds 8 calendar months for expected project completion', () => {
    expect(addExpectedProjectMonths('2026-01-08')).toBe('2026-09-08')
  })

  it('returns no-start-date status when start date is missing', () => {
    expect(getProjectTimelineStatus(null, today)).toEqual({
      label: 'No Start Date',
      tone: 'muted',
    })
  })

  it('marks projects on track when more than 30 days remain', () => {
    expect(getProjectTimelineStatus('2026-02-01', today)).toEqual({
      label: 'On Track',
      tone: 'positive',
    })
  })

  it('marks projects approaching due when 0 to 30 days remain', () => {
    expect(getProjectTimelineStatus('2025-10-25', today)).toEqual({
      label: 'Approaching Due',
      tone: 'warning',
    })
  })

  it('marks projects overdue after the expected finish date', () => {
    expect(getProjectTimelineStatus('2025-09-01', today)).toEqual({
      label: 'Overdue',
      tone: 'negative',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/projectTimeline.test.ts
```

Expected: FAIL because `src/lib/projectTimeline.ts` does not exist.

- [ ] **Step 3: Implement minimal helper**

Create `src/lib/projectTimeline.ts`:

```ts
export type TimelineTone = 'positive' | 'warning' | 'negative' | 'muted'

export interface TimelineStatus {
  label: 'On Track' | 'Approaching Due' | 'Overdue' | 'No Start Date'
  tone: TimelineTone
}

const EXPECTED_MONTHS = 8
const APPROACHING_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function toDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function formatDateOnly(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateDaysActive(startDate: string | null, today = new Date()): number | null {
  const start = startDate ? parseDateOnly(startDate) : null
  if (!start) return null
  const current = toDateOnly(today)
  return Math.max(0, Math.floor((current.getTime() - start.getTime()) / MS_PER_DAY))
}

export function addExpectedProjectMonths(startDate: string | null): string | null {
  const start = startDate ? parseDateOnly(startDate) : null
  if (!start) return null
  const expected = new Date(start)
  expected.setMonth(expected.getMonth() + EXPECTED_MONTHS)
  return formatDateOnly(expected)
}

export function getProjectTimelineStatus(
  startDate: string | null,
  today = new Date(),
): TimelineStatus {
  const expected = addExpectedProjectMonths(startDate)
  if (!expected) return { label: 'No Start Date', tone: 'muted' }

  const expectedDate = parseDateOnly(expected)
  if (!expectedDate) return { label: 'No Start Date', tone: 'muted' }

  const current = toDateOnly(today)
  const daysRemaining = Math.floor((expectedDate.getTime() - current.getTime()) / MS_PER_DAY)

  if (daysRemaining < 0) return { label: 'Overdue', tone: 'negative' }
  if (daysRemaining <= APPROACHING_DAYS) {
    return { label: 'Approaching Due', tone: 'warning' }
  }
  return { label: 'On Track', tone: 'positive' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/lib/projectTimeline.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/projectTimeline.ts src/lib/projectTimeline.test.ts
git commit -m "feat: add project timeline helpers"
```

---

### Task 2: Update Dashboard Row Builder

**Files:**
- Modify: `src/lib/projectOverviewRows.ts`
- Modify: `src/lib/projectOverviewRows.test.ts`

- [ ] **Step 1: Write failing row-builder tests**

Replace the expected row shape in `src/lib/projectOverviewRows.test.ts` with the new fields and add a current-date argument:

```ts
const today = new Date('2026-06-10T00:00:00+08:00')

const rows = buildProjectOverviewRows([baseProject], today)

expect(rows).toEqual([
  {
    id: 'project-1',
    projectName: 'Air Oven',
    startDate: 'Jun 7, 2026',
    daysActive: '3',
    expectedCompletionDate: 'Feb 7, 2027',
    timelineStatus: 'On Track',
    timelineTone: 'positive',
    capitalInvested: '₱85,800.00',
    projectedRevenue: '₱160,000.00',
    profitSplit: '₱29,100.00',
    profitTone: 'positive',
    roi: '33.9%',
    totalReturn: '₱114,900.00',
  },
])
```

Add a sorting test:

```ts
it('sorts rows by start date with missing dates last', () => {
  const rows = buildProjectOverviewRows(
    [
      { ...baseProject, id: 'late', project_name: 'Late', start_date: '2026-03-01' },
      { ...baseProject, id: 'missing', project_name: 'Missing', start_date: null },
      { ...baseProject, id: 'early', project_name: 'Early', start_date: '2026-01-01' },
    ],
    today,
  )

  expect(rows.map((row) => row.id)).toEqual(['early', 'late', 'missing'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/projectOverviewRows.test.ts
```

Expected: FAIL because `buildProjectOverviewRows` does not accept `today` and old fields are still returned.

- [ ] **Step 3: Implement minimal row-builder changes**

Update `src/lib/projectOverviewRows.ts`:

```ts
import type { Project } from '../types/project'
import { computeFinancials } from './calculations'
import { formatDate, formatPHP, formatPercent } from './formatters'
import {
  addExpectedProjectMonths,
  calculateDaysActive,
  getProjectTimelineStatus,
  type TimelineTone,
} from './projectTimeline'

export interface ProjectOverviewRow {
  id: string
  projectName: string
  startDate: string
  daysActive: string
  expectedCompletionDate: string
  timelineStatus: string
  timelineTone: TimelineTone
  capitalInvested: string
  projectedRevenue: string
  profitSplit: string
  profitTone: 'positive' | 'negative'
  roi: string
  totalReturn: string
}

function sortByStartDate(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (!a.start_date && !b.start_date) return a.project_name.localeCompare(b.project_name)
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return a.start_date.localeCompare(b.start_date)
  })
}

export function buildProjectOverviewRows(
  projects: Project[],
  today = new Date(),
): ProjectOverviewRow[] {
  return sortByStartDate(projects).map((project) => {
    const financials = computeFinancials(project)
    const daysActive = calculateDaysActive(project.start_date, today)
    const expectedCompletionDate = addExpectedProjectMonths(project.start_date)
    const timeline = getProjectTimelineStatus(project.start_date, today)

    return {
      id: project.id,
      projectName: project.project_name,
      startDate: formatDate(project.start_date),
      daysActive: daysActive === null ? '—' : String(daysActive),
      expectedCompletionDate: formatDate(expectedCompletionDate),
      timelineStatus: timeline.label,
      timelineTone: timeline.tone,
      capitalInvested: formatPHP(project.capital_invested),
      projectedRevenue: formatPHP(project.revenue),
      profitSplit: formatPHP(financials.splitAmount),
      profitTone: financials.splitAmount >= 0 ? 'positive' : 'negative',
      roi: formatPercent(financials.roi),
      totalReturn: formatPHP(financials.finalAmount),
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/lib/projectOverviewRows.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/projectOverviewRows.ts src/lib/projectOverviewRows.test.ts
git commit -m "feat: update dashboard overview rows"
```

---

### Task 3: Add Schema and Type Support for Capital and Audit Logs

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/types/project.ts`

- [ ] **Step 1: Update schema**

Append to `supabase/schema.sql`:

```sql
create table if not exists project_capital_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  updated_by text not null default '',
  created_at timestamp with time zone default now()
);

create index if not exists project_capital_entries_project_id_created_at_idx
  on project_capital_entries(project_id, created_at desc);

alter table project_capital_entries disable row level security;

create table if not exists project_audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  updated_by text not null default '',
  action text not null,
  details text not null,
  created_at timestamp with time zone default now()
);

create index if not exists project_audit_logs_project_id_created_at_idx
  on project_audit_logs(project_id, created_at desc);

alter table project_audit_logs disable row level security;
```

- [ ] **Step 2: Update TypeScript types**

Add to `src/types/project.ts`:

```ts
export interface ProjectCapitalEntry {
  id: string
  project_id: string
  amount: number
  note: string | null
  updated_by: string
  created_at: string
}

export interface ProjectAuditLog {
  id: string
  project_id: string
  updated_by: string
  action: string
  details: string
  created_at: string
}

export interface AddCapitalInput {
  amount: number
  updated_by: string
  note?: string | null
}

export interface AuditMetadata {
  updated_by: string
}
```

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql src/types/project.ts
git commit -m "feat: add capital and audit log schema"
```

---

### Task 4: Add Audit Detail Formatter

**Files:**
- Create: `src/lib/auditDetails.ts`
- Create: `src/lib/auditDetails.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/auditDetails.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildProjectUpdateDetails } from './auditDetails'
import type { Project, ProjectPatch } from '../types/project'

const project: Project = {
  id: 'project-1',
  project_name: 'Air Oven',
  start_date: '2026-01-08',
  capital_invested: 85800,
  revenue: 160000,
  cost_percentage: 10,
  split_percentage: 50,
  notes: null,
  status: 'active',
  created_at: '2026-01-08T00:00:00.000Z',
  updated_at: '2026-06-10T00:00:00.000Z',
}

describe('buildProjectUpdateDetails', () => {
  it('describes changed currency and status fields', () => {
    const patch: ProjectPatch = {
      revenue: 175000,
      status: 'archived',
    }

    expect(buildProjectUpdateDetails(project, patch)).toEqual([
      'Updated projected revenue from ₱160,000.00 to ₱175,000.00',
      'Changed status from Active to Archived',
    ])
  })

  it('returns no details when values do not change', () => {
    expect(buildProjectUpdateDetails(project, { revenue: 160000 })).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/auditDetails.test.ts
```

Expected: FAIL because `auditDetails.ts` does not exist.

- [ ] **Step 3: Implement minimal formatter**

Create `src/lib/auditDetails.ts`:

```ts
import type { Project, ProjectPatch, ProjectStatus } from '../types/project'
import { formatDate, formatPHP, formatPercent } from './formatters'

function statusLabel(status: ProjectStatus): string {
  return status === 'active' ? 'Active' : 'Archived'
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() || '—'
}

const labels: Record<keyof ProjectPatch, string> = {
  project_name: 'project name',
  start_date: 'start date',
  capital_invested: 'capital invested',
  revenue: 'projected revenue',
  cost_percentage: 'cost percentage',
  split_percentage: 'split percentage',
  notes: 'notes',
  status: 'status',
}

export function buildProjectUpdateDetails(project: Project, patch: ProjectPatch): string[] {
  return (Object.keys(patch) as Array<keyof ProjectPatch>).flatMap((key) => {
    const next = patch[key]
    const current = project[key]

    if (next === undefined || next === current) return []

    if (key === 'revenue' || key === 'capital_invested') {
      return [`Updated ${labels[key]} from ${formatPHP(Number(current))} to ${formatPHP(Number(next))}`]
    }

    if (key === 'cost_percentage' || key === 'split_percentage') {
      return [`Updated ${labels[key]} from ${formatPercent(Number(current))} to ${formatPercent(Number(next))}`]
    }

    if (key === 'start_date') {
      return [`Updated ${labels[key]} from ${formatDate(current as string | null)} to ${formatDate(next as string | null)}`]
    }

    if (key === 'status') {
      return [`Changed status from ${statusLabel(current as ProjectStatus)} to ${statusLabel(next as ProjectStatus)}`]
    }

    return [`Updated ${labels[key]} from ${normalizeText(current as string | null)} to ${normalizeText(next as string | null)}`]
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/lib/auditDetails.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auditDetails.ts src/lib/auditDetails.test.ts
git commit -m "feat: add audit detail formatting"
```

---

### Task 5: Add Supabase Data Functions

**Files:**
- Modify: `src/lib/projects.ts`

- [ ] **Step 1: Add imports**

Update the type import in `src/lib/projects.ts`:

```ts
import type {
  AddCapitalInput,
  AuditMetadata,
  Project,
  ProjectAuditLog,
  ProjectInput,
  ProjectPatch,
} from '../types/project'
import { buildProjectUpdateDetails } from './auditDetails'
```

- [ ] **Step 2: Add table constants**

Add near the current `TABLE` constant:

```ts
const TABLE = 'projects'
const CAPITAL_TABLE = 'project_capital_entries'
const AUDIT_TABLE = 'project_audit_logs'
```

- [ ] **Step 3: Add audit helpers**

Add to `src/lib/projects.ts`:

```ts
export async function getProjectAuditLogs(projectId: string): Promise<ProjectAuditLog[]> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

async function createAuditLog(
  projectId: string,
  updatedBy: string,
  action: string,
  details: string,
): Promise<ProjectAuditLog> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .insert({
      project_id: projectId,
      updated_by: updatedBy.trim(),
      action,
      details,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 4: Add audited update and capital function**

Add to `src/lib/projects.ts`:

```ts
export async function updateProjectWithAudit(
  id: string,
  patch: ProjectPatch,
  metadata: AuditMetadata,
): Promise<Project> {
  const current = await getProject(id)
  const updated = await updateProject(id, patch)
  const details = buildProjectUpdateDetails(current, patch)

  if (details.length > 0) {
    await createAuditLog(id, metadata.updated_by, 'Updated project', details.join('\n'))
  }

  return updated
}

export async function addProjectCapital(
  projectId: string,
  input: AddCapitalInput,
): Promise<Project> {
  const current = await getProject(projectId)
  const amount = Number.isFinite(input.amount) ? input.amount : 0
  if (amount <= 0) throw new Error('Capital amount must be greater than 0.')

  const { error: entryError } = await supabase.from(CAPITAL_TABLE).insert({
    project_id: projectId,
    amount,
    note: input.note?.trim() || null,
    updated_by: input.updated_by.trim(),
  })

  if (entryError) throw entryError

  const updated = await updateProject(projectId, {
    capital_invested: current.capital_invested + amount,
  })

  const note = input.note?.trim() ? ` (${input.note.trim()})` : ''
  await createAuditLog(
    projectId,
    input.updated_by,
    'Added capital',
    `Added capital ${formatPHP(amount)}${note}`,
  )

  return updated
}
```

Also import `formatPHP`:

```ts
import { formatPHP } from './formatters'
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/projects.ts
git commit -m "feat: add audited project data functions"
```

---

### Task 6: Update Dashboard UI

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/ProjectForm.tsx`

- [ ] **Step 1: Replace dashboard summary labels and totals**

In `Dashboard.tsx`, stop accumulating `cost`, keep `revenue`, and change summary card labels:

```tsx
<StatCard label="Total Capital Invested" value={formatPHP(summary.capital)} />
<StatCard label="Projected Revenue" value={formatPHP(summary.revenue)} />
<StatCard
  label="Total Profit Split"
  value={formatPHP(summary.profit)}
  accent={summary.profit >= 0 ? 'positive' : 'negative'}
/>
```

Update the summary reducer to add `fin.splitAmount` instead of gross `fin.profit` for the displayed profit split total:

```ts
acc.profit += fin.splitAmount
```

- [ ] **Step 2: Replace table headers**

Update table headers:

```tsx
<TableHead>Project</TableHead>
<TableHead>Start Date</TableHead>
<TableHead align="right">Days Active</TableHead>
<TableHead>Expected Completion</TableHead>
<TableHead>Status</TableHead>
<TableHead align="right">Capital Invested</TableHead>
<TableHead align="right">Projected Revenue</TableHead>
<TableHead align="right">Profit Split</TableHead>
<TableHead align="right">ROI</TableHead>
<TableHead align="right">Total Return</TableHead>
```

- [ ] **Step 3: Replace row cells**

Update rendered cells:

```tsx
<TableCell>{row.startDate}</TableCell>
<TableCell align="right">{row.daysActive}</TableCell>
<TableCell>{row.expectedCompletionDate}</TableCell>
<td className="whitespace-nowrap px-4 py-3">
  <StatusPill label={row.timelineStatus} tone={row.timelineTone} />
</td>
<TableCell align="right">{row.capitalInvested}</TableCell>
<TableCell align="right">{row.projectedRevenue}</TableCell>
<TableCell align="right" tone={row.profitTone}>
  {row.profitSplit}
</TableCell>
<TableCell align="right" tone={row.profitTone}>
  {row.roi}
</TableCell>
<TableCell align="right">{row.totalReturn}</TableCell>
```

Add a `StatusPill` component:

```tsx
function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'positive' | 'warning' | 'negative' | 'muted'
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-green-50 text-green-700 ring-green-200'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : tone === 'negative'
          ? 'bg-red-50 text-red-700 ring-red-200'
          : 'bg-gray-50 text-gray-600 ring-gray-200'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${toneClass}`}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Update mobile cards**

Replace mobile stats with:

```tsx
<MobileStat label="Days Active" value={row.daysActive} />
<MobileStat label="Expected" value={row.expectedCompletionDate} />
<MobileStat label="Capital" value={row.capitalInvested} />
<MobileStat label="Projected Revenue" value={row.projectedRevenue} />
<MobileStat label="Profit Split" value={row.profitSplit} tone={row.profitTone} />
<MobileStat label="ROI" value={row.roi} tone={row.profitTone} />
```

Add status and total return in the footer:

```tsx
<div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
  <StatusPill label={row.timelineStatus} tone={row.timelineTone} />
  <div className="text-right">
    <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
      Total Return
    </span>
    <span className="text-base font-bold text-gray-900">{row.totalReturn}</span>
  </div>
</div>
```

- [ ] **Step 5: Rename project creation labels**

In `ProjectForm.tsx`, change visible labels only:

```tsx
Capital Invested (₱)
Projected Revenue (₱)
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Dashboard.tsx src/components/ProjectForm.tsx
git commit -m "feat: update dashboard tracking UI"
```

---

### Task 7: Update Project Detail Save, Capital, and Audit UI

**Files:**
- Modify: `src/components/ProjectDetail.tsx`

- [ ] **Step 1: Update imports**

Replace imports from `../lib/projects`:

```ts
import {
  addProjectCapital,
  getProject,
  getProjectAuditLogs,
  updateProjectWithAudit,
} from '../lib/projects'
import type { Project, ProjectAuditLog, ProjectStatus } from '../types/project'
```

- [ ] **Step 2: Add state**

Add near existing state:

```ts
const [updatedBy, setUpdatedBy] = useState('')
const [auditLogs, setAuditLogs] = useState<ProjectAuditLog[]>([])
const [capitalAmount, setCapitalAmount] = useState('')
const [capitalNote, setCapitalNote] = useState('')
const [addingCapital, setAddingCapital] = useState(false)
const [showAddCapital, setShowAddCapital] = useState(false)
```

- [ ] **Step 3: Load audit logs with project**

Inside the load effect after `getProject(id)`, fetch both project and audit logs:

```ts
Promise.all([getProject(id), getProjectAuditLogs(id)])
  .then(([p, logs]) => {
    if (!cancelled) {
      setForm(toFormState(p))
      setAuditLogs(logs)
    }
  })
```

- [ ] **Step 4: Add refresh helper**

Add inside component:

```ts
async function refreshProjectDetail() {
  if (!id) return
  const [project, logs] = await Promise.all([getProject(id), getProjectAuditLogs(id)])
  setForm(toFormState(project))
  setAuditLogs(logs)
}
```

- [ ] **Step 5: Update save handler**

Require `updatedBy`, then use audited update:

```ts
if (!updatedBy.trim()) {
  setError('Updated by is required.')
  return
}

await updateProjectWithAudit(
  id,
  {
    project_name: form.project_name.trim(),
    start_date: form.start_date || null,
    capital_invested: Number(form.capital_invested) || 0,
    revenue: Number(form.revenue) || 0,
    cost_percentage: Number(form.cost_percentage) || 0,
    split_percentage: Number(form.split_percentage) || 0,
    notes: form.notes || null,
    status: form.status,
  },
  { updated_by: updatedBy },
)
await refresh()
await refreshProjectDetail()
setSavedAt(Date.now())
```

- [ ] **Step 6: Add capital handler**

Add inside component:

```ts
async function handleAddCapital() {
  if (!id) return
  if (!updatedBy.trim()) {
    setError('Updated by is required.')
    return
  }
  const amount = Number(capitalAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    setError('Capital amount must be greater than 0.')
    return
  }

  setAddingCapital(true)
  setError(null)
  try {
    await addProjectCapital(id, {
      amount,
      updated_by: updatedBy,
      note: capitalNote || null,
    })
    setCapitalAmount('')
    setCapitalNote('')
    setShowAddCapital(false)
    await refresh()
    await refreshProjectDetail()
    setSavedAt(Date.now())
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to add capital')
  } finally {
    setAddingCapital(false)
  }
}
```

- [ ] **Step 7: Update archive handler to write audit**

Replace the existing `handleArchive` body with an audited status update:

```ts
async function handleArchive() {
  if (!id) return
  if (!updatedBy.trim()) {
    setError('Updated by is required.')
    return
  }

  setSaving(true)
  setError(null)
  try {
    await updateProjectWithAudit(id, { status: 'archived' }, { updated_by: updatedBy })
    await refresh()
    navigate('/')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to archive')
    setSaving(false)
  }
}
```

- [ ] **Step 8: Add Updated By and Add Capital UI**

Place this near the save controls:

```tsx
<Field label="Updated by">
  <input
    type="text"
    value={updatedBy}
    onChange={(e) => setUpdatedBy(e.target.value)}
    className={inputClass}
    placeholder="Dad, Vish, etc."
  />
</Field>
```

Add near the Capital Invested field or below Details:

```tsx
<button
  type="button"
  onClick={() => setShowAddCapital((value) => !value)}
  className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
>
  Add Capital
</button>

{showAddCapital && (
  <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
    <NumberField
      label="Additional capital (₱)"
      value={capitalAmount}
      onChange={setCapitalAmount}
    />
    <TextField label="Note" value={capitalNote} onChange={setCapitalNote} />
    <button
      type="button"
      onClick={handleAddCapital}
      disabled={addingCapital}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {addingCapital ? 'Adding...' : 'Save Added Capital'}
    </button>
  </div>
)}
```

- [ ] **Step 9: Rename calculated labels**

Update visible labels in the Calculated card:

```tsx
<CalcRow label="Profit Split" value={formatPHP(financials.splitAmount)} />
<CalcRow label="ROI" value={formatPercent(financials.roi)} />
<div className="border-t border-gray-200 pt-3">
  <CalcRow label="Total Return (Profit + Capital)" value={formatPHP(financials.finalAmount)} emphasize />
</div>
```

- [ ] **Step 10: Add Audit Log section**

Add below the main grid:

```tsx
<section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
    Audit Log
  </h2>
  {auditLogs.length === 0 ? (
    <p className="text-sm text-gray-400">No changes recorded yet.</p>
  ) : (
    <ul className="divide-y divide-gray-100">
      {auditLogs.map((log) => (
        <li key={log.id} className="py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-gray-900">{log.action}</p>
            <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('en-PH')}</p>
          </div>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {log.updated_by || 'Unknown'}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{log.details}</p>
        </li>
      ))}
    </ul>
  )}
</section>
```

- [ ] **Step 11: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src/components/ProjectDetail.tsx
git commit -m "feat: add project capital and audit UI"
```

---

### Task 8: Full Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run tests**

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

- [ ] **Step 3: Start local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 4: Manual browser checks**

Check:

- Dashboard no longer shows Cost %, Split %, Total Cost, or Final Amount.
- Dashboard shows Projected Revenue, Days Active, Expected Completion, Status, Profit Split, and Total Return.
- Dashboard rows are ordered by start date.
- Mobile dashboard cards show the new fields without horizontal overflow.
- Project detail save requires Updated by and creates audit rows.
- Add Capital increments Capital Invested and creates an audit row.
- Audit Log shows newest entries first.

- [ ] **Step 5: Commit verification fixes if needed**

If verification required changes:

```bash
git add <changed-files>
git commit -m "fix: polish project tracking updates"
```

If no fixes were needed, do not create an empty commit.
