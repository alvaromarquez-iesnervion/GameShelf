# Domain Layer

## Purpose

The core of the application. **No external dependencies.** Pure TypeScript — no Firebase, Axios, React, or Inversify imports allowed here. Defines all contracts that the rest of the project must fulfil.

**Rule:** if any file in `domain/` imports from `data/`, `di/`, or `presentation/`, it is an architecture violation.

---

## Structure

```
domain/
├── entities/      # Core business objects
├── enums/         # Shared enumerations
├── dtos/          # Multi-source data aggregators
├── interfaces/
│   ├── repositories/  # Data persistence contracts (implemented by data/)
│   ├── services/      # External API contracts (implemented by data/)
│   └── usecases/      # Business logic contracts (consumed by presentation/)
└── usecases/      # Business logic implementations
```

---

## Entities

| Entity | Description | Key fields |
|---|---|---|
| `User` | Authenticated user | `id` (Firebase UID), `email`, `displayName` |
| `Game` | Game in the library | `id`, `title`, `coverUrl`, `platform`, `steamAppId` (null for Epic until resolved), `itadGameId`, `playtime` (minutes), `lastPlayed` (Date\|null) |
| `Platform` (enum) | Game platform origin | `STEAM = 'STEAM'`, `EPIC_GAMES = 'EPIC_GAMES'` |
| `LinkedPlatform` | Linked external account | `platform`, `externalUserId` (SteamID64 or `"imported"`), `linkedAt` |
| `WishlistItem` | Game on the wishlist | `id`, `gameId`, `title`, `coverUrl`, `addedAt`, `bestDealPercentage` (null if no deal) |
| `Deal` | Active deal from ITAD | `storeName`, `price`, `originalPrice`, `discountPercentage`, `url` |
| `GameDetail` | Enriched game aggregate | `game`, `protonDbRating`, `howLongToBeatMain/Extra/Completionist`, `deals[]` |
| `SearchResult` | Search result entry | `id`, `title`, `coverUrl`, `isInWishlist`, `steamAppId?` |
| `ProtonDbRating` | Proton compatibility | `tier`, `trendingTier`, `total` (values: `"platinum"`, `"gold"`, `"silver"`, `"bronze"`, `"borked"`) |
| `HltbResult` | Estimated play time | `main`, `mainExtra`, `completionist` (decimal hours, null if unavailable) |
| `NotificationPreferences` | Push settings | `dealsEnabled` |

All entities use **private fields + getter methods** (e.g., `game.getTitle()`, `game.getId()`). This is an intentional project-wide convention — see `AGENTS.md`.

---

## DTOs

DTOs are only created when **multiple sources are aggregated** for a single screen. Use cases that return a single type return it directly.

| DTO | Sources | Used in |
|---|---|---|
| `GameDetailDTO` | `GameDetail` (4 APIs) + `isInWishlist` flag | `GameDetailUseCase` → `GameDetailViewModel` |
| `UserProfileDTO` | `User` + `LinkedPlatform[]` + `NotificationPreferences` | `SettingsUseCase` → `SettingsViewModel` |
| `EpicAuthToken` | Epic internal auth token (auth code flow) | `IEpicGamesApiService.exchangeAuthCode` → `PlatformLinkUseCase` |

---

## Repository Interfaces

Abstract persistent data access. Implemented by `data/repositories/`.

| Interface | Methods |
|---|---|
| `IAuthRepository` | `register`, `login`, `logout`, `getCurrentUser`, `deleteAccount`, `resetPassword` |
| `IGameRepository` | `getLibraryGames`, `getGameById(userId, gameId)`, `getOrCreateGameById(userId, gameId, steamAppId?)`, `syncLibrary`, `searchGames`, `storeEpicGames` |
| `IWishlistRepository` | `getWishlist`, `addToWishlist`, `removeFromWishlist`, `isInWishlist` |
| `IPlatformRepository` | `linkSteamPlatform`, `linkEpicPlatform(userId, epicAccountId?)`, `unlinkPlatform`, `getLinkedPlatforms` |
| `INotificationRepository` | `getNotificationPreferences`, `updateNotificationPreferences` |

---

## Service Interfaces

Abstract external third-party APIs. Implemented by `data/services/`.

