# GameShelf — Known Issues & Tech Debt

Open issues only. Resolved items have been removed. Severities: CRITICAL, HIGH, MEDIUM, LOW.

---

## 1. Security

### [LOW] Firebase client keys exposed in JS bundle
`EXPO_PUBLIC_FIREBASE_*` variables are visible in the client bundle by design. Firestore Security Rules are configured in Firebase Console and version-controlled locally in `firestore.rules` (`users/{userId}/{document=**}` — only the authenticated owner can read/write their own subtree). The remaining exposure is acceptable for a client app; no server-side secret is leaked.

**Deploy rules:** `firebase deploy --only firestore:rules` (requires Firebase CLI and authentication).

---

## 2. Architecture / MVVM

### [MEDIUM] AuthViewModel depends directly on IAuthRepository (no use case)
**File:** `src/presentation/viewmodels/AuthViewModel.ts:4`  
This is intentional (documented in `AGENTS.md`), but it breaks consistency: all other ViewModels go through use cases. Future business logic (analytics, onboarding post-register) would need to be added directly to the ViewModel. Consider adding `AuthUseCase` if the auth flow grows.

---

### [HIGH] Business logic in LibraryViewModel.autoSyncIfNeeded()
**File:** `src/presentation/viewmodels/LibraryViewModel.ts`  
`autoSyncIfNeeded()` decides which platforms to sync, iterates over them, and merges results. This orchestration logic belongs in `ILibraryUseCase`, not the ViewModel.

---

### [MEDIUM] Transient ViewModels may hold stale data on navigation reuse
**File:** `src/di/hooks/useInjection.ts`  
`useInjection` uses `useRef` to keep the ViewModel instance stable. If React reuses the same component instance for a different entity (e.g., navigating from one game detail to another), `useRef` retains the previous ViewModel with stale data. The transient VM should be cleared or keyed to route params.

---

### [MEDIUM] WishlistViewModel.addToWishlist reloads the entire list
**File:** `src/presentation/viewmodels/WishlistViewModel.ts:68`  
`addToWishlist` triggers a full `loadWishlist()` network reload, while `removeFromWishlist` does an optimistic local update. Inconsistent pattern. Both should follow the optimistic local update pattern.

---

## 3. Clean Code / DRY

### [HIGH] N+1 HTTP calls in wishlist enrichment and search
**File:** `src/domain/usecases/wishlist/WishlistUseCase.ts`, `SearchUseCase.ts`  
`getWishlist()` fires 2 ITAD HTTP calls per wishlist item (lookupGameId + getPricesForGame). With 20 items that is 40 parallel requests. ITAD supports batch POSTing multiple IDs — use that instead.

---

### [MEDIUM] Navigation stack `screenOptions` duplicated across 4 stacks
`SearchStack`, `LibraryStack`, `WishlistStack`, and `SettingsStack` all copy the same `headerTransparent` / `BlurView` / `contentStyle` config. Extract a `defaultStackScreenOptions` constant in `src/core/navigation/`.

---

### [MEDIUM] `(error as Error).message` cast without type guard (~50 occurrences)
All catch blocks cast directly without checking the type. If the thrown value is a string, Axios error, or `undefined`, the cast silently produces `undefined`. Introduce a `getErrorMessage(error: unknown): string` helper.

---

## 4. React / React Native Performance

### [HIGH] FlatList missing `getItemLayout` in Library and Wishlist screens
**Files:** `LibraryScreen.tsx`, `WishlistScreen.tsx`, `SearchScreen.tsx`  
Without `getItemLayout`, RN must render all items to compute scroll offsets, causing jank. The library grid uses a fixed 2:3 aspect ratio — `getItemLayout` can be provided precisely.

---

### [HIGH] Inline callbacks not memoized in `observer()` screens
All screens define handlers inline (e.g., `const handleLogin = async () => { ... }`), recreating functions on every MobX-triggered re-render. Wrap handlers passed as props to child components in `useCallback`.

---

### [HIGH] Debounce in SearchScreen has no cleanup
**File:** `src/presentation/screens/search/SearchScreen.tsx`  
Manual `setTimeout` / `clearTimeout` with `useRef` does not clean up the last pending timeout on component unmount (potential memory leak / state update on unmounted component). Replace with a `useDebounce` hook that handles lifecycle cleanup.

---

### [MEDIUM] `HomeUseCase.getMostPlayed()` syncs library on every call
**File:** `src/domain/usecases/home/HomeUseCase.ts`  
A full Steam library sync (1–3 seconds) is triggered every time the Home screen loads. The sync should be a separate explicit operation, not implicit in a data-read method.

---

### [MEDIUM] `useEffect` missing dependencies in RootNavigator
**File:** `src/core/navigation/RootNavigator.tsx`  
Two `useEffect` hooks have incomplete dependency arrays (`authVm`, `libraryVm`, `authVm.currentUser` are used but not listed). Causes ESLint warnings and potential stale closure issues.

---

## 5. TypeScript

### [MEDIUM] ProtonDB tier as `string` instead of union type
**File:** `src/domain/entities/ProtonDbRating.ts`  
`tier` and `trendingTier` accept any string. Should be:
```ts
type ProtonTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending';
```

---

### [MEDIUM] `ItadGameInfo` coupled to its service interface
**File:** `src/domain/interfaces/services/IIsThereAnyDealService.ts`  
`ItadGameInfo` is used in `GameRepositoryImpl`, `SteamSyncMemoryGameRepository`, and `EpicGamesApiServiceImpl`. It should live in `domain/dtos/` or `domain/entities/`, not be exported from a service interface file.

---

---

## 6. Maintenance

### [HIGH] `AuthRepositoryImpl.deleteAccount()` deletes docs one by one
**File:** `src/data/repositories/AuthRepositoryImpl.ts:88-94`  
Iterates and `await deleteDoc(...)` individually. With 500+ library games this is 500+ sequential Firestore writes. Use `writeBatch()` (already used in `GameRepositoryImpl.syncLibrary()`). Also leaves data in an inconsistent state if a deletion fails mid-loop.

---

### [MEDIUM] `PlatformRepositoryImpl.unlinkPlatform()` downloads all library docs to filter
**File:** `src/data/repositories/PlatformRepositoryImpl.ts:63`  
Downloads the entire library collection then filters by platform client-side. Deletions are now batched (`writeBatch`), but the initial fetch should use a Firestore `query` with `where('platform', '==', platform)` to avoid downloading irrelevant docs.

---

### [MEDIUM] `WishlistRepositoryImpl.isInWishlist()` uses a query instead of `getDoc`
**File:** `src/data/repositories/WishlistRepositoryImpl.ts:39-44`  
Uses `getDocs(query(...where('gameId','==',...)))` which is O(n). If wishlist document IDs were the `gameId`, a direct `getDoc` would be O(1). Alternatively, cache the wishlist in memory after the first load.

---

## Summary

| Severity | Open | Top action |
|---|---|---|
| Critical | 0 | — |
| High | 4 | batch ITAD; memoize callbacks; `getItemLayout` in FlatLists; delete account batch write |
| Medium | 9 | union types for ProtonDB tiers; nav stack options DRY; `useEffect` deps |
| Low | 0 | — |
