# Data Layer

## Purpose

Implements the interfaces defined in `domain/`. Firebase, Axios, and all external API calls live here. If Firebase were replaced by another backend, **only this layer would change**.

**Rule:** `data/` knows `domain/` (implements its interfaces). `domain/` never knows `data/`.

---

## Structure

```
data/
├── mocks/         # In-memory mock implementations with seed data
├── repositories/  # IXRepository implementations (Firestore)
├── services/      # IXService implementations (external APIs via Axios)
├── mappers/       # Firestore ↔ domain entity conversions
└── config/        # Firebase initialization and API constants
```

---

## Repositories (`repositories/`)

Implement `domain/interfaces/repositories/`. All production repos use Firestore.

| Class | Interface | Firestore path |
|---|---|---|
| `AuthRepositoryImpl` | `IAuthRepository` | `users/{uid}` + Firebase Auth |
| `GameRepositoryImpl` | `IGameRepository` | `users/{userId}/library/{gameId}` |
| `WishlistRepositoryImpl` | `IWishlistRepository` | `users/{userId}/wishlist/{itemId}` |
| `PlatformRepositoryImpl` | `IPlatformRepository` | `users/{userId}/platforms/{platform}` |
| `NotificationRepositoryImpl` | `INotificationRepository` | `users/{userId}/settings/notifications` |

### Firestore schema

```
users/{userId}/
├── (fields: email, displayName)
├── library/{gameId}         → title, description, coverUrl, platform, steamAppId, itadGameId, playtime, lastPlayed
├── wishlist/{itemId}        → gameId, title, coverUrl, addedAt, bestDealPercentage
├── platforms/
│   ├── steam                → externalUserId (SteamID64), linkedAt
│   └── epic_games           → externalUserId ("accountId" or "imported"), linkedAt
└── settings/
    └── notifications        → dealsEnabled
```

### Implementation notes

- `AuthRepositoryImpl.deleteAccount()`: deletes subcollections doc-by-doc (known issue — should use `writeBatch()`), then deletes the user Firestore doc, then deletes the Firebase Auth account.
- `GameRepositoryImpl.syncLibrary(userId, platform)`: calls the appropriate API service, maps results, and batch-writes to Firestore (500 docs/batch using `writeBatch()`).
- `GameRepositoryImpl.getOrCreateGameById(userId, gameId, steamAppId?)`: first checks `users/{uid}/library/{gameId}`. If not found and `gameId` is numeric (`/^\d+$/.test(gameId)`), treats it as a Steam App ID and resolves it via `lookupGameIdBySteamAppId` → `getGameInfo`. Otherwise treats it as an ITAD UUID.
- `GameRepositoryImpl.updateSteamAppId(userId, gameId, steamAppId)`: partial Firestore update (`updateDoc`) that writes only the `steamAppId` field. Used by `GameDetailUseCase` Phase 0 to persist a resolved Steam App ID for Epic Games library entries.
- `PlatformRepositoryImpl.linkEpicPlatform(userId, epicAccountId?)`: stores the real Epic accountId when using the Auth Code flow, or the string `"imported"` when using GDPR import.

### Guest mode repositories (AsyncStorage)

Added in Session 31. Used when `isGuestUser(userId)` returns `true` (userId starts with `"guest_"`).

| Class | Interface | Storage key |
|---|---|---|
| `GuestSessionRepository` | `IGuestSessionRepository` | `@gameshelf/guest_id` |
| `LocalPlatformRepository` | `IPlatformRepository` | `@gameshelf/guest_platforms` |
| `LocalGameRepository` | `IGameRepository` | `@gameshelf/guest_library` |
| `GuestAwarePlatformRepository` | `IPlatformRepository` | Routes to Local or Firestore based on `userId` prefix |
| `GuestAwareGameRepository` | `IGameRepository` | Routes to Local or Firestore; `searchGames` always uses Firestore (ITAD only) |

