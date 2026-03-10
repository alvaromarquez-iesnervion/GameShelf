# DI Layer (Dependency Injection)

## Purpose

Connects `domain/` interfaces with their `data/` and `presentation/` implementations. Acts as the project's wiring map: every injectable class receives its dependencies here, never instantiated manually elsewhere.

This layer knows all other layers (`domain/`, `data/`, `presentation/`). No other layer imports from `di/`. It is the only place where infrastructure and domain meet.

---

## Files

| File | Contents |
|---|---|
| `container.ts` | Inversify container with all registered bindings |
| `types.ts` | `Symbol.for()` identifiers used as DI keys |
| `hooks/useInjection.ts` | React hook bridge between components and the container |

---

## `container.ts` — Operating Modes

The container reads env vars at startup and selects implementations:

| Env vars present | Active implementations |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Auth, Wishlist, Notification → real `*RepositoryImpl` (Firestore) |
| `EXPO_PUBLIC_STEAM_API_KEY` | Steam, Games, Platforms → real impls (in-memory repos) |
| Both | Full production — all data persists in Firestore |
| Neither | Full mock mode — all repos/services use `Mock*` classes |

### Binding order

```
Firebase instances (when useFirebase)
  TYPES.FirebaseAuth    → getFirebaseAuth()   [toDynamicValue]
  TYPES.Firestore       → getFirebaseFirestore() [toDynamicValue]

Guest session (always — universal, independent of Firebase)
  IGuestSessionRepository → GuestSessionRepository   [AsyncStorage]

Repositories (singleton)
  IAuthRepository         → AuthRepositoryImpl      (or MockAuthRepository)
  IWishlistRepository     → WishlistRepositoryImpl   (or MockWishlistRepository)
  INotificationRepository → NotificationRepositoryImpl (or MockNotificationRepository)

  Production mode (useFirebase && useRealSteam):
    FirestorePlatformRepository → PlatformRepositoryImpl   [private symbol]
    FirestoreGameRepository     → GameRepositoryImpl        [private symbol]
    LocalPlatformRepository     → LocalPlatformRepository   [private symbol — AsyncStorage]
    LocalGameRepository         → LocalGameRepository       [private symbol — AsyncStorage]
    IPlatformRepository         → GuestAwarePlatformRepository  [public — routes by userId]
    IGameRepository             → GuestAwareGameRepository       [public — routes by userId]

  Steam-only mode (useRealSteam only):
    IPlatformRepository → MemoryPlatformRepository
    IGameRepository     → SteamSyncMemoryGameRepository

  Mock mode:
    IPlatformRepository → MockPlatformRepository
    IGameRepository     → MockGameRepository

External services (singleton)
  ISteamApiService        → SteamApiServiceImpl
  IEpicGamesApiService    → EpicGamesApiServiceImpl
  IProtonDbService        → ProtonDbServiceImpl
  IHowLongToBeatService   → HowLongToBeatServiceImpl
  IIsThereAnyDealService  → IsThereAnyDealServiceImpl

Use cases (singleton, toDynamicValue + inSingletonScope)
  ILibraryUseCase      → new LibraryUseCase(IGameRepository, IPlatformRepository)
  IWishlistUseCase     → new WishlistUseCase(IWishlistRepository, IIsThereAnyDealService)
  IGameDetailUseCase   → new GameDetailUseCase(IGameRepository, IProtonDbService, IHowLongToBeatService, IIsThereAnyDealService, IWishlistRepository)
  ISearchUseCase       → new SearchUseCase(IGameRepository, IWishlistRepository)
  IPlatformLinkUseCase → new PlatformLinkUseCase(IPlatformRepository, ISteamApiService, IEpicGamesApiService, IGameRepository)
  ISettingsUseCase     → new SettingsUseCase(IAuthRepository, IPlatformRepository, INotificationRepository)
  IHomeUseCase         → new HomeUseCase(IGameRepository, ISteamApiService, IPlatformRepository)

ViewModels (see singleton/transient table below)
```

> **Note:** There is no `IAuthUseCase` binding. `AuthViewModel` is bound directly to `IAuthRepository`.

---

## `types.ts` — TYPES Symbols

Every interface and ViewModel has a unique `Symbol.for()` to avoid container collisions:

