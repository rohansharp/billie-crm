# Story 1.2: Command Palette UI Component

**Status:** done

## Story

As a **support staff member**,
I want to press Cmd+K (or Ctrl+K) to open a search palette,
so that I can quickly search without clicking through menus.

## Acceptance Criteria

1. ✅ **Given** I am on any page in the Payload admin
   **When** I press Cmd+K (Mac) or Ctrl+K (Windows)
   **Then** a centered modal search palette opens with focus on the input field

2. ✅ **Given** the command palette is open
   **When** I press Escape or click outside
   **Then** the palette closes

3. ✅ **Given** the command palette is open
   **When** I type text
   **Then** the input updates and shows a loading indicator while searching

4. ✅ **Given** the command palette is closed
   **When** I press F7 (global search hotkey from UX spec)
   **Then** the command palette opens

## Tasks / Subtasks

- [x] **Task 1: Create command palette UI component** (AC: 1, 2, 3)
  - [x] Create `src/components/ui/CommandPalette/CommandPalette.tsx` using `cmdk`
  - [x] Add `src/components/ui/CommandPalette/styles.module.css` (centered modal + overlay)
  - [x] Add barrel export `src/components/ui/CommandPalette/index.ts`
  - [x] Add barrel export `src/components/ui/index.ts`

- [x] **Task 2: Global hotkeys + open/close state** (AC: 1, 2, 4)
  - [x] Implement `useGlobalHotkeys` hook (Cmd+K / Ctrl+K / F7 / Esc)
  - [x] Add open state to `src/stores/ui.ts` (e.g., `commandPaletteOpen`, `setCommandPaletteOpen`)
  - [x] Ensure input is focused on open

- [x] **Task 3: Wire command palette into Payload admin globally** (AC: 1)
  - [x] Render `<CommandPalette />` inside `src/providers/index.tsx` so it exists on every admin page
  - [x] Confirm it works in Payload admin routes (`/admin/...`)

- [x] **Task 4: Loading indicator contract (for Story 1.3)** (AC: 3)
  - [x] Define component prop `isSearching: boolean` and show a spinner/"Searching..." row when true
  - [x] Define prop `query: string` and `onQueryChange(next: string)` so Story 1.3 can plug in API

- [x] **Task 5: Tests** (AC: 1, 2, 4)
  - [x] `tests/unit/ui/command-palette.test.tsx`: opens on Cmd+K/Ctrl+K/F7 and closes on Esc

## Dev Notes

### UX/Accessibility requirements

- Command palette is a **modal** (focus trapped), centered.
- Hotkeys:
  - `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)
  - `F7` also opens (per `docs/epics.md`)
  - `Escape` closes
- Must be keyboard navigable (cmdk supports arrow + Enter by default).

### Implementation constraints

- **Must render globally inside Payload admin** via our existing provider registration:
  - `src/payload.config.ts` → `admin.components.providers: ['@/providers']`
  - `src/providers/index.tsx` is the correct place to mount global UI like the palette.

### Suggested component API (to avoid rework in Story 1.3)

```ts
export interface CommandPaletteProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void

  query: string
  onQueryChange: (next: string) => void

  isSearching: boolean
  children?: React.ReactNode // results list rows injected by Story 1.3
}
```

### Styling

- Use CSS Modules, max width ~600px, comfortable padding.
- Add a semi-opaque overlay behind the modal.

### References

- [Source: docs/epics.md#Story 1.2: Command Palette UI Component]
- [Source: docs/ux-design-specification.md] (Cmd+K command palette patterns)
- [Source: docs/project_context.md] (component + CSS modules conventions)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Anthropic)

### Debug Log References

- None (clean implementation)

### Completion Notes

- All 4 acceptance criteria satisfied
- 14 new tests added (9 component tests, 5 hook/store tests)
- All 133 tests pass (including 14 new tests)
- Next.js build compiles successfully
- ESLint passes (with pre-existing warnings)
- Command palette globally available in Payload admin via `admin.components.providers`
- Props API designed for Story 1.3 integration (query, onQueryChange, isSearching, children)
- Added `@testing-library/jest-dom` dev dependency for test matchers
- Added `ResizeObserver` mock in vitest.setup.ts (required by cmdk)
- Updated vitest.config.mts to include `.test.tsx` files

### Files Created

1. `src/components/ui/CommandPalette/CommandPalette.tsx` - Command palette component using cmdk
2. `src/components/ui/CommandPalette/styles.module.css` - CSS Modules styling (centered modal, overlay, animations)
3. `src/components/ui/CommandPalette/index.ts` - Barrel export
4. `src/components/ui/index.ts` - UI components barrel export
5. `src/hooks/useGlobalHotkeys.ts` - Global hotkeys hook (Cmd+K, Ctrl+K, F7, Escape)
6. `src/hooks/index.ts` - Hooks barrel export
7. `tests/unit/ui/command-palette.test.tsx` - 9 component unit tests
8. `tests/unit/hooks/useGlobalHotkeys.test.ts` - 5 hook unit tests

### Files Modified

1. `src/providers/index.tsx` - Added GlobalCommandPalette wrapper component
2. `src/stores/ui.ts` - Added commandPaletteOpen/Query state
3. `vitest.config.mts` - Added `.test.tsx` to include patterns
4. `vitest.setup.ts` - Added jest-dom matchers and ResizeObserver mock
5. `package.json` - Added `@testing-library/jest-dom` dev dependency
6. `pnpm-lock.yaml` - Updated lockfile

### Change Log

- 2025-12-11: Initial implementation of Story 1.2 - Command Palette UI Component
- 2025-12-11: Senior code review fixes (memoization, query reset, test cleanup)

---

## Senior Developer Review (AI)

**Reviewer:** Rohan  
**Date:** 2025-12-11  
**Outcome:** Approved with fixes applied

### Findings & Resolutions

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | 🔴 HIGH | Stale closure + effect re-runs in `useCommandPaletteHotkeys` | ✅ Fixed: Memoized hotkeys array with `useMemo` and callbacks with `useCallback` |
| 2 | 🟠 MEDIUM | Query reset logic always empty string | ✅ Fixed: Now resets only on open, preserves on close |
| 3 | 🟠 MEDIUM | Placeholder tests provide no value | ✅ Fixed: Removed and replaced with comment |
| 4 | 🟠 MEDIUM | Missing test for "no results" state | ✅ Fixed: Added test case |
| 5 | 🟡 LOW | Focus trap not implemented | ⏳ Deferred: Acceptable for MVP, tracked as tech debt |

### Tech Debt Notes

- **Focus Trap:** Command palette should implement focus trapping for full accessibility (WCAG 2.1 AA). Can be addressed in a polish sprint using `@radix-ui/react-focus-scope` or similar.
