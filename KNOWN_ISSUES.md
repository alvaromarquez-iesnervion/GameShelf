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



### [MEDIUM] Transient ViewModels may hold stale data on navigation reuse
**File:** `src/di/hooks/useInjection.ts`  
`useInjection` uses `useRef` to keep the ViewModel instance stable. If React reuses the same component instance for a different entity (e.g., navigating from one game detail to another), `useRef` retains the previous ViewModel with stale data. The transient VM should be cleared or keyed to route params.

---

### [MEDIUM] WishlistViewModel.addToWishlist reloads the entire list
**File:** `src/presentation/viewmodels/WishlistViewModel.ts:68`  
`addToWishlist` triggers a full `loadWishlist()` network reload, while `removeFromWishlist` does an optimistic local update. Inconsistent pattern. Both should follow the optimistic local update pattern.

---

## 3. Clean Code / DRY



### [MEDIUM] Navigation stack `screenOptions` duplicated across 4 stacks
`SearchStack`, `LibraryStack`, `WishlistStack`, and `SettingsStack` all copy the same `headerTransparent` / `BlurView` / `contentStyle` config. Extract a `defaultStackScreenOptions` constant in `src/core/navigation/`.

---

### [MEDIUM] `(error as Error).message` cast without type guard (~50 occurrences)
All catch blocks cast directly without checking the type. If the thrown value is a string, Axios error, or `undefined`, the cast silently produces `undefined`. Introduce a `getErrorMessage(error: unknown): string` helper.

---

## 4. React / React Native Performance









### [MEDIUM] `useEffect` missing dependencies in RootNavigator
**File:** `src/core/navigation/RootNavigator.tsx`  
Two `useEffect` hooks have incomplete dependency arrays (`authVm`, `libraryVm`, `authVm.currentUser` are used but not listed). Causes ESLint warnings and potential stale closure issues.

---

## 5. TypeScript

### [MEDIUM] `ItadGameInfo` coupled to its service interface
**File:** `src/domain/interfaces/services/IIsThereAnyDealService.ts`  
`ItadGameInfo` is used in `GameRepositoryImpl`, `SteamSyncMemoryGameRepository`, and `EpicGamesApiServiceImpl`. It should live in `domain/dtos/` or `domain/entities/`, not be exported from a service interface file.

---

---

## 6. Maintenance



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
| High | 0 | — |
| Medium | 7 | nav stack options DRY; `useEffect` deps; error message helper |
| Low | 0 | — |
