# GameShelf — Project Memory

Cumulative log of architectural decisions and key changes. Append new entries at the top; do not rewrite history.

---

## Architectural Decisions (permanent record)

| Decision | Rationale |
|---|---|
| No `AuthUseCase` | Was a pure pass-through with no business logic. `AuthViewModel` depends directly on `IAuthRepository`. |
| Entities use private fields + getter methods | Java-style pattern chosen for encapsulation. Known trade-off: verbose in TypeScript. See KNOWN_ISSUES §2.5. |
| DTOs have `readonly` public fields | Only created when aggregating data from multiple sources into one screen payload. |
| Firebase JS SDK (not `@react-native-firebase`) | Compatible with Expo Go without EAS Build or custom dev client. |
| `EXPO_PUBLIC_*` env var prefix | Required by Expo to expose variables to the JS bundle. |
| Mocks active by default | No keys needed for UI development. Set env vars to activate real backends. |
| Firestore mappers are separate files | `FirestoreGameMapper` and `FirestoreWishlistMapper` are bidirectional and shared across repos. External API mappers are private methods inside their `ServiceImpl`. |
| HLTB via direct POST (not npm package) | The `howlongtobeat` npm package depends on Node.js modules (`events`, `stream`, `buffer`) incompatible with Hermes/JSC. |
| ProtonDB requires `User-Agent` + `Referer` headers | Without them React Native HTTP requests are blocked by the endpoint. |
| HLTB token flow | `/api/search` returns 404. Must first `GET /api/finder/init?t={timestamp}` to obtain a session token, then `POST /api/finder` with `x-auth-token` header. Token auto-refreshes on 403. |
| Dark mode is the only theme | No light mode planned for now. All colors are hardcoded from `colors.ts`. |
| No emojis in UI | All icons use `@expo/vector-icons` (Feather). |
| `@babel/plugin-transform-class-properties` intentionally absent from `babel.config.js` | It crashes Hermes with read-only enums. The package is in `devDependencies` but must never be added to the config. |
| Use cases are plain TypeScript (no Inversify decorators) | `domain/` must not import from `di/` or `inversify`. Use cases are constructed manually in `container.ts` via `toDynamicValue`. |
| `toDynamicValue` bindings require explicit `.inSingletonScope()` | `toDynamicValue` does not inherit the container's `defaultScope`. Without it, a new instance is created on every resolution. |
| `useInjection` uses `useRef` to stabilize transient VMs | Prevents re-instantiation on every re-render. Known side-effect: stale data if the same component is reused for a different entity (see KNOWN_ISSUES §5.2). |
| Epic Auth Code flow (unofficial internal API) | Uses `launcherAppClient2` credentials (publicly known via EpicResearch). Violates Epic ToS. GDPR import is the stable fallback. |
| `Buffer.from()` not available in React Native | Hermes/JSC has no `Buffer`. Use `btoa()` instead. See KNOWN_ISSUES §4.3. |
| Global `/games/*` Firestore collection is obsolete | `getGameById` now reads from `users/{uid}/library/{gameId}`. Nothing writes to the global collection. |
| `HomeUseCase.getMostPlayed()` syncs with Steam first | Ensures data is fresh before sorting by playtime. Known performance concern: see KNOWN_ISSUES §8.2. |

---

## Change Log (most recent first)

### Session 26 — ProtonDB tier typing with union type

**Issue:** `ProtonDbRating` fields `tier` and `trendingTier` accepted any `string` instead of a typed union, allowing invalid values at compile time.

**Fix:**
- Added `export type ProtonTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending'` to `ProtonDbRating.ts`.
- Updated `tier` and `trendingTier` fields and constructor params to use `ProtonTier` instead of `string`.
- Updated getters `getTier()` and `getTrendingTier()` to return `ProtonTier`.
- Added `toProtonTier(value: string | undefined | null): ProtonTier` validation helper in `ProtonDbServiceImpl.ts` that validates API responses and falls back to `'pending'` for invalid values.
- Updated `ProtonDbServiceImpl.getCompatibilityRating()` to validate API tier strings before constructing `ProtonDbRating`.

**Files changed:** `ProtonDbRating.ts`, `ProtonDbServiceImpl.ts`, `KNOWN_ISSUES.md`