| Interface | External API | Notes |
|---|---|---|
| `ISteamApiService` | Steam Web API + OpenID 2.0 + Store API | `getOpenIdLoginUrl`, `extractSteamIdFromCallback`, `verifyOpenIdResponse`, `getUserGames`, `getRecentlyPlayedGames`, `getMostPlayedGames`, `checkProfileVisibility`, `resolveSteamId`, `getSteamAppDetails`, `searchSteamAppId(title)` |
| `IEpicGamesApiService` | Epic internal (unofficial) | `getAuthUrl()`, `exchangeAuthCode(code)`, `fetchLibrary(token, accountId)`, `parseExportedLibrary(json)` (GDPR fallback), `searchCatalog` |
| `IGogApiService` | GOG internal OAuth2 (unofficial) | `getAuthUrl()`, `exchangeAuthCode(code)`, `refreshToken(refreshToken)`, `getUserGames(accessToken)`. Cover = `_392.jpg`, portrait/hero = `_bg_crop_1680x655.jpg` |
| `IProtonDbService` | ProtonDB JSON endpoint (unofficial) | `getCompatibilityRating(steamAppId): ProtonDbRating \| null` |
| `IHowLongToBeatService` | HLTB internal POST (unofficial) | `getGameDuration(title): HltbResult \| null` |
| `IIsThereAnyDealService` | ITAD API v2 (official) | `lookupGameId`, `lookupGameIdBySteamAppId`, `getPricesForGame`, `getHistoricalLow`, `searchGames`, `getGameInfo` |

---

## Use Case Interfaces

Consumed by ViewModels. ViewModels always depend on these interfaces, never on implementations.

| Interface | Key methods |
|---|---|
| `ILibraryUseCase` | `getLibrary`, `syncLibrary`, `searchInLibrary`, `getLinkedPlatforms(userId)` |
| `IWishlistUseCase` | `getWishlist`, `addToWishlist`, `removeFromWishlist` |
| `IGameDetailUseCase` | `getGameDetail(gameId, userId): Promise<GameDetailDTO>` |
| `ISearchUseCase` | `searchGames(query, userId): Promise<SearchResult[]>` |
| `IPlatformLinkUseCase` | `getSteamLoginUrl`, `getEpicAuthUrl`, `linkSteam`, `linkSteamById`, `linkEpic`, `linkEpicByAuthCode`, `unlinkPlatform`, `getLinkedPlatforms` |
| `ISettingsUseCase` | `getProfile(userId): Promise<UserProfileDTO>`, `updateNotificationPreferences` |
| `IHomeUseCase` | `getPopularGames`, `getRecentlyPlayed(userId)`, `getMostPlayed(userId, limit?)`, `searchGames(query, userId)` |

> **Note:** There is no `IAuthUseCase`. `AuthViewModel` depends directly on `IAuthRepository` — see `AGENTS.md`.

---

## Use Case Implementations

Pure TypeScript classes with **no** `@injectable`, `@inject`, `TYPES`, or `reflect-metadata`. Dependencies are injected via plain typed constructor parameters. DI wiring happens entirely in `di/container.ts`.

| Use Case | Notable logic |
|---|---|
| `LibraryUseCase` | `syncLibrary`: iterates linked platforms and calls `gameRepository.syncLibrary()` for each. `getLinkedPlatforms`: delegates to `IPlatformRepository` — encapsulates the repo access so `LibraryViewModel` has no direct repo dependency. |
| `WishlistUseCase` | `getWishlist`: enriches each item with best deal from ITAD via `Promise.allSettled`. |
| `GameDetailUseCase` | `getGameDetail`: **Phase 0** (Epic + GOG) — resolves Steam App ID via ITAD then Steam Store Search, persists to Firestore; **Phase 1** — queries ProtonDB, HLTB, ITAD deals, wishlist, and Steam metadata in **parallel** with `Promise.allSettled`. |
| `SearchUseCase` | `searchGames`: searches via `IGameRepository` (ITAD), loads library and wishlist in parallel, cross-checks each result to set `isInWishlist` and `isOwned + ownedPlatforms` (matched by `steamAppId`). |
| `PlatformLinkUseCase` | Two Steam flows (OpenID 2.0 + direct SteamID). Two Epic flows (Auth Code + GDPR JSON). Both Epic flows: parse → enrich with ITAD → store → sync (non-blocking). |
| `HomeUseCase` | `getMostPlayed`: syncs Steam first (silent fail), then sorts library by playtime. `getRecentlyPlayed`: reads Steam recently-played API. |
| `SettingsUseCase` | `getProfile`: aggregates `User` + `LinkedPlatform[]` + `NotificationPreferences` into a `UserProfileDTO`. |