`GuestAwarePlatformRepository` and `GuestAwareGameRepository` are the **public** bindings in production mode. They delegate to the appropriate concrete implementation transparently to callers.

`LocalGameRepository.syncLibrary()` calls `ISteamApiService` directly and writes results to AsyncStorage. All other `IGameRepository` methods read/write from `@gameshelf/guest_library`.

`GuestSessionRepository` is bound **universally** (not conditional on Firebase), so all modes support guest sessions.

### In-memory repositories (Steam-only mode)

`MemoryPlatformRepository` and `SteamSyncMemoryGameRepository` are used when `EXPO_PUBLIC_STEAM_API_KEY` is set but Firebase is not. Data is lost on restart.

---

## Services (`services/`)

Implement `domain/interfaces/services/`. Each encapsulates one external API.

### `SteamApiServiceImpl`

- **Auth**: OpenID 2.0 (not OAuth2). No token stored — only the SteamID.
- **Library**: `GET IPlayerService/GetOwnedGames/v1/?key={KEY}&steamid={id}&include_appinfo=1`
- **Recently played**: `GET IPlayerService/GetRecentlyPlayedGames/v1/` → games played in the last 2 weeks
- **Most played globally**: `GET ISteamChartsService/GetMostPlayedGames/v1` → top charts
- **Covers**: `https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg`
- **Profile visibility**: `GET ISteamUser/GetPlayerSummaries/v2/` → `communityvisibilitystate === 3`. Private profiles return empty owned games — surface a warning to the user.
- **SteamID resolution**: `resolveSteamId()` accepts SteamID64, profile URL, or vanity name and calls `ResolveVanityURL` as needed.
- **Store metadata**: `getSteamAppDetails(appId)` → `GET store.steampowered.com/api/appdetails` — genres, developers, publishers, release date, Metacritic, screenshots, recommendations.
- **Store search**: `searchSteamAppId(title)` → `GET store.steampowered.com/api/storesearch/` — returns the best-matching Steam App ID using a 4-level fuzzy match (exact → contains → cross-contains → word-overlap ≥ 0.7). Used by `GameDetailUseCase` Phase 0 to enrich Epic Games entries.
- **Internal mapper** (`mapSteamGameToDomain`): private method. Includes `playtime_forever` and `rtime_last_played`.

### `EpicGamesApiServiceImpl`

Epic has no public library API. Two flows are implemented:

**Preferred: Authorization Code (unofficial internal API)**
1. `getAuthUrl()`: returns `EPIC_AUTH_REDIRECT_URL` — user opens this in the browser, logs in, and gets a ~32-char code.
2. `exchangeAuthCode(code)`: POST to `account-public-service-prod.ol.epicgames.com/account/api/oauth/token` using Basic Auth with `launcherAppClient2` credentials. Returns an `EpicAuthToken`.
3. `fetchLibrary(accessToken, accountId)`: GET entitlements from `entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/{accountId}/entitlements?count=5000`.

> **Warning:** uses an undocumented Epic internal API. May break without notice. Violates Epic ToS.

**Fallback: GDPR JSON import**
- `parseExportedLibrary(fileContent)`: user exports data at `epicgames.com/account/privacy` (24–48h wait), downloads the ZIP, and pastes the JSON into the app.

**Game enrichment** (common to both flows):
- Each game is looked up on ITAD by title to obtain `itadGameId` and cover URL.
- If ITAD fails, the game is still created without those fields (`Promise.allSettled` — robust to failures).

**Known issue:** `Buffer.from()` is used for Basic Auth encoding — this crashes in React Native (Hermes has no `Buffer`). Replace with `btoa()`. See `KNOWN_ISSUES.md §1`.

### `ProtonDbServiceImpl`