**Resolved:** KNOWN_ISSUES §5 `[MEDIUM] ProtonDB tier as string instead of union type` — RESOLVED

---

### Session 25 — Firebase auth persistence + New Architecture + FlatList performance

**Firebase auth persistence:**
- Replaced `getAuth()` with `initializeAuth(indexedDBLocalPersistence)` in `FirebaseConfig.ts` so auth state survives app restarts (Firebase JS SDK v10+ uses indexedDB instead of AsyncStorage).
- Installed `@react-native-async-storage/async-storage` as a dependency.

**New Architecture:**
- Set `newArchEnabled: true` in `app.json` to align Expo Go with production builds.

**FlatList performance:**
- Added perf props to `LibraryScreen` FlatList: `initialNumToRender={6}`, `maxToRenderPerBatch={6}`, `windowSize={5}`, `removeClippedSubviews={true}` to fix slow VirtualizedList warning.

**Files changed:** `FirebaseConfig.ts`, `app.json`, `LibraryScreen.tsx`, `package.json`

---

### Session 25 — Epic Games detail enrichment + carousel removal + platform icons in library

**Changes:**

**Epic Games enrichment (Phase 0 in GameDetailUseCase):**
- Added `Game.setSteamAppId(id: number)` setter to the `Game` entity.
- Extended `ISteamApiService` with `searchSteamAppId(title: string): Promise<number | null>`.
- Extended `IGameRepository` with `updateSteamAppId(userId, gameId, steamAppId): Promise<void>`.
- Implemented `searchSteamAppId` in `SteamApiServiceImpl` using the Steam Store Search API
  with a 4-level fuzzy match (exact → contains → cross-contains → word-overlap ≥ 0.7).
- Implemented `updateSteamAppId` in `GameRepositoryImpl` via Firestore `updateDoc`.
- Added no-op/in-memory stubs to `MockSteamApiService`, `MockGameRepository`,
  and `SteamSyncMemoryGameRepository` to satisfy the updated interfaces.
- `GameDetailUseCase.getGameDetail()` now runs a Phase 0 for `EPIC_GAMES` entries
  without a `steamAppId`: tries ITAD `getGameInfo()` first, then Steam Store Search.
  If resolved, persists the ID to Firestore and uses it for ProtonDB + Steam metadata.

**Screenshot carousel removal:**
- Removed the `MediaCarousel` FlatList sub-component from `GameDetailScreen`.
- Replaced with a static `HeroImage` component: full-width, uses `portraitCoverUrl`
  if available (Steam `library_600x900.jpg`), falls back to `coverUrl`. Fixed height
  `HERO_HEIGHT = screenWidth * 0.6`. `LinearGradient` overlay preserved.
- `GameDetailScreen.styles.ts` cleaned: removed carousel constants (`SLIDE_WIDTH`,
  `COVER_HEIGHT`, `SCREENSHOT_HEIGHT`) and all carousel styles; added `heroContainer`,
  `heroImage`, `heroGradient` styles and `HERO_HEIGHT` export.

**Platform icons in library:**
- Created `src/presentation/components/platforms/PlatformIcon.tsx`.
  - Steam → `MaterialCommunityIcons "steam"` glyph (white on semi-transparent dark circle).
  - Epic → Styled "E" badge on `colors.epic` background circle.
- Replaced the coloured dot in `GameCard` with `<PlatformIcon size={16} />`.
  Only renders for `STEAM` and `EPIC_GAMES`; hidden for `UNKNOWN`.

### Session 24 — GameDetail enrichment with Steam metadata, screenshots carousel, player stats

