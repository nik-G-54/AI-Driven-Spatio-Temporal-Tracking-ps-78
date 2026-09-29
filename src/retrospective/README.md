# Retrospective AI Validation — developer note

Route: `/retrospective` (empty state) and `/retrospective/:caseId`.
Purpose: compare **Forecast (NWP)**, **AI output** and **Reference** for a historical case. This is separate from
Historical Replay (`/historical-replay`), which is track/event-evolution oriented.

**Status: Phase 1 foundation. All data is mock / simulated. No ML model, no real NWP, no real observations.**

| What | Where |
|---|---|
| Data contract (TypeScript) | `src/retrospective/retrospective.types.ts` |
| Adapter (the only data entry point) | `src/retrospective/retrospective.api.ts` |
| Mock data | `src/mockData/retrospective/cases.json` |
| Page | `src/retrospective/Retrospective.tsx` |
| Components | `src/retrospective/components/` |
| Helpers | `src/retrospective/retrospective.utils.ts` |
| Route / nav | `src/App.tsx`, `src/shared/Sidebar.tsx` |

## Data flow

```
cases.json  (+ region bounds reused from historicalReplay/mapLayers.json)
   ↓  toContract()  in retrospective.api.ts
RetrospectiveCase  (contract)
   ↓  getRetrospectiveCase(caseId)
Retrospective.tsx  (React state)
   ↓
components
```

## Replacing mock data with real data

The replacement point is `retrospective.api.ts`. Keep the two exported functions and their return types:

- `getRetrospectiveCases(): Promise<RetrospectiveCaseOption[]>`
- `getRetrospectiveCase(caseId): Promise<RetrospectiveCase>`

Reimplement them (e.g. `fetch('/api/retrospective/cases/...')` or loading exported model output) and delete the
mock-only code (`MOCK_CASES`, `expandField`, `toContract`, `buildValidation`). Components import only from the types
file / adapter, so they should not need changes.

When real values exist, set `provenance.isMock = false` and the appropriate `kind`, and set a metric's `status`
to `'computed'` only if it comes from a documented experiment.

## Rules

- Never present mock values as real results. UI labels must say "Simulated" while `provenance.isMock` is true.
- Use the labels "Forecast (NWP)", "AI output" and "Reference".
- `validation` metrics with `status: 'pending'` have `null` values; do not fill them with invented numbers.
