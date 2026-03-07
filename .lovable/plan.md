
Issue diagnosis:
- Do I know what the issue is? Yes.
- Root cause is an infinite logging loop between `src/lib/logger.ts` and `src/utils/sentry.ts`:
  1) `logger.error(...)` always calls `sendToMonitoring(...)`
  2) `sendToMonitoring` dynamically imports `captureException(...)`
  3) `captureException` (when no DSN / non-production) calls `logger.error('Exception (not sent to Sentry)', ...)`
  4) This recursively re-enters step 1, producing the massive repeated message chain.

Implementation plan:

1) Break recursion at the source (`src/utils/sentry.ts`)
- Remove logger-based fallback inside `captureException` / `captureMessage`.
- In non-production or missing DSN, return early (or use plain `console.error/console.warn` only, never `logger`).
- Wrap `Sentry.captureException` / `Sentry.captureMessage` in `try/catch` to prevent secondary crashes.

2) Add strict monitoring gate in logger (`src/lib/logger.ts`)
- In `sendToMonitoring`, short-circuit unless:
  - `import.meta.env.MODE === 'production'`
  - `VITE_SENTRY_DSN` exists
- This prevents any Sentry forwarding attempt in dev/staging when not configured.

3) Add anti-recursion safety guard (`src/lib/logger.ts`)
- Add a small re-entrancy flag (`isForwardingToMonitoring`) so if monitoring forwarding itself fails, logger does not recursively re-enter forwarding.

4) Improve error payload construction (`src/lib/logger.ts`)
- Avoid creating chained messages like `A: B: C...` by sending:
  - `message` unchanged
  - error details in context/extra field
- Keep one clean console line per error.

5) Validate the fix
- Trigger one `logger.error` path (e.g. voice connection failure) and confirm only a single/few logs appear.
- Confirm no repeated `Exception (not sent to Sentry)` flood.
- Confirm voice agent flow still connects/disconnects normally and toasts still show expected errors.

Technical details (for implementation quality):
- Files to update: `src/utils/sentry.ts`, `src/lib/logger.ts`
- No database/schema changes required.
- This is a runtime safety and observability fix; behavior of user-facing features stays unchanged except removal of console flood and performance degradation from recursive logging.