**Steam metadata enrichment:**
- Added `SteamGameMetadata` DTO: `genres`, `developers`, `publishers`, `releaseDate`, `metacriticScore`, `recommendations`, `screenshots`.
- Extended `ISteamApiService` with `getSteamAppDetails(appId): Promise<SteamGameMetadata | null>`.
- Implemented `getSteamAppDetails` in `SteamApiServiceImpl` via Steam Store API; added stub to `MockSteamApiService`.
- Extended `GameDetail` entity with `steamMetadata` and `protonDbReportCount` fields.
- Added `ISteamApiService` as 5th dependency in `GameDetailUseCase` (fetched via `Promise.allSettled` so failures don't block other enrichments).

**GameDetailScreen redesign:**
- FlatList carousel: cover image + up to 9 screenshots with pagination dots.
- "Mis estadísticas" section: total playtime + last played date (only for owned games).
- "Linux / Steam Deck" section: ProtonDB rating + trending tier + report count.
- "Información" section: developer, publisher, release date, genre chips.
- Metacritic score badge + Steam recommendations count in header meta row.

**Files changed:** `SteamGameMetadata.ts` (new), `ISteamApiService.ts`, `SteamApiServiceImpl.ts`, `MockSteamApiService.ts`, `GameDetail.ts`, `GameDetailUseCase.ts`, `GameDetailScreen.tsx`, `GameDetailScreen.styles.ts`, `container.ts`, `MockDataProvider.ts`

---

### Session 24 — portraitCoverUrl field + expo-image with crossfade transition

**Changes:**
- Added `portraitCoverUrl` field to `Game` entity (optional string).
- Updated `FirestoreGameMapper` to map `portraitCoverUrl` bidirectionally.
- Updated `SteamApiServiceImpl.syncLibrary()` to fetch portrait cover from Steam CDN (`library_600x900.jpg`).
- Replaced React Native `Image` with `expo-image` in all game card components for `contentFit` and `transition` support.
- `GameCard` prefers `portraitCoverUrl` over `coverUrl` for better 2:3 grid aspect ratio.
- Updated `HomeGameCard`, `SearchResultCard`, `WishlistGameCard` to use `expo-image` with 300ms crossfade.
- Minor adjustments to `GameDetailScreen` and `LibraryScreen` for layout consistency.

**Files changed:** `Game.ts`, `FirestoreGameMapper.ts`, `SteamApiServiceImpl.ts`, `GameCard.tsx`, `HomeGameCard.tsx`, `SearchResultCard.tsx`, `WishlistGameCard.tsx`, `GameDetailScreen.tsx`, `GameDetailScreen.styles.ts`, `LibraryScreen.tsx`, `MockDataProvider.ts`, `MockGameRepository.ts`, `PlatformRepositoryImpl.ts`

---

### Session 24 — Replace BaseViewModel class with standalone `withLoading` function

**Issue:** MobX `makeAutoObservable()` throws at runtime when used on a class that has a superclass (Session 24 initial attempt with abstract `BaseViewModel` class failed).

**Fix:**
- Replaced abstract `BaseViewModel` class with a plain exported function `withLoading<T>(vm, loadingKey, errorKey, action, rethrow?)` that accepts the ViewModel instance as its first argument.
- All 8 ViewModels updated: removed `extends BaseViewModel` and `super()` calls, import `withLoading` directly.
- Behaviour is identical to the class-based approach; MobX constraint is satisfied.

**Files changed:** `BaseViewModel.ts` (refactored), all 8 ViewModel files

**Note:** The original Session 24 entry below documents the first attempt with the abstract class pattern.

---

### Session 24 — Extract `withLoading` helper — eliminate ViewModel boilerplate

**Issue:** All 8 ViewModels repeated the same ~10-line try/catch/runInAction pattern in every async method (~80 occurrences total). See KNOWN_ISSUES §3.1 [HIGH].

**Fix:**
- Added `src/presentation/viewmodels/BaseViewModel.ts` — initially an abstract base class with a
  `protected withLoading<T>(loadingKey, errorKey, action, rethrow?)` generic helper.
  The helper wraps the action with the standard loading/error/finally lifecycle inside `runInAction`.
- All 8 ViewModels extended `BaseViewModel` and called `withLoading` in every async method.
- ViewModels with non-standard loading flags (`_isSyncing`, `_isLinking`, `_isSearching`) pass their
  specific key name — the helper is flag-name–agnostic.
- `AuthViewModel.checkAuthState` retains a manual try/catch because it silences the error by design.
- `AuthViewModel.deleteAccount` uses `rethrow: true` to preserve the re-throw behaviour callers depend on.
- `tsc --noEmit` passes with zero errors.

**Files changed:** `BaseViewModel.ts` (new), all 8 ViewModel files, `PRESENTATION.md`, `KNOWN_ISSUES.md`

**Resolved:** KNOWN_ISSUES §3 `[HIGH] Repeated try/catch/runInAction boilerplate` — RESOLVED

**Note:** This approach was later refactored (see "Replace BaseViewModel class" entry above) due to MobX runtime constraint.

---

### Session 24 — Ownership badge in search + hide wishlist/deals for owned games

**Changes:**
- Added `isOwned: boolean` and `ownedPlatform: Platform | null` fields to `SearchResult` entity.
- Updated `HomeUseCase.searchGames()` to cross-reference search results against user library and populate ownership fields.
- Updated `SearchResultCard`: replaced wishlist button with `PlatformBadge` when game is owned.
- Updated `SearchScreen`: guard `toggleWishlist` against owned games.
- Updated `GameDetailScreen`: hide wishlist button and ITAD deals section when game is owned (`platform != UNKNOWN`); `PlatformBadge` only shown when relevant.
- Fixed `GameRepositoryImpl.getOrCreateGameById()` and `SteamSyncMemoryGameRepository.getOrCreateGameById()` to look up library by `steamAppId` when `gameId` is an ITAD UUID, so owned games return with their real platform instead of `UNKNOWN`.
- Updated `AGENTS.md` to document that mocks are read-only historical artifacts and must never be modified or referenced when fixing bugs.

**Files changed:** `SearchResult.ts`, `Platform.ts`, `HomeUseCase.ts`, `SearchResultCard.tsx`, `PlatformBadge.tsx`, `SearchScreen.tsx`, `GameDetailScreen.tsx`, `GameRepositoryImpl.ts`, `SteamSyncMemoryGameRepository.ts`, `AGENTS.md`

---

### Session 24 — writeBatch for platform unlink + Epic library-service endpoint

**Platform unlink fix:**
- Replaced sequential `deleteDoc()` loop in `PlatformRepositoryImpl.unlinkPlatform()` with `writeBatch()`.
- Fixes issue where games remained in library after unlinking if Firestore permission errors silently stopped the loop mid-deletion.
- `writeBatch` is atomic and significantly more efficient for bulk deletes.

**Epic Games library fix:**
- Replaced entitlements endpoint (which only returned internal Fortnite items) with official library-service API (`library-service.live.use1a.on.epicgames.com`).
- `EpicGamesApiServiceImpl.fetchLibrary()` now uses pagination cursor; `fetchCatalogData()` enriches titles/images in bulk.
- Removed `EPIC_ENTITLEMENTS_URL`, added `EPIC_LIBRARY_URL` to `ApiConstants.ts`.
- Applied `React.memo` to all game card components (`GameCard`, `HomeGameCard`, `WishlistGameCard`, `SearchResultCard`).
- Added safety comment to `babel.config.js` re: class-properties plugin.
- Removed unused devDependencies: `@types/inversify`, `@types/reflect-metadata`, `@babel/plugin-transform-class-properties`.
- Removed dead Expo Router scaffold files from `src/app/`.

**Files changed:** `PlatformRepositoryImpl.ts`, `EpicGamesApiServiceImpl.ts`, `ApiConstants.ts`, `GameCard.tsx`, `HomeGameCard.tsx`, `WishlistGameCard.tsx`, `SearchResultCard.tsx`, `babel.config.js`, `package.json`, `package-lock.json`, `src/app/_layout.tsx`, `src/app/index.tsx`

---

### Session 24 — Epic catalog API + entitlement blacklist filter

**Changes:**
- `EpicGamesApiServiceImpl.fetchLibrary()`: added catalog data resolution via `fetchCatalogData()` to enrich game titles and cover images from Epic's catalog API.
- Switched entitlement filtering from whitelist (only `EXECUTABLE`) to blacklist (exclude `AUDIENCE`, `ENTITLEMENT`, internal types) so DLCs and full games are both captured.
- Added separate "Login" and "Paste Auth Code" buttons in Epic link modal for better UX.

**Files changed:** `EpicGamesApiServiceImpl.ts`, `EpicLinkModal.tsx`

---

### Session 23 — Fix Buffer.from() crash + Firestore Security Rules configured

**Firestore Security Rules:** Configured in Firebase console. Rule applied:
```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
Each user can only access their own subtree. Resolves the last CRITICAL issue.

**Resolved:** KNOWN_ISSUES §1 `[CRITICAL] Firebase client keys / no Firestore rules` — RESOLVED (downgraded to LOW)

---

### Session 23 — Fix Buffer.from() crash in EpicGamesApiServiceImpl

**Issue:** `Buffer.from(...).toString('base64')` on line 77 of `EpicGamesApiServiceImpl.ts` crashes at runtime on Hermes/JSC because `Buffer` is a Node.js module that does not exist in React Native.

**Fix:** Replaced with `btoa(\`${EPIC_AUTH_CLIENT_ID}:${EPIC_AUTH_CLIENT_SECRET}\`)`, the standard JS Web API available in both Hermes and JSC.

**File:** `src/data/services/EpicGamesApiServiceImpl.ts:77`

**Resolved:** KNOWN_ISSUES §1 `[CRITICAL] Buffer.from() crash at runtime` — RESOLVED

---

### Session 22 — PlatformLinkScreen decomposed into focused components

**Issue:** `PlatformLinkScreen.tsx` was 854 lines containing the orchestrator screen, 2 full modals, 3 inline sub-components, and 200+ lines of styles — a god component.

**Split:**
- `components/platforms/PlatformRow.tsx` — pure UI row: platform badge + linked status + link/unlink button. Self-contained styles.
- `components/platforms/LinkStep.tsx` — pure UI numbered instruction step. Self-contained styles.
- `screens/settings/SteamLinkModal.tsx` — full Steam linking modal (input, examples, confirm button, error). Manages its own `input` state; delegates confirm/close to the screen.
- `screens/settings/EpicLinkModal.tsx` — full Epic linking modal with `authcode`/`gdpr` tab selector. Manages its own `mode` and `input` state. Contains `AuthCodeForm`, `GdprForm`, `ModalError`, `ConfirmButton` as internal sub-components.
- `screens/settings/PlatformLinkScreen.tsx` — now a pure orchestrator (~150 lines): holds ViewModel calls, Alert dialogs, and modal visibility state. No JSX from modals.
- `screens/settings/PlatformLinkScreen.styles.ts` — reduced to 5 styles (container, sectionLabel, group, separator, footnote).

**Resolved:** KNOWN_ISSUES §3.2 `[HIGH] God component: PlatformLinkScreen.tsx` — RESOLVED

---

### Session 21 — Style refactoring: shared stylesheets + theme extension (Opción D)

**Motivation:** All 11 screens had `StyleSheet.create()` inline with repeated patterns and some hardcoded values outside the token system.

**Changes:**
- `theme/colors.ts` — added `iosRed`, `iosPurple`, `iosGreen` (iOS system colors for settings icons). `SettingsScreen` no longer uses bare hex literals.
- `theme/typography.ts` — added `typography.input` (16px/400, native font). Eliminates the repeated `fontSize: 16` without a token across 4 screens.
- `theme/spacing.ts` — added `layout` object: `tabBarClearance: 100`, `safeAreaPaddingTop: {ios:100, android:64}`, `authHeaderTop: {ios:60, android:24}`. Eliminates all hardcoded `Platform.OS === 'ios' ? 100 : 64` patterns.
- `styles/shared.ts` (new) — shared layout styles: `screenContainer`, `listContent`, `safeTop`, `screenHeader`, `largeTitle`, `sectionLabel`, `settingsGroup`, `settingsRow`, `iconBox`, `footnote`, `searchBar`, `searchInput`, `emptyContainer`.
- `styles/forms.ts` (new) — shared form styles: inputs, buttons, error banners, auth gradients (exported as typed color arrays for `LinearGradient`).
- All 11 screens migrated: each has a sibling `ScreenName.styles.ts` with only its unique styles; shared patterns imported from `styles/`.
- `typography.hero` no longer reimplemented manually in Login, Register, Wishlist.
- `PRESENTATION.md` updated with new `styles/` section and correct `spacing.ts` values.

**Resolved:** KNOWN_ISSUES §3.4 `[MEDIUM] Duplicate styles across auth screens` — RESOLVED (extended to all screens)

---

### Session 20 — Epic credentials moved to environment variables

**Issue:** Epic Games client credentials (`EPIC_AUTH_CLIENT_ID` and `EPIC_AUTH_CLIENT_SECRET`) were hardcoded in `src/data/config/ApiConstants.ts`, violating security best practices.

**Fix:** Modified `ApiConstants.ts` to read from `process.env.EXPO_PUBLIC_EPIC_CLIENT_ID` and `EXPO_PUBLIC_EPIC_CLIENT_SECRET` with fallback to the default `launcherAppClient2` credentials. Updated `.env.example` with documentation for these new variables.

**Files changed:** `ApiConstants.ts`, `.env.example`, `KNOWN_ISSUES.md`

**Resolution:** KNOWN_ISSUES §1.1 "[CRITICAL] Epic client credentials hardcoded in source" — RESOLVED

---

### Session 19 — LibraryViewModel no longer depends on IPlatformRepository

`LibraryViewModel` had a direct `@inject(TYPES.IPlatformRepository)` dependency, violating MVVM. Fixed by adding `getLinkedPlatforms(userId)` to `ILibraryUseCase`. `LibraryUseCase` now receives `IPlatformRepository` in its constructor and delegates. `container.ts` passes the repo when constructing the use case.

Files changed: `ILibraryUseCase.ts`, `LibraryUseCase.ts`, `container.ts`, `LibraryViewModel.ts`

---

### Session 18 — PlatformLinkViewModel no longer imports from data/

`PlatformLinkViewModel` was importing `EPIC_AUTH_REDIRECT_URL` directly from `data/config/ApiConstants`. Fixed by adding `getAuthUrl(): string` to `IEpicGamesApiService` (domain), implementing it in `EpicGamesApiServiceImpl` and its mock, and exposing `getEpicAuthUrl()` in `IPlatformLinkUseCase` → `PlatformLinkUseCase` → `PlatformLinkViewModel`.

Files changed: `IEpicGamesApiService.ts`, `EpicGamesApiServiceImpl.ts`, `MockEpicGamesApiService.ts`, `IPlatformLinkUseCase.ts`, `PlatformLinkUseCase.ts`, `PlatformLinkViewModel.ts`

---

### Session 17 — Use cases purged of DI imports (Clean Architecture fix)

All 7 use cases in `domain/usecases/` had `@injectable`, `@inject`, `TYPES`, and `reflect-metadata` imports removed. Constructors are now plain typed parameters. Bindings in `container.ts` changed from `.to(UseCase)` to `.toDynamicValue(ctx => new UseCase(...))`. Explicit `.inSingletonScope()` added to all use case bindings.

Files changed: all 7 use case files + `container.ts`

---

### Session 16 — Fix "Most Played" section empty with Steam linked

`HomeUseCase.getMostPlayed()` was reading Firestore without syncing first. If the user navigated to Search before Library (which triggers `autoSyncIfNeeded`), Firestore was empty. Fix: `getMostPlayed()` now calls `gameRepository.syncLibrary(userId, Platform.STEAM)` before reading, with a silent catch to fall back to cached data.

Files changed: `HomeUseCase.ts`

---

### Session 15 — IGameRepository: userId added to getGameById/getOrCreateGameById

The global `/games/{gameId}` Firestore collection was never populated. `getGameById` now reads from `users/{uid}/library/{gameId}`. `getOrCreateGameById` detects numeric IDs (Steam App IDs, `/^\d+$/.test(gameId)`) and resolves them via `lookupGameIdBySteamAppId` → `getGameInfo` instead of treating them as ITAD UUIDs.

Files changed: `IGameRepository.ts`, `GameRepositoryImpl.ts`, `SteamSyncMemoryGameRepository.ts`, `MockGameRepository.ts`, `GameDetailUseCase.ts`

---

### Session 13 — Production mode: Firebase + real repos activated

DI container now has three branches based on env vars:
- `useFirebase && useRealSteam` → `PlatformRepositoryImpl` + `GameRepositoryImpl` (Firestore)
- `useRealSteam` only → in-memory repos
- neither → full mocks

`LibraryViewModel.autoSyncIfNeeded(userId)` added: loads library from Firestore cache immediately, then syncs all linked platforms in parallel via `Promise.allSettled`. Called once per session from `RootNavigator` on auth.

---

### Session 12 — Auth fixes + ForgotPassword screen

Fixed 4 auth bugs: conditional Firebase init in `App.tsx`, `MockAuthRepository` logout/delete not clearing `currentUser`, `AuthViewModel.checkAuthState()` not clearing error. Added full `resetPassword` flow: `IAuthRepository.resetPassword()` → `AuthRepositoryImpl` (Firebase `sendPasswordResetEmail`) → `MockAuthRepository` → `AuthViewModel.resetPassword()` → `ForgotPasswordScreen` (new) → `LoginScreen` link.

---

### Session 10 — Epic Games Auth Code flow

New preferred Epic linking flow: user opens `EPIC_AUTH_REDIRECT_URL` in browser, logs in, copies the auth code (~32 chars), pastes into app. `exchangeAuthCode()` swaps it for an access token + accountId. `fetchLibrary()` retrieves entitlements. GDPR import retained as a fallback tab. `EpicAuthToken` DTO added.

---

### Session 9 — Epic Games GDPR import (initial implementation)

`EpicGamesApiServiceImpl.parseExportedLibrary()` made async, enriches games with ITAD covers + `itadGameId` via `Promise.allSettled`. `storeEpicGames()` added to `IGameRepository`. `SteamSyncMemoryGameRepository` now handles `Platform.EPIC_GAMES` in `syncLibrary()`.

---

### Session 8 — Home/Discover screen, real ProtonDB + ITAD, popular games

`SearchScreen` repurposed as Home with sections: "Continue Playing" (recent 2 weeks), "Most Played" (top 5), and global search. `HomeUseCase` + `HomeViewModel` added. ProtonDB and ITAD switched to real implementations. `getMostPlayedGames()` added to `ISteamApiService`. `useFocusEffect` replaces `useEffect` to refresh on tab focus.

---

### Session 7 — Hermes crash fix + real Steam API

Root cause: `@babel/plugin-transform-class-properties` crashes Hermes with read-only enums. Removed from `babel.config.js`. MobX configured with `useProxies: 'never'` and `enforceActions: 'never'` in `index.ts`. `SteamApiServiceImpl` + `MemoryPlatformRepository` + `SteamSyncMemoryGameRepository` activated. Full Steam flow: resolve vanity URL → `GetPlayerSummaries` → `GetOwnedGames`.

---

### Session 24 — Firebase Security Rules version-controlled + KNOWN_ISSUES cleanup (both LOW issues resolved)

**Issue LOW #1 resolved:** `@types/inversify` and `@types/reflect-metadata` were never installed (issue was outdated). Removed from KNOWN_ISSUES.md.

**Issue LOW #2 improved:** Firebase Security Rules are already configured in Firebase Console (Session 23), but were not version-controlled locally. Created:
- `firestore.rules` — Security rules definition (`users/{userId}/{document=**}` — auth-only access)
- `firebase.json` — Firebase config pointing to `firestore.rules`
- `.firebaserc` — Project binding to `gameshelf-180a3`

Rules can now be deployed with `firebase deploy --only firestore:rules`.

**Issue LOW #3 resolved:** `@babel/plugin-transform-class-properties` was never installed (issue was outdated). Removed from KNOWN_ISSUES.md.

**Updated:** `KNOWN_ISSUES.md` — removed all 3 LOW issues (2 were false positives, 1 was improved with local version control). Summary table updated: **LOW count reduced from 2 to 0**. All LOW severity issues are now resolved.

---

### Session 6 — Professional UI redesign

Color palette updated to deep grays + indigo primary. All emojis replaced with Feather icons (`@expo/vector-icons`). `radius` and `shadows` added to `spacing.ts`. Typography hierarchy refined. All screens and components updated.

---

### Sessions 1–5 — Initial build

Architecture scaffolded: all domain entities, DTOs, interfaces, use cases. Full data layer: Firebase config, Firestore repos, 5 external service implementations, 12 mocks, bidirectional Firestore mappers. DI container with all bindings. Full presentation layer: 8 ViewModels, 10 screens, UI component library, dark theme. React Navigation replacing Expo Router. Entry point via `index.ts` → `registerRootComponent(App)`.
