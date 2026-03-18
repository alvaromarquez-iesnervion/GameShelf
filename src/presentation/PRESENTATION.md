# Presentation Layer

## Purpose

Contains all UI for the app. Split into two clearly separated halves: **ViewModels** (state logic, pure MobX classes) and **views** (React Native components that render ViewModel data).

Depends on `domain/` (entities, DTOs, use case interfaces). Does **not** import from `data/` or `di/` directly — dependencies arrive via the DI container through `useInjection`.

---

## Structure

```
presentation/
├── viewmodels/   # Pure MobX classes (no React)
├── screens/      # React Native screen components + *.styles.ts companion files
├── components/   # Reusable UI components (no business logic)
├── styles/       # Shared StyleSheet objects across screens
│   ├── shared.ts # Layout containers, safe-area helpers, settings groups, search bars
│   └── forms.ts  # Inputs, buttons, error banners, auth gradients
└── theme/        # Design tokens: colors, typography, spacing
```

---

## ViewModels (`viewmodels/`)

### Rules

- Pure TypeScript classes with `makeAutoObservable(this)` in the constructor.
- **Never** extend a base class — `makeAutoObservable` throws at runtime when the class has a superclass (MobX + Hermes constraint).
- **Never** import React or use hooks (`useState`, `useEffect`, etc.).
- **Never** access navigation — that belongs to screens.
- Expose **observables** (state) and **actions** (methods that mutate it).
- All state mutations happen inside `runInAction()`.
- Private fields use `_` prefix; public access is via getters.
- Async methods use the standalone `withLoading(vm, loadingKey, errorKey, action)` helper from `BaseViewModel.ts` to eliminate repetitive try/catch/runInAction boilerplate.

### Pattern

```ts
@injectable()
export class FooViewModel {
  private _items: Item[] = [];
  private _isLoading = false;
  private _error: string | null = null;

  constructor(
    @inject(TYPES.IFooUseCase) private readonly _useCase: IFooUseCase,
  ) {
    makeAutoObservable(this);
  }

  get items() { return this._items; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }

  clearError() { runInAction(() => { this._error = null; }); }

  async loadItems(): Promise<void> {
    await withLoading(this, '_isLoading', '_error', async () => {
      const result = await this._useCase.getItems();
      runInAction(() => { this._items = result; });
    });
  }
}
```

### `withLoading` signature (`BaseViewModel.ts`)

```ts
export async function withLoading<T>(
  vm: object,           // the ViewModel instance (pass `this`)
  loadingKey: string,   // name of the boolean flag, e.g. '_isLoading'
  errorKey: string,     // name of the error field,   e.g. '_errorMessage'
  action: () => Promise<T>,
  rethrow?: boolean,    // re-throw after recording (default: false)
): Promise<T | undefined>
```

Pass a different `loadingKey` when a ViewModel has multiple loading flags
(e.g. `'_isSyncing'` in `LibraryViewModel`, `'_isLinking'` in `PlatformLinkViewModel`,
`'_isSearching'` in `HomeViewModel`).

### ViewModel Reference

| ViewModel | Scope | Key observables | Key actions |
|---|---|---|---|
| `AuthViewModel` | Singleton | `currentUser`, `isAuthenticated` (computed), `isGuest` (computed), `isLoading`, `errorMessage` | `login`, `register`, `logout`, `checkAuthState`, `continueAsGuest`, `deleteAccount`, `resetPassword`, `clearError` |
| `LibraryViewModel` | Singleton | `games`, `filteredGames` (computed), `linkedPlatforms`, `isLoading`, `isSyncing`, `searchQuery` | `loadLibrary`, `syncLibrary`, `autoSyncIfNeeded`, `setSearchQuery`, `clearSearch`, `resetSyncState` |
| `WishlistViewModel` | Singleton | `items`, `isLoading`, `errorMessage` | `loadWishlist`, `addToWishlist`, `removeFromWishlist`, `isGameInWishlist` |
| `HomeViewModel` | Singleton | `recentlyPlayed`, `mostPlayed`, `popularGames`, `searchResults`, `isLoadingHome`, `isSearching` | `loadHomeData`, `loadPopularGames`, `search`, `clearSearch` |
| `GameDetailViewModel` | Transient | `gameDetail` (`GameDetailDTO`), `isLoading`, `errorMessage` | `loadGameDetail`, `clear`, `clearError` |
| `SearchViewModel` | Transient | `results`, `isLoading`, `errorMessage` | `search`, `clearResults` |
| `PlatformLinkViewModel` | Transient | `linkedPlatforms`, `isLinking`, `errorMessage` | `loadLinkedPlatforms`, `linkSteam`, `linkSteamById`, `linkEpicByAuthCode`, `linkEpic`, `getEpicLoginUrl`, `getEpicAuthUrl`, `unlinkPlatform`, `isPlatformLinked`, `clearError` |
| `SettingsViewModel` | Transient | `profile` (`UserProfileDTO`), `isLoading`, `errorMessage` | `loadProfile`, `updateNotificationPreferences`, `deleteAccount` |

