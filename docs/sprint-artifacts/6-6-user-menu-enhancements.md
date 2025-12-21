# Story 6.6: User Menu Enhancements

**Status:** done

---

## Story

As a **support staff member**,
I want to view my recent activity from the user menu,
So that I can review actions I've taken.

---

## Background

**SCOPE REDUCED** - Payload provides most user menu functionality natively:
- ✅ User name and email display
- ✅ Sign Out functionality
- ✅ Account settings link

**What we add:**
- 🆕 "My Activity" link in settings menu to filtered view of user's actions

---

## Acceptance Criteria

### AC1: Settings Menu Link

```gherkin
Given I click on the gear icon in Payload's sidebar (above logout)
When the settings popup opens
Then I see a new "My Activity" option
```

### AC2: My Activity Navigation

```gherkin
Given I click "My Activity"
When the link navigates
Then I go to /admin/my-activity
```

### AC3: Filtered Activity View

```gherkin
Given I am on the My Activity page
When viewing my activity list
Then I see only write-off requests I submitted or approved/rejected
  And items are sorted by most recent first
```

---

## Tasks / Subtasks

- [x] **Task 1: Create My Activity page**
  - [x] 1.1 Create `/admin/my-activity` page route
  - [x] 1.2 Create MyActivityView component with user filtering
  - [x] 1.3 Display submitted requests (requestedBy = me)
  - [x] 1.4 Display approved/rejected by me (decidedBy = me)
  - [x] 1.5 Filter dropdown (All / Submitted / Decided)

- [x] **Task 2: Create Settings Menu Component**
  - [x] 2.1 Create `src/components/navigation/NavSettingsMenu/index.tsx`
  - [x] 2.2 Use Payload's `PopupList.Button` for "My Activity" link
  - [x] 2.3 Link to `/admin/my-activity`

- [x] **Task 3: Register in Payload Config**
  - [x] 3.1 Add `settingsMenu` to `admin.components`

- [x] **Task 4: Write unit tests** (10 tests)
  - [x] 4.1 Test not logged in state
  - [x] 4.2 Test loading state
  - [x] 4.3 Test empty states
  - [x] 4.4 Test activity list rendering
  - [x] 4.5 Test filter dropdown
  - [x] 4.6 Test error handling

---

## Dev Notes

### Payload Settings Menu Configuration

```ts
admin: {
  components: {
    settingsMenu: ['@/components/navigation/NavSettingsMenu#NavSettingsMenu'],
  },
}
```

### Settings Menu Component Pattern

```tsx
'use client'
import { PopupList } from '@payloadcms/ui'

export function NavSettingsMenu() {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => window.location.href = '/admin/my-activity'}>
        My Activity
      </PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
```

### My Activity - Data Sources

The My Activity page aggregates data via two parallel TanStack Query calls:
1. **Write-off requests I submitted** - filter by `requestedBy.id` = current user ID
2. **Write-off requests I decided** - filter by `approvalDetails.decidedBy` = current user ID

Results are combined and sorted client-side by action date (newest first).

---

## References

- [Source: docs/epics.md - Story 6.6 definition]
- [Payload v3 Settings Menu docs]

---

## Dev Agent Record

### Context Reference

Story: 6.6 User Menu Enhancements
Epic: 6 - Navigation UX

### Agent Model Used

Claude Opus 4.5

### Completion Notes

**Implementation completed 2025-12-11**

- Created "My Activity" page showing user's write-off request activity
- Added NavSettingsMenu component with "My Activity" link
- Registered in Payload's settingsMenu (gear icon above logout)
- All 935 tests passing (10 new tests)

**Features:**
1. Settings menu integration (📋 My Activity link)
2. Activity view showing submitted and decided requests
3. Filter dropdown (All / Submitted / Decided)
4. Activity cards with customer links
5. Pending badge for unresolved requests
6. Breadcrumb navigation

**Code Review Fixes (2025-12-11):**
- Added `filter` to query keys for correct cache invalidation
- Removed unused `userName` prop
- Updated Dev Notes documentation to match implementation

### File List

**New Files:**
- `src/components/navigation/NavSettingsMenu/index.tsx` - Settings menu component
- `src/app/(payload)/admin/my-activity/page.tsx` - Page route
- `src/components/MyActivityView/index.tsx` - Main view component
- `src/components/MyActivityView/styles.module.css` - Styling
- `tests/unit/ui/my-activity.test.tsx` - 10 unit tests

**Modified Files:**
- `src/payload.config.ts` - Added settingsMenu configuration