- **Endpoint**: `GET https://www.protondb.com/api/v1/reports/summaries/{steamAppId}.json`
- **Required headers**: `User-Agent: Mozilla/5.0` and `Referer: https://www.protondb.com` — without them the request may be blocked.
- Returns `null` on failure (unofficial endpoint).
- Only works for Steam games — Epic games have no `steamAppId`.

### `HowLongToBeatServiceImpl`

The `/api/search` endpoint returns 404. Current flow:
1. `GET /api/finder/init?t={timestamp}` → `{ token: string }` — session token.
2. `POST /api/finder` with header `x-auth-token: {token}` and JSON body: `{ searchType: "games", searchTerms: title.split(' '), searchPage: 1, size: 5, searchOptions: {...}, useCache: true }`.
3. Response field `comp_main`, `comp_plus`, `comp_100` are in **seconds** — divide by 3600 for hours.
4. Token auto-refreshes on 403.

> Do not use the `howlongtobeat` npm package — it depends on Node.js modules (`events`, `stream`, `buffer`) that are not available in Hermes/JSC.

### `IsThereAnyDealServiceImpl`

- **Base URL**: `https://api.isthereanydeal.com` (official API v2)
- **API key**: `EXPO_PUBLIC_ITAD_API_KEY` from `.env`
- **Deal lookup flow**:
  1. `POST /games/lookup/v1` with `[title]` → ITAD UUID
  2. Or (more reliable if steamAppId exists): `POST /games/lookup/id/shop/v1` with `{ shop: "steam", ids: ["app/{appId}"] }`
  3. `POST /games/prices/v2` with `[uuid]` → price list per store
- **Search**: `GET /games/search/v1?title={query}` — broad catalog covering ~50 stores
- **Internal mapper** (`mapItadPriceToDeal`): private method inside the class.

---

## Mappers (`mappers/`)

Only **Firestore mappers** have separate files because they are bidirectional (`toDomain` + `toFirestore`) and reused across multiple repositories. External API mappers are private methods inside their `ServiceImpl`.

| Mapper | Conversion |
|---|---|
| `FirestoreGameMapper` | `toDomain(doc): Game` / `toFirestore(game): Record<string, unknown>` |
| `FirestoreWishlistMapper` | `toDomain(doc): WishlistItem` / `toFirestore(item): Record<string, unknown>` |

---

## Configuration (`config/`)

| File | Contents |
|---|---|
| `FirebaseConfig.ts` | `initializeFirebase()`, `getFirebaseAuth()`, `getFirebaseFirestore()`. Called from `App.tsx` before the DI container is imported. |
| `ApiConstants.ts` | Base URLs and API keys (sensitive values read from `.env`). Includes: `STEAM_API_BASE_URL`, `STEAM_CDN_BASE`, `EPIC_AUTH_TOKEN_URL`, `EPIC_ENTITLEMENTS_URL`, `EPIC_AUTH_CLIENT_ID`, `EPIC_AUTH_CLIENT_SECRET`, `EPIC_AUTH_REDIRECT_URL`, `EPIC_GRAPHQL_URL`, `PROTONDB_API_URL`, `HLTB_INIT_URL`, `HLTB_SEARCH_URL`, `ITAD_API_BASE_URL`. |

> API keys must never be hardcoded. Read from `.env` (see `.env.example`). Exception: Epic client credentials are currently hardcoded — see `KNOWN_ISSUES.md §1`.

---

## Mocks (`mocks/`)

12 mock implementations that mirror the same interfaces as their real counterparts — fully interchangeable in the DI container. Active by default when no env vars are set.

**Seed data in `MockDataProvider`:**
- Steam: Elden Ring, Cyberpunk 2077, Hades, Baldur's Gate 3, Hollow Knight, Stardew Valley
- Epic: Death Stranding Director's Cut, Alan Wake 2
- Wishlist: Cyberpunk 2077 (60% off), Baldur's Gate 3 (no deal)
- ProtonDB ratings, HLTB hours, search results, and popular games also provided
