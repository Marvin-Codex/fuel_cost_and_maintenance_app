# Android App Changelog

Repository path: `android/`

Purpose: Track tasks, decisions, and progress specific to the Android/native client.

Format: Each entry is a single line starting with ISO date, short status tag in brackets, and a concise description.
Example: `2026-09-26 [DONE] Created changelog and updated global todo list.`

Maintainer: (update with assignee)

---

2026-09-26 [DONE] Created Android changelog (`docs/CHANGELOG_ANDROID.md`). Next: inspect `android/` project structure and verify build.

2026-09-26 [DONE] Inspected Android project structure; standard Flutter Gradle setup and package ID confirmed.

2026-09-29 [BLOCKED] Android build verification is blocked because no Gradle wrapper is present and `flutter build apk` did not return usable output; Flutter 3.22.3 is installed.
2026-09-30 [IN PROGRESS] Setting up the Gradle wrapper for the Android project to enable building and running the app.
2026-09-30 [TODO] Implement offline functionality for fuel records, trips, and maintenance features.
2026-09-30 [TODO] Ensure all necessary permissions are declared in the AndroidManifest.xml file.
2026-09-30 [TODO] Conduct thorough testing of offline functionality to ensure reliability.

2026-09-26 [TODO] Add offline DB (Drift/SQFlite) schema mirroring server models and a local sync queue.

2026-09-26 [TODO] Implement GPS trip capture service (foreground tracking, point filtering, batching upload).

---

2026-09-29 [IN-PROGRESS] Replaced the stale Flutter counter test with dashboard and add-vehicle coverage as the first Android app development slice.

2026-09-29 [BLOCKED] Focused `flutter test test/widget_test.dart` could not run because `flutter` is unavailable on the current PowerShell `PATH`; static diagnostics report no errors in `lib/main.dart` or `test/widget_test.dart`.

2026-09-29 [BLOCKED] Gradle wrapper generation could not run because the wrapper scripts/JAR are absent and no system `gradle` executable is installed; `gradle-wrapper.properties` is present and targets Gradle 7.6.3.

2026-09-29 [DONE] Restored `gradlew`, `gradlew.bat`, and `gradle-wrapper.jar` from the installed Flutter SDK; removed Android ignore rules so the wrapper can be committed.

2026-09-29 [BLOCKED] Wrapper execution could not be confirmed because Gradle 7.6.3 download/output did not complete through the current terminal session; retry `android\gradlew.bat --version` when network access is available.

2026-09-29 [TODO] Add Android location permissions only when GPS trip capture is implemented; the main manifest currently declares none.

2026-09-29 [DONE] Confirmed Android dependencies already include `geolocator`, Drift/SQLite, connectivity, notifications, and secure storage in `pubspec.yaml`.

2026-09-29 [IN-PROGRESS] Added `Vehicle` domain model and `LocalVehicleStore`; the dashboard now uses a local-first vehicle collection instead of owning raw strings in the widget state.

2026-09-29 [IN-PROGRESS] Added the first offline fuel-record slice with `FuelRecord`, `LocalFuelStore`, validation, dashboard count, and Android widget coverage.

2026-09-29 [DECISION] Vehicle setup will support preloaded manufacturer/model presets containing engine specifications, fuel type, tank capacity, and reference fuel consumption; users may still add or edit vehicles manually.

2026-09-29 [DECISION] Initial fuel estimates will use deterministic vehicle specifications and recorded fuel data; personalized ML predictions remain deferred until sufficient real trip and fuel history exists.

2026-09-29 [TODO] Define a versioned local vehicle preset catalog and extend the `Vehicle` model with manufacturer, model, year, engine, fuel type, tank capacity, and reference consumption fields.

2026-09-29 [IN-PROGRESS] Expanded vehicle coverage to cars, SUVs, pickups, trucks, motorcycles, vans, buses, and utility vehicles with structured specifications and offline presets.

2026-09-29 [IN-PROGRESS] Added deterministic estimated-range and full-tank-cost calculations from vehicle specifications; vehicle cards now display these estimates using an explicit example fuel price.

2026-09-29 [DONE] Replaced the hard-coded estimate price with a user-editable local fuel price setting; vehicle full-tank estimates now recalculate immediately from that setting.

2026-09-29 [DONE] Expanded the offline fuel screen to show saved purchase history, litres, cost, odometer, and calculated cost per litre; added `FuelRecord.costPerLitre` coverage.

2026-09-29 [DONE] Connected the dashboard metrics to local fuel records; total recorded fuel cost and weighted average cost per litre now update after an offline purchase.

2026-09-29 [DONE] Added a local settings currency selector with UGX as the default; selected currency codes now appear on fuel prices, estimates, history, and dashboard metrics.

Guidelines:
- Update this file at every turn with a new dated entry reflecting actions taken.
- Keep entries brief; use `[TODO]`, `[IN-PROGRESS]`, `[DONE]`, `[BLOCKED]` tags.
- When blocking issues arise, add a short `BLOCKED` entry with the reason and suggested remediation.
- Update this file at every turn with a new dated entry reflecting actions taken.
- Keep entries brief; use `[TODO]`, `[IN-PROGRESS]`, `[DONE]`, `[BLOCKED]` tags.
- When blocking issues arise, add a short `BLOCKED` entry with the reason and suggested remediation.
