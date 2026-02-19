# Domain — Capa de dominio

## Propósito

Núcleo de la aplicación. **No depende de ninguna otra capa.** Todo es TypeScript puro sin imports de Firebase, Axios ni React. Define los contratos que el resto del proyecto debe cumplir.

Regla: si un archivo en esta carpeta importa algo de `data/`, `di/` o `presentation/`, es un error de arquitectura.

---

## Estructura

```
domain/
├── entities/      # Objetos fundamentales del negocio
├── enums/         # Enumeraciones compartidas (Platform, etc.)
├── dtos/          # Agregadores de datos de múltiples fuentes
├── interfaces/
│   ├── repositories/  # Contratos de acceso a datos (Firestore)
│   ├── services/      # Contratos de APIs externas
│   └── usecases/      # Contratos de lógica de negocio
└── usecases/      # Implementaciones de la lógica de negocio
```

---

## Entidades

| Entidad | Descripción | Campos clave |
|---|---|---|
| `User` | Usuario autenticado | `id` (UID Firebase), `email`, `displayName` |
| `Game` | Juego en la biblioteca | `id`, `title`, `coverUrl`, `platform`, `steamAppId` (null si Epic), `itadGameId` (caché UUID de ITAD) |
| `Platform` (enum) | Plataforma de origen | `STEAM`, `EPIC_GAMES` |
| `LinkedPlatform` | Cuenta externa vinculada | `platform`, `externalUserId` (SteamID o "imported"), `linkedAt` |
| `WishlistItem` | Juego en la wishlist | `id`, `gameId`, `title`, `coverUrl`, `addedAt`, `bestDealPercentage` (null si no hay oferta) |
| `Deal` | Oferta activa (de ITAD) | `storeName`, `price`, `originalPrice`, `discountPercentage`, `url` |
| `GameDetail` | Juego enriquecido | `game`, `protonDbRating`, `protonDbTrendingRating`, `howLongToBeatMain/Extra/Completionist`, `deals[]` |
| `SearchResult` | Resultado de búsqueda | `id`, `title`, `coverUrl`, `isInWishlist` |
| `NotificationPreferences` | Preferencias push | `dealsEnabled` |
| `ProtonDbRating` | Rating de compatibilidad | `tier`, `trendingTier`, `total` (valores en minúsculas: "platinum", "gold", "silver", "bronze", "borked") |
| `HltbResult` | Duración estimada | `main`, `mainExtra`, `completionist` (horas decimales, null si no disponible) |

---

## DTOs

Solo existen DTOs cuando se agregan datos de **múltiples fuentes** para una sola pantalla. Los use cases que devuelven un tipo simple retornan directamente (sin wrapper).

| DTO | Fuentes que agrega | Usado en |
|---|---|---|
| `GameDetailDTO` | `GameDetail` (4 APIs) + `isInWishlist` | `GameDetailUseCase` → `GameDetailViewModel` |
| `UserProfileDTO` | `User` + `LinkedPlatform[]` + `NotificationPreferences` | `SettingsUseCase` → `SettingsViewModel` |

---

## Interfaces de repositorios

Abstraen el acceso a datos persistentes (Firestore). `data/` los implementa.

| Interfaz | Responsabilidad |
|---|---|
| `IAuthRepository` | `register`, `login`, `logout`, `getCurrentUser`, `deleteAccount` |
| `IGameRepository` | `getLibraryGames`, `getGameById`, `syncLibrary`, `searchGames` (via ITAD) |
| `IWishlistRepository` | `getWishlist`, `addToWishlist`, `removeFromWishlist`, `isInWishlist` |
| `IPlatformRepository` | `linkSteamPlatform`, `linkEpicPlatform`, `unlinkPlatform`, `getLinkedPlatforms` |
| `INotificationRepository` | `getNotificationPreferences`, `updateNotificationPreferences` |

---

## Interfaces de servicios

Abstraen APIs externas de terceros.

| Interfaz | API real | Notas |
|---|---|---|
| `ISteamApiService` | Steam Web API + OpenID 2.0 | `getOpenIdLoginUrl`, `extractSteamIdFromCallback`, `verifyOpenIdResponse`, `getUserGames`, `checkProfileVisibility` |
| `IEpicGamesApiService` | Sin API pública | `parseExportedLibrary` (JSON del export GDPR), `searchCatalog` (GraphQL no oficial) |
| `IProtonDbService` | Endpoint JSON no oficial | `getCompatibilityRating(steamAppId)` → `ProtonDbRating \| null` |
| `IHowLongToBeatService` | POST interno no oficial | `getGameDuration(gameTitle)` → `HltbResult \| null` |
| `IIsThereAnyDealService` | API v2 oficial | `lookupGameId`, `lookupGameIdBySteamAppId`, `getPricesForGame`, `getHistoricalLow`, `searchGames` |

---

## Interfaces de use cases

Contratos que los ViewModels consumen. Los ViewModels dependen de estas interfaces, no de las implementaciones.

| Interfaz | Métodos principales |
|---|---|
| `ILibraryUseCase` | `getLibrary`, `syncLibrary`, `searchInLibrary` |
| `IWishlistUseCase` | `getWishlist`, `addToWishlist`, `removeFromWishlist` |
| `IGameDetailUseCase` | `getGameDetail(gameId, userId): Promise<GameDetailDTO>` |
| `ISearchUseCase` | `searchGames(query, userId): Promise<SearchResult[]>` |
| `IPlatformLinkUseCase` | `linkSteam`, `linkEpic`, `unlinkPlatform`, `getLinkedPlatforms`, `getSteamLoginUrl` |
| `ISettingsUseCase` | `getProfile(userId): Promise<UserProfileDTO>`, `updateNotificationPreferences` |

> **Nota**: No existe `IAuthUseCase`. `AuthUseCase` fue eliminado por ser pass-through puro (delegaba 1:1 en `IAuthRepository` sin lógica). `AuthViewModel` depende directamente de `IAuthRepository`.

---

## Implementaciones de use cases

Contienen la lógica de negocio real. Orquestan repositorios y servicios.

| Use Case | Lógica destacada |
|---|---|
| `LibraryUseCase` | `syncLibrary`: itera plataformas vinculadas y llama `gameRepository.syncLibrary()` para cada una |
| `WishlistUseCase` | `getWishlist`: enriquece cada item con `getBestDeal()` de ITAD |
| `GameDetailUseCase` | `getGameDetail`: consulta ProtonDB, HLTB, ITAD y wishlist en **paralelo** con `Promise.allSettled` — el fallo de una API no rompe las demás |
| `SearchUseCase` | `searchGames`: busca via `IGameRepository` y cruza con `isInWishlist` para marcar el flag |
| `PlatformLinkUseCase` | Flujos separados: `linkSteam` (OpenID 2.0 → verificar → extraer SteamID → sync), `linkEpic` (parsear JSON → almacenar → marcar flag) |
| `SettingsUseCase` | `getProfile`: agrega `User` + `LinkedPlatform[]` + `NotificationPreferences` en un `UserProfileDTO` |