---

## Styles (`styles/`)

Shared stylesheets for patterns that appear in two or more screens. Import alongside the screen's own `.styles.ts` file.

| File | Contents |
|---|---|
| `shared.ts` | `screenContainer`, `listContent` (tab bar clearance), `safeTop`, `screenHeader`, `largeTitle`, `sectionLabel`, `settingsGroup`, `settingsRow`, `iconBox`, `footnote`, `searchBar`, `searchInput`, `emptyContainer` |
| `forms.ts` | `inputWrap/inputFocused/inputIcon/input/eyeBtn`, `primaryBtn/primaryBtnGradient/primaryBtnText`, `secondaryBtn`, `errorBanner/errorText`, `footerLink/footerText/footerTextBold`, `topGradient`, `logoIcon/appName`, `modalInput`, `confirmBtn`; also exports gradient color arrays: `primaryGradientColors`, `secondaryGradientColors`, `authBgGradientPrimary`, `authBgGradientSecondary` |

### Naming convention for screen style files

Each screen has a sibling `ScreenName.styles.ts` that holds only the styles **unique to that screen**. Shared styles come from `styles/shared.ts` or `styles/forms.ts`.

```
screens/auth/
├── LoginScreen.tsx           ← uses formStyles + styles
└── LoginScreen.styles.ts     ← screen-specific only
```

---

## Screens (`screens/`)

### Rules

