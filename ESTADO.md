# GameShelf — Project Status

**Last updated:** Session 32 (Mar 2026) — 28 MEDIUM issues resolved
**Current state:** Production-ready. Firebase + Steam + all external APIs active when env vars are set. Full mock mode available with no keys. Guest mode available without any account.

---

## Layer Status

| Layer | Status | Notes |
|---|---|---|
| **Domain** | Complete | Entities, enums, DTOs, all repo/service/use case interfaces, 7 use case implementations |
| **Data** | Complete | 5 Firebase repos + 5 guest repos (LocalPlatformRepository, LocalGameRepository, GuestAware* wrappers, GuestSessionRepository), 5 external service impls, 2 Firestore mappers, 12 mocks, FirebaseConfig, ApiConstants |
| **DI** | Complete | 47 TYPES symbols, full container bindings (3 modes + guest routing), `useInjection` hook |
| **Presentation** | Complete | 8 ViewModels, 10 screens, 13 UI components, dark theme (colors / typography / spacing) |
| **Navigation** | Complete | React Navigation: RootNavigator, 5 stacks, MainTabNavigator (3 tabs + wishlist modal) |

---

## Feature Status

### Authentication
- [x] Email/password login and registration
- [x] Persistent auth state (Firebase Auth)
- [x] Forgot password (email reset)
- [x] Logout and account deletion
- [x] Guest mode ("Continuar sin cuenta") — data persists on-device via AsyncStorage, never syncs to Firestore; restores on app restart; clears all local data on exit

### Library
- [x] Steam library sync (real API, requires `EXPO_PUBLIC_STEAM_API_KEY`)
- [x] Epic Games library (Auth Code flow + GDPR JSON fallback)
- [x] GOG library (OAuth2 WebView flow)
- [x] Platform badge in grid for Steam, Epic Games and GOG
- [x] Local search within library
- [x] Sort by name / last played / playtime
- [x] 3-column grid with covers
- [x] Auto-sync on login (background, non-blocking)
- [x] Deduplication by game ID (no duplicates when multiple platforms linked)

### Home / Discover
- [x] "Continue Playing" section (games played in last 2 weeks)
- [x] "Most Played" section (top 5 by playtime)
- [x] "Popular Now" section (Steam Charts global top games)
- [x] Global catalog search (ITAD — ~50 stores); owned games (Steam, Epic, GOG) marked with platform badge
- [x] 400ms debounce on search input
- [x] Add to wishlist from search results

### Game Detail
- [x] Hero image (static, full-width) with gradient overlay — portrait cover preferred
- [x] Platform badge
- [x] ProtonDB compatibility rating (Steam + Epic Games + GOG via resolved Steam App ID)
- [x] HowLongToBeat estimates (main / main+extra / completionist)
- [x] Steam metadata: Metacritic, genres, developer, publisher, release date, recommendations
- [x] Active deals from ITAD
- [x] Wishlist toggle
- [x] Epic Games enrichment: auto-resolves Steam App ID on first open (ITAD → Steam Search);
      persists to Firestore so subsequent opens skip the lookup
- [x] GOG enrichment: same Steam App ID resolution as Epic Games (ITAD → Steam Search);
      persists to Firestore so subsequent opens skip the lookup

### Wishlist
- [x] List with best deal percentage per game
- [x] Add / remove games
- [x] Pull-to-refresh

### Settings
- [x] User profile view
- [x] Link / unlink Steam (SteamID, URL, or vanity name)
- [x] Link / unlink Epic Games (Auth Code or GDPR JSON)
- [x] Notification preferences (deals alerts toggle)

---

## Operating Modes

### Mock mode (default — no env vars needed)
All repos and services use in-memory mocks. No Firebase or API keys required. Best for UI development.

Mock seed data: Elden Ring, Cyberpunk 2077, Hades, Baldur's Gate 3, Hollow Knight, Stardew Valley (Steam) + Death Stranding, Alan Wake 2 (Epic). Wishlist pre-populated with 2 games.

### Steam-only mode (`EXPO_PUBLIC_STEAM_API_KEY` set)
Real Steam API. Games and platforms stored in memory (lost on restart). Auth, Wishlist, Notifications use mocks.

### Full production mode (all `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_STEAM_API_KEY` + `EXPO_PUBLIC_ITAD_API_KEY`)
All data persists in Firestore. Real Steam sync. ProtonDB and HLTB always real (no key needed). ITAD real for deals and search. Guest mode uses AsyncStorage locally and routes to the real Steam API for library sync.

```bash
# Copy and fill in your keys
cp .env.example .env
npx expo start
```

---

## Known Issues & Tech Debt

See `KNOWN_ISSUES.md` for the full tracked list (replaces the old `MALAS_PRACTICAS.md`). Summary by severity:

| Severity | Count | Top items |
|---|---|---|
| Critical | 0 | — |
| High | 0 | All resolved as of Session 27 |
| Medium | 0 | All resolved as of Session 30 |
| Low | 0 | All resolved as of Session 24 |

---

## Roadmap

### High priority
- [ ] Push notifications for wishlist deals
- [ ] Add tests (Jest + React Native Testing Library for ViewModels; Detox/Maestro for E2E)
- [ ] Move Epic client credentials to env vars (security)

### Medium priority
- [ ] Decompose `PlatformLinkScreen.tsx` (854 lines) into sub-components
- [ ] Extract `withLoading()` helper to eliminate ViewModel boilerplate
- [ ] Add `useDebounce` hook, `useCurrentUser` hook, `useLoadingState` hook
- [ ] Batch ITAD calls in wishlist enrichment (N+1 problem)
- [ ] More platforms (Xbox, PlayStation)

### Low priority
- [ ] Light theme support
- [ ] Full offline mode with sync
- [ ] Remove dead `src/app/` scaffold
- [ ] iOS/Android widgets

---

## Stack Summary

| Technology | Version | Role |
|---|---|---|
| React Native + Expo SDK | 0.81.5 / 54 | Framework |
| TypeScript | 5.9 | Strict typing |
| MobX + mobx-react-lite | 6 | Reactive state in ViewModels |
| React Navigation | 7 | Navigation (native-stack + bottom-tabs) |
| Inversify + reflect-metadata | 7 | Dependency injection |
| Firebase JS SDK | 12 | Auth + Firestore |
| Axios | 1.x | HTTP client (Steam, ProtonDB, HLTB, ITAD) |
| expo-image | 3.x | Optimized image rendering |
| @expo/vector-icons (Feather) | 15 | All icons |
