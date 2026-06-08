# Dashboard Overall View Design

## Goal

Add an overall dashboard view where users can see every active project's source information and calculated financial results at once.

## Design

Keep the existing dashboard summary cards at the top. Add an `All Projects` table below them with one row per active project. Each project name links to its detail page.

The table columns are: Project, Start Date, Capital, Revenue, Cost %, Split %, Total Cost, Profit, ROI, and Final Amount. Archived projects remain excluded because the current dashboard summary is active-project focused.

On smaller screens, the table uses horizontal scrolling so the financial columns remain readable.

## Testing

Add a Vitest-covered row builder that converts projects into formatted overview rows, including calculated values. `Dashboard` will render those rows.