- Wrapped in `observer()` from `mobx-react-lite`.
- Obtain ViewModels exclusively via `useInjection<VM>(TYPES.VM)`.
- **No business logic** — all delegation goes to the ViewModel.
- Navigation calls stay in the screen (ViewModels don't know about navigation).
- Styles live in a sibling `ScreenName.styles.ts`; shared patterns come from `styles/`.

### Pattern

```tsx
const GameDetailScreen = observer(() => {
  const vm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
  const { navigate } = useNavigation();
  const { gameId } = useRoute<GameDetailRouteProp>().params;

  useEffect(() => { vm.loadGameDetail(gameId, userId); }, [gameId]);

  if (vm.isLoading) return <DetailSkeleton />;
  if (vm.error) return <ErrorMessage message={vm.error} onRetry={() => vm.loadGameDetail(gameId, userId)} />;
  if (!vm.gameDetail) return null;

  return <View>...</View>;
});
export default GameDetailScreen;
```

### Screen Reference

| Screen | ViewModel(s) | Feature |
|---|---|---|
| `auth/LoginScreen` | `AuthViewModel` | Email/password login, password visibility toggle, link to forgot password, "Continuar sin cuenta" guest mode button |
| `auth/RegisterScreen` | `AuthViewModel` | New account registration |
| `auth/ForgotPasswordScreen` | `AuthViewModel` | Password reset email |
| `library/LibraryScreen` | `LibraryViewModel` | 3-column game grid, local search, pull-to-refresh, sync button |
| `search/SearchScreen` | `HomeViewModel`, `WishlistViewModel` | Home sections (recent/most played/popular) + global ITAD catalog search |
| `wishlist/WishlistScreen` | `WishlistViewModel` | Wishlist with deal percentages, remove action |
| `games/GameDetailScreen` | `GameDetailViewModel`, `WishlistViewModel` | Static hero image, ProtonDB badge, HLTB info, Steam metadata, deals, wishlist toggle; Epic Games entries auto-enriched with Steam data |
| `settings/SettingsScreen` | `SettingsViewModel`, `AuthViewModel` | Profile overview (guest avatar when `isGuest`), navigation to sub-settings, logout (different text/alert for guests), Notifications row hidden for guests |
| `settings/PlatformLinkScreen` | `PlatformLinkViewModel` | Link/unlink Steam, Epic Games and GOG; GOG and Epic can capture the auth code inside a `WebView` |
| `settings/NotificationSettingsScreen` | `SettingsViewModel` | Deal notification toggle |
| `profile/ProfileScreen` | `AuthViewModel` | User profile stats |

---

## Components (`components/`)

Pure functional components — receive data via props, never access ViewModels directly.

### Common (`components/common/`)

| Component | Props | Purpose |
|---|---|---|
| `LoadingSpinner` | `message?` | Full-screen loading indicator |
| `ErrorMessage` | `message`, `onRetry?` | Inline error with optional retry button |
| `EmptyState` | `message`, `icon?` | Empty list state |
| `GameCardSkeleton` | — | Shimmer placeholder for game cards |
| `LibrarySkeleton` | — | Shimmer grid for library loading |
| `DetailSkeleton` | — | Shimmer layout for game detail loading |
| `ListItemSkeleton` | — | Shimmer for generic list items |
| `Shimmer` | — | Base animated shimmer (opacity pulse) |
| `AppBackground` | — | Global gradient background wrapper (behind Navigation) |
| `BrandAura` | — | Decorative header accent (signature) |
| `Screen` | `topInset?`, `bottomInset?` | Minimal wrapper to standardize safe-area/header clearance and keep backgrounds transparent |

### Games (`components/games/`)

| Component | Props | Purpose |
|---|---|---|
| `GameCard` | `coverUrl`, `portraitCoverUrl?`, `title`, `platform?`, `onPress` | Library grid cell with `PlatformIcon` in top-right corner |
| `HomeGameCard` | `coverUrl`, `title`, `subtitle?`, `size?`, `onPress` | Home horizontal carousel card |
| `SearchResultCard` | `coverUrl`, `title`, `isInWishlist`, `onPress`, `onToggleWishlist` | Search result row |
| `WishlistGameCard` | `coverUrl`, `title`, `discountPercentage?`, `onPress`, `onRemove` | Wishlist row |
| `DealCard` | `storeName`, `price`, `originalPrice`, `discountPercentage`, `onPress` | Deal entry in game detail |
| `ProtonDbBadge` | `rating: string \| null` | Colored tier badge (platinum/gold/silver/bronze/borked) |
| `HltbInfo` | `mainHours`, `completionistHours` | 3-column estimated playtime display |

### Platforms (`components/platforms/`)

| Component | Props | Purpose |
|---|---|---|
| `PlatformBadge` | `platform: Platform` | Steam or Epic Games text badge (used in GameDetail meta row) |
| `PlatformIcon` | `platform: Platform`, `size?` | Small round icon — Steam uses `MaterialCommunityIcons "steam"` glyph; Epic uses a styled "E" badge on `colors.epic` background. Used in `GameCard` corner. |

---

## Theme (`theme/`)

Dark mode is the **only** theme. All components import tokens from here — no inline color or spacing literals.

### `colors.ts`

```ts
background:   '#000000'   // OLED black (legacy alias)
backgroundBase: '#000000' // semantic base background
backgroundGradientStops: ['rgba(...)', ..., '#000000'] // subtle global gradient
surface:      '#1C1C1E'   // card / input backgrounds (= inputBackground)
primary:      '#0A84FF'   // iOS system blue (= inputFocusBorder)
secondary:    '#5E5CE6'   // iOS Indigo
textPrimary:  '#FFFFFF'
textSecondary: '#EBEBF599'  // 60% white
error:        '#FF453A'
success:      '#32D74B'
// Platform brand colors: steam, steamAccent, epic
// ProtonDB tier colors: protonPlatinum/Gold/Silver/Bronze/Borked/Pending
// iOS system colors for settings icons:
iosRed:       '#FF3B30'   // Notifications
iosPurple:    '#5856D6'   // Help/Support
iosGreen:     '#34C759'   // Privacy
```

### `typography.ts`

Named text styles include `largeTitle`, `inputLarge`, `micro` in addition to the base scale (`hero` → `small`). Font families: SF Pro (iOS) / Roboto (Android).

### `spacing.ts`

```ts
// Spacing (multiples of 4px)
xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48

// Border radius
radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 24, full: 9999 }

// Shadow presets: small, medium, large

// Layout constants
layout.tabBarClearance: 100           // paddingBottom for lists with tab bar
layout.safeAreaPaddingTop: { ios: 100, android: 64 }  // header-less screens
layout.authHeaderTop: { ios: 60, android: 24 }        // floating back buttons
```
