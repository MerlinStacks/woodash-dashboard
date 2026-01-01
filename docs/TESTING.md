# Testing Strategy

## Current Status
Testing is currently focused on critical utility functions.

## Unit Tests (`apps/web/src/tests/`)
We use **Jest** (implied by `.test.js` extension) for unit testing logic that is complex and risk-prone.

### Key Test Suites
1.  **`backupService.test.js`**:
    *   Validates JSON export/import logic.
    *   Ensures data integrity when migrating data between browsers.
2.  **`reportService.test.js`**:
    *   Tests the aggregation logic for Analytics.
    *   Verifies that "Total Sales" and "Average Order Value" calculations are mathematically correct.

## Future Roadmap (Recommended)
1.  **E2E Testing:** Implement Playwright to test the "Critical Paths":
    *   Login Flow.
    *   Sync Worker trigger.
    *   Invoice PDF generation.
2.  **Component Testing:** React Testing Library for shared UI components (`packages/ui` once populated).
