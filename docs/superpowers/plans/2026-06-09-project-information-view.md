# Project Information View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only project information card separate from calculated financial results.

**Architecture:** Keep calculations untouched. Add a small display-row helper under `src/lib`, cover it with Vitest, and render the rows in `ProjectDetail`.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Vitest.

---

### Task 1: Project Information Rows

**Files:**
- Create: `src/lib/projectInfoRows.test.ts`
- Create: `src/lib/projectInfoRows.ts`
- Modify: `src/components/ProjectDetail.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/projectInfoRows.test.ts` with tests for formatted source information rows.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/projectInfoRows.test.ts`
Expected: FAIL because `projectInfoRows.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/projectInfoRows.ts` exporting `buildProjectInfoRows`.

- [ ] **Step 4: Render rows in detail page**

Import `buildProjectInfoRows` in `src/components/ProjectDetail.tsx`, compute rows from form state, and render a read-only `Information` card apart from the `Calculated` card.

- [ ] **Step 5: Verify**

Run: `npm test -- src/lib/projectInfoRows.test.ts`
Run: `npm run build`