```ts
export const TYPES = {
  // Repositories
  IAuthRepository:         Symbol.for('IAuthRepository'),
  IGuestSessionRepository: Symbol.for('IGuestSessionRepository'),
  IGameRepository:         Symbol.for('IGameRepository'),
  IWishlistRepository:     Symbol.for('IWishlistRepository'),
  IPlatformRepository:     Symbol.for('IPlatformRepository'),
  INotificationRepository: Symbol.for('INotificationRepository'),

  // Private routing symbols (used internally by GuestAware* wrappers and container.ts only)
  FirestorePlatformRepository: Symbol.for('FirestorePlatformRepository'),
  LocalPlatformRepository:     Symbol.for('LocalPlatformRepository'),
  FirestoreGameRepository:     Symbol.for('FirestoreGameRepository'),
  LocalGameRepository:         Symbol.for('LocalGameRepository'),

  // Firebase instances
  FirebaseAuth:    Symbol.for('FirebaseAuth'),
  Firestore:       Symbol.for('Firestore'),

  // Services
  ISteamApiService:       Symbol.for('ISteamApiService'),
  IEpicGamesApiService:   Symbol.for('IEpicGamesApiService'),
  IProtonDbService:       Symbol.for('IProtonDbService'),
  IHowLongToBeatService:  Symbol.for('IHowLongToBeatService'),
  IIsThereAnyDealService: Symbol.for('IIsThereAnyDealService'),

  // Use cases
  ILibraryUseCase:     Symbol.for('ILibraryUseCase'),
  IWishlistUseCase:    Symbol.for('IWishlistUseCase'),
  IGameDetailUseCase:  Symbol.for('IGameDetailUseCase'),
  ISearchUseCase:      Symbol.for('ISearchUseCase'),
  IPlatformLinkUseCase: Symbol.for('IPlatformLinkUseCase'),
  ISettingsUseCase:    Symbol.for('ISettingsUseCase'),
  IHomeUseCase:        Symbol.for('IHomeUseCase'),

  // ViewModels
  AuthViewModel:        Symbol.for('AuthViewModel'),
  LibraryViewModel:     Symbol.for('LibraryViewModel'),
  WishlistViewModel:    Symbol.for('WishlistViewModel'),
  HomeViewModel:        Symbol.for('HomeViewModel'),
  GameDetailViewModel:  Symbol.for('GameDetailViewModel'),
  SearchViewModel:      Symbol.for('SearchViewModel'),
  PlatformLinkViewModel: Symbol.for('PlatformLinkViewModel'),
  SettingsViewModel:    Symbol.for('SettingsViewModel'),
};
```

---

## Singleton vs Transient

| ViewModel | Scope | Reason |
|---|---|---|
| `AuthViewModel` | **Singleton** | Global auth state. `RootNavigator` observes it constantly. |
| `LibraryViewModel` | **Singleton** | Shared library state across tabs. Avoids reloads on navigation. |
| `WishlistViewModel` | **Singleton** | Read from 3 screens (Wishlist, Search/Home, GameDetail). |
| `HomeViewModel` | **Singleton** | Home section data (recent, most played) shared globally. |
| `GameDetailViewModel` | **Transient** | Each detail screen is independent. |
| `SearchViewModel` | **Transient** | Each search starts fresh. |
| `PlatformLinkViewModel` | **Transient** | Only active on the platform linking screen. |
| `SettingsViewModel` | **Transient** | Only active on the settings screen. |

All repositories, services, and use cases are **singleton**.

### Why use cases use `toDynamicValue`

Use cases in `domain/` have no Inversify decorators (to keep the domain pure). They cannot use `.to(Class)` binding. Instead:

```ts
container.bind<ILibraryUseCase>(TYPES.ILibraryUseCase)
  .toDynamicValue(ctx => new LibraryUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
  ))
  .inSingletonScope(); // REQUIRED — toDynamicValue does not inherit container defaultScope
```

The `.inSingletonScope()` call is mandatory — omitting it creates a new instance on every resolution.

---

## `hooks/useInjection.ts`

The **only point** where React components connect to the container. ViewModels never use this hook — they are plain injectable classes.

```ts
export function useInjection<T>(identifier: symbol): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) {
    ref.current = container.get<T>(identifier);
  }
  return ref.current;
}
```

- Singleton bindings: always returns the same instance.
- Transient bindings: `useRef` ensures a stable instance within the component's lifecycle (created once on first render, reused on re-renders).
- Known caveat: if React reuses the same component for a different entity (e.g., navigating from one game detail to another), `useRef` retains the previous ViewModel instance. See `KNOWN_ISSUES.md §2 (Transient VM stale data)`.

```tsx
// In a screen component:
const vm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
```

---

## Adding a New Injectable

1. Create the class/interface in the correct layer.
2. Add a `Symbol.for('YourName')` entry to `types.ts`.
3. If it's in `data/` or `presentation/`: add `@injectable()` to the class and `@inject(TYPES.X)` to each constructor parameter.
4. If it's a use case in `domain/`: no decorators. Add a `toDynamicValue(ctx => new YourUseCase(...)).inSingletonScope()` binding to `container.ts`.
5. Register the binding in `container.ts` in the appropriate section.
