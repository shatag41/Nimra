# Production optimization report

Date: 2026-07-03

## Implemented

- Added a five-minute Apps Script cache for the public banners, products, FAQs,
  company information, and combined CMS reads. Cache entries are invalidated by
  the existing CRUD paths. Values near Apps Script's per-key size limit bypass
  caching safely, and malformed cache entries self-heal.
- Batched notification ID repairs. A repair of `N` rows now performs one Sheet
  write instead of up to `N` writes.
- Batched missing Users and UserAddresses header creation. Adding `N` headers now
  performs one Sheet write instead of `N` writes.
- Batched legacy user-address column updates. Updating `N` address fields now uses
  one row read and one row write instead of `N` writes.
- Removed request/payload debug logging from the web proxy and mobile API. This
  avoids production log I/O and prevents order, product, banner, and OTP-related
  values from being emitted to logs.
- Removed unused CMS type imports.

## Removed inventory

- Files: none. `nimra-web/old_apps-script.js` appears unreferenced but is retained
  because repository references alone cannot prove that it is not a deployment
  backup.
- Functions: none. Three declarations each of `getNotificationsData` and
  `handleNotificationCRUD` were found. JavaScript currently resolves these to the
  final declarations; deleting the older implementations requires deployed-sheet
  regression verification.
- Dependencies: none. All web runtime dependencies are referenced. Mobile's
  `@expo/ngrok` is a CLI capability, and `react-native-screens` is a navigation
  peer/runtime dependency, so source-import analysis alone is insufficient for
  safe removal.
- Assets: none. `nimra-web/public/rush-soda-can.png` and the root `photos/` files
  are unreferenced by application source, but may be source/marketing assets.
- Sheets/tabs: the legacy `Notifications` tab is now removed automatically after
  its rows are safely migrated to `Events`. Run `removeLegacyNotificationsTab`
  once from the deployed Apps Script editor to perform the cleanup immediately.
  No columns were removed because no live spreadsheet connection was available.

## Google Sheets schema audit

Code actively uses these tabs: Banners, Products, FAQs, CompanyInfo, Inquiries,
Orders, CancellationRequests, Users, UserAddresses, Events, and Carts. The old
Notifications tab is only a migration source and is deleted after successful
migration.

The setup and migration code deliberately recognizes legacy order, notification,
user, and address column aliases. Reordering or deleting live columns without
reading formulas, validations, named ranges, triggers, and external integrations
would not meet the no-functionality-change requirement. The project therefore
makes no destructive live-schema change.

## Verification and metrics

- Baseline Next.js production build: passed; 51.4 seconds total, 19.1 seconds
  compilation, 17.0 seconds TypeScript, 18 routes/pages generated.
- Optimized Next.js production build: passed; 38.9 seconds total, 13.3 seconds
  compilation, 15.5 seconds TypeScript, the same 18 routes/pages generated. This
  run was 24.3% faster overall; build timings naturally vary between warm runs.
- Apps Script and setup script syntax: passed with `node --check`.
- Expo/mobile TypeScript: passed with `tsc --noEmit`.
- Baseline web lint: 173 findings (101 errors, 72 warnings). Most are pre-existing
  strict typing and React effect findings; the production Next.js build still
  type-checks successfully.
- Sheet service calls on cached public reads: reduced from at least one sheet read
  per request to zero on cache hits for up to five minutes.
- Notification repair writes: up to `N` calls before, one call after.
- Header migration writes: up to `N` calls before, one call after.
- Address compatibility writes: up to `N` calls before, two service calls after.

Metrics are static/build measurements. Live latency, memory, cache-hit ratio, and
Apps Script execution counts require production telemetry and a deployed Sheet.
