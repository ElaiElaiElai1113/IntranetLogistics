# Dashboard Overall View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show all active projects and their key source/calculated values in one dashboard table.

**Architecture:** Add a pure row-builder helper under `src/lib`, test it with Vitest, then use it in `Dashboard` to render a responsive table under the existing summary cards.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Vitest.

---

### Task 1: Overview Rows

**Files:**
- Create: `src/lib/projectOverviewRows.test.ts`
- Create: `src/lib/projectOverviewRows.ts`
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Write the failing test**

Create a Vitest test proving a project is converted into formatted source and calculated table values.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/projectOverviewRows.test.ts`
Expected: FAIL because `projectOverviewRows.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/projectOverviewRows.ts` with `buildProjectOverviewRows(projects)`.

- [ ] **Step 4: Render table**

Use `buildProjectOverviewRows(active)` in `Dashboard` and render an `All Projects` table under the summary cards.

- [ ] **Step 5: Verify**

Run: `npm test`
Run: `npm run build`
