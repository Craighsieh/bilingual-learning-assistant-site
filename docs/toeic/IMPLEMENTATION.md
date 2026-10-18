# 免費 TOEIC 專區 — approved 2026-10-18

Source: owner-approved plan in the current Codex chat. Codex owns source/test changes; DeepSeek and Muse independently review the same frozen candidate. Original source trees preserved; owner subsequently authorized scoped publication under ACCEPTANCE_SCOPE.json; use isolated release checkout only.

## Observable acceptance criteria

- AC1: Catalog is prac01–02 + mock01–05 from Core12, seven complete 200-question forms; 1,400 unique question IDs, complete current Traditional Chinese explanations and verified media hashes. Preserve groups/documents/graphics, Part2 ABC and source-to-catalog remapping. Never export QA records, prompts, workstation paths or credentials.
- AC2: Account/extension-free zh-Hant catalog, whole-form or Part practice, resume and Part progress. Practice confirms by complete group before review; mocks conceal review until submit. Replayable user-started audio with bounded prefetch and recoverable errors. Mobile single column / desktop reading and answers; accessible navigation, flags and image zoom.
- AC3: Local IndexedDB only; explicit memory fallback, content-version isolation, one editing tab per attempt, immutable submitted answers/results, new attempt on retry. Clear local data only via explicit user action. No personal data or answering telemetry.
- AC4: Results include correct/unanswered counts, per-Part correct/unanswered counts and overall active elapsed time, wrong-only review, explanations/transcripts and source skill learning focus, without uncalibrated TOEIC score claims.
- AC5: Honest App intro: Toeic 多益考前站 / TOEIC PrepStation, two practices + ten mocks, five overlap the website; App plan unlocks unchanged. Default preparing state with no false download CTA. Verified configured App Store/TestFlight URL enables download and local QR. No progress sync promise.
- AC6: Add only TOEIC entry links/section to current homepage and generated/localized TOEIC guide, dedicated privacy, canonical/sitemap and relative base-safe routes. Produce a scoped release overlay without unrelated Studio/cloud edits.
- AC7: Focused red-green, relevant complete suite/type/build, independent provider Standards+Spec reviews and browser flows. The owner explicitly approved release based on iOS Simulator Safari plus desktop mobile-viewport acceptance on 2026-10-18; physical iPhone Safari/Android Chrome remain NOT_RUN, deferred follow-up, never reported as passed. Owner redistribution-rights confirmation is recorded in RIGHTS_OWNER_CONFIRMATION.json. Deployment is authorized only after the accepted checks pass; see ACCEPTANCE_SCOPE.json.
- AC8 (owner revision 2026-10-18): /toeic/feedback/ and per-question links invite reports about mistakes, explanations, audio/images and unclear questions. Submit anonymously on-site through FormSubmit to the owner-confirmed recipient, without GitHub or visitor registration. Include only chosen catalog form, display question, category, content version, typed description and report reference. No visitor email or answer uploads. Require real receiving evidence, honest pending/failure/retry states and third-party privacy disclosure; see DIRECT_FEEDBACK.md for the changed write/recovery contract. Retain a continue-practicing path and mobile/keyboard accessibility.

## Implementation slices

1. Export and validate existing accepted Core12 content; public whitelist plus version/hash manifest. Test seam: pure exporter + actual output audit.
2. One complete prac01 user flow: session/review engine, IndexedDB repository, version fencing and exclusive editor lease, player, renderer. Test seam: public engine/repository APIs and DOM interactions.
3. Seven-form catalog, results, app config/QR, guides/navigation/privacy. Test seam: generated route/asset checks and browser flows.
4. Frozen isolated candidate: independent DeepSeek+Muse review/verification, scoped fixes/delta review; optimistic per-file integration into live website followed by hash comparison. All actual logs retained by coordinator.

## Safety/design decisions

Public static practice is not a proctored examination; answer JSON is public but never rendered before the selected mode permits. No backend authentication, payments or secret material are introduced. Stored attempts contain only local answer keys, flags, position and elapsed active time. New database namespace, content-version keys, terminal-state checks and atomic lease fencing protect unrelated browser data and prevent stale-tab overwrites. The export is a derived copy and never changes App content or entitlements.

Seven forms have 378 existing MP3 and 42 PNG (~220 MiB); landing downloads only catalog. Do not regenerate/re-review accepted content/audio. On 2026-10-18 the owner explicitly confirmed that all seven forms, audio and images may be publicly redistributed (「全部皆可公開再散布」). The rights-documentation gate is satisfied by this direct owner attestation, recorded in RIGHTS_OWNER_CONFIRMATION.json; this reply does not authorize deployment. No bulk content upload to review providers is required: engineering review uses source, tiny synthetic fixtures, counts/hashes and acceptance receipts.
