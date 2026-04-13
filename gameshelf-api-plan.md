# Plan de Migración: GameShelf App → GameShelfApi

> Fecha: 2026-04-07  
> Rama actual: `feat/gameshelf-api-migration`  
> Objetivo: reemplazar todas las llamadas directas a APIs externas (Steam, Epic, GOG, PSN, HLTB, ProtonDB, ITAD) por un único cliente HTTP que apunta a GameShelfApi.

---

## Principio rector

La app deja de saber que existen Steam, HLTB, ProtonDB, etc.  
Solo conoce dos cosas externas: **Firebase Auth** (para identidad) y **GameShelfApi** (para todo lo demás).

---

## Resumen de cambios por capa

| Capa | Antes | Después |
|------|-------|---------|
| `data/services/` | 7 clientes de APIs externas | 1 `GameShelfApiClientImpl` |
| `data/repositories/` | Firestore directo + llamadas a servicios | Delega a la API |
| `domain/interfaces/services/` | 8 interfaces de servicios externos | 1 `IGameShelfApiClient` |
| `domain/usecases/` | Inyectan ProtonDB, HLTB, ITAD, Steam… | Solo usan repos + API client |
| `di/container.ts` | 8 bindings de servicios externos | 1 binding del cliente API |
| `.env` | STEAM_API_KEY, ITAD_API_KEY, etc. | Solo `EXPO_PUBLIC_GAMESHELF_API_URL` |

---

## FASE 1 — Infraestructura base (sin romper nada)

### 1.1 — Crear `IGameShelfApiClient` en domain

**Nuevo archivo:** `src/domain/interfaces/services/IGameShelfApiClient.ts`

```typescript
interface IGameShelfApiClient {
  // Auth
  syncUser(): Promise<void>;

  // Library
  getLibrary(filters?: LibraryFilters, page?: number): Promise<PaginatedResult<Game>>;
  syncLibrary(): Promise<SyncResult>;

  // Games
  getGameDetail(gameId: string): Promise<GameDetail>;  // incluye ProtonDB + HLTB + ITAD
  getGameDlcs(gameId: string): Promise<Dlc[]>;

  // Search
  searchGames(query: string): Promise<Game[]>;

  // Wishlist
  getWishlist(): Promise<WishlistItem[]>;
  addToWishlist(gameId: string): Promise<WishlistItem>;
  removeFromWishlist(itemId: string): Promise<void>;
  isInWishlist(gameId: string): Promise<boolean>;

  // Platforms
  getLinkedPlatforms(): Promise<Platform[]>;
  getPlatformAuthUrl(platform: PlatformType): Promise<string>;
  linkPlatformWithCode(platform: PlatformType, code: string): Promise<void>;
  linkPlatformWithNpsso(npsso: string): Promise<void>;
  linkPlatformGdpr(platform: PlatformType, data: object): Promise<void>;
  unlinkPlatform(platform: PlatformType): Promise<void>;

  // Home
  getHomeData(): Promise<HomeData>;
}
```

### 1.2 — Implementar `GameShelfApiClientImpl`

**Nuevo archivo:** `src/data/services/GameShelfApiClientImpl.ts`

- `fetch` nativo (ya disponible en RN)
- Inyecta el Firebase ID token en `Authorization: Bearer <token>` en cada request
- Base URL desde `EXPO_PUBLIC_GAMESHELF_API_URL`
- Mapea códigos HTTP a errores de dominio existentes

```typescript
private async getAuthHeader(): Promise<Record<string, string>> {
  const token = await FirebaseAuth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

---

## FASE 2 — Repositorios nuevos

### 2.1 — `GameShelfApiGameRepository`

**Nuevo archivo:** `src/data/repositories/GameShelfApiGameRepository.ts`  
Implementa `IGameRepository`. Reemplaza `GameRepositoryImpl`.

| Método | Endpoint |
|--------|----------|
| `syncLibrary()` | `POST /api/v1/library/sync` |
| `getLibraryGames()` | `GET /api/v1/library` |
| `getGameById()` | `GET /api/v1/games/{id}` |
| `getOwnedDlcsForGame()` | `GET /api/v1/games/{id}/dlcs` |

> Los tokens OAuth de plataformas ya no se guardan en SecureStore del cliente — el backend los gestiona.

### 2.2 — `GameShelfApiWishlistRepository`

**Nuevo archivo:** `src/data/repositories/GameShelfApiWishlistRepository.ts`  
Implementa `IWishlistRepository`. Reemplaza `WishlistRepositoryImpl` (Firestore).  
Delega a `/api/v1/wishlist`.

### 2.3 — `GameShelfApiPlatformRepository`

**Nuevo archivo:** `src/data/repositories/GameShelfApiPlatformRepository.ts`  
Implementa `IPlatformRepository`. Reemplaza `PlatformRepositoryImpl` (Firestore).  
Delega a `/api/v1/platforms`.

---

## FASE 3 — Cambios en Use Cases

### 3.1 — `GameDetailUseCase` ← cambio mayor

**Antes:** 5 dependencias — `IGameRepository`, `IWishlistRepository`, `IProtonDbService`, `IHowLongToBeatService`, `IIsThereAnyDealService`, `ISteamApiService`  
**Después:** 2 dependencias — `IGameRepository`, `IWishlistRepository`

La API devuelve ProtonDB + HLTB + ITAD ya integrados en `GET /api/v1/games/{id}`.  
Toda la lógica de enriquecimiento paralelo desaparece del cliente.

### 3.2 — `PlatformLinkUseCase` ← cambio mayor

**Antes:** inyectaba `ISteamApiService`, `IEpicGamesApiService`, `IGogApiService`, `IPsnApiService`  
**Después:** solo `IGameShelfApiClient`

Flujo OAuth nuevo:
```
1. App pide URL al backend:  GET /api/v1/platforms/{platform}/auth-url
2. App abre esa URL en WebView (igual que ahora)
3. App captura el code/callback
4. App envía al backend:      POST /api/v1/platforms/{platform}/link
5. Backend guarda el token; el cliente nunca lo ve
```

### 3.3 — `WishlistUseCase` ← cambio menor

**Antes:** inyectaba `IIsThereAnyDealService` para precios  
**Después:** solo `IWishlistRepository` — el backend ya incluye datos ITAD en `/api/v1/wishlist`

### 3.4 — `HomeUseCase` ← cambio menor

**Antes:** inyectaba `IPopularGamesService` (alias de ISteamApiService)  
**Después:** usa `IGameShelfApiClient.getHomeData()` → `GET /api/v1/home`

### 3.5 — `LibraryUseCase` ← sin cambio de firma

Solo cambia la implementación del repositorio debajo. El caso de uso no sabe nada.

### 3.6 — `SearchUseCase` ← sin cambio de firma

Igual. El repositorio delega a `GET /api/v1/search`.

### 3.7 — `AuthUseCase` ← cambio menor

Añadir llamada a `POST /api/v1/auth/sync` tras login exitoso.

---

## FASE 4 — Actualizar DI container

### Bindings que desaparecen
```
ISteamApiService, IEpicGamesApiService, IGogApiService, IPsnApiService
IProtonDbService, IHowLongToBeatService, IIsThereAnyDealService, IPopularGamesService
```

### Bindings que se añaden
```typescript
container.bind<IGameShelfApiClient>(TYPES.GameShelfApiClient)
  .to(GameShelfApiClientImpl)
  .inSingletonScope();

container.bind<IGameRepository>(TYPES.GameRepository)
  .toDynamicValue(ctx => new GameShelfApiGameRepository(
    ctx.container.get(TYPES.GameShelfApiClient)
  )).inSingletonScope();

container.bind<IWishlistRepository>(TYPES.WishlistRepository)
  .toDynamicValue(ctx => new GameShelfApiWishlistRepository(
    ctx.container.get(TYPES.GameShelfApiClient)
  )).inSingletonScope();

container.bind<IPlatformRepository>(TYPES.PlatformRepository)
  .toDynamicValue(ctx => new GameShelfApiPlatformRepository(
    ctx.container.get(TYPES.GameShelfApiClient)
  )).inSingletonScope();
```

### Condición del modo producción

Antes: `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_STEAM_API_KEY`  
Después: `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_GAMESHELF_API_URL`

El modo mock (sin URL) sigue igual — útil para desarrollo de UI sin backend.

---

## FASE 5 — Guest mode

`GuestAwareGameRepository` y `GuestAwarePlatformRepository` siguen funcionando.  
Solo hay que asegurarse de que envuelvan el nuevo `GameShelfApiGameRepository` en lugar de `GameRepositoryImpl`.

- **Modo guest:** datos locales en AsyncStorage (sin API, sin cambios)
- **Modo autenticado:** todo va a la API

---

## FASE 6 — Limpieza

### Archivos a eliminar
```
src/data/services/SteamApiServiceImpl.ts
src/data/services/EpicGamesApiServiceImpl.ts
src/data/services/GogApiServiceImpl.ts
src/data/services/PsnApiServiceImpl.ts
src/data/services/HowLongToBeatServiceImpl.ts
src/data/services/ProtonDbServiceImpl.ts
src/data/services/IsThereAnyDealServiceImpl.ts

src/domain/interfaces/services/ISteamApiService.ts
src/domain/interfaces/services/IEpicGamesApiService.ts
src/domain/interfaces/services/IGogApiService.ts
src/domain/interfaces/services/IPsnApiService.ts
src/domain/interfaces/services/IHowLongToBeatService.ts
src/domain/interfaces/services/IProtonDbService.ts
src/domain/interfaces/services/IIsThereAnyDealService.ts
src/domain/interfaces/services/IPopularGamesService.ts

src/data/repositories/GameRepositoryImpl.ts
src/data/repositories/WishlistRepositoryImpl.ts
src/data/repositories/PlatformRepositoryImpl.ts
```

### Variables de entorno a eliminar del `.env`
```
EXPO_PUBLIC_STEAM_API_KEY
EXPO_PUBLIC_EPIC_CLIENT_ID / EPIC_CLIENT_SECRET
EXPO_PUBLIC_GOG_CLIENT_ID / GOG_CLIENT_SECRET
EXPO_PUBLIC_ITAD_API_KEY
```

### Variable a añadir
```
EXPO_PUBLIC_GAMESHELF_API_URL=http://localhost:8000
```

---

## FASE 7 — Alineación de DTOs

Confirmar que los campos de respuesta de la API coincidan con las entidades de dominio.

Campos que se añaden a `Game` / `GameDetail` (opcionales):
- `protonRating?: string`
- `hltbMain?: number`
- `hltbCompletionist?: number`
- `currentPrice?: Price`
- `historicalLow?: Price`

Probablemente ya existan como opcionales — solo hay que verificar nombres.

---

## Orden de implementación

```
Fase 1 (IGameShelfApiClient + impl)
  → Fase 2 (repos nuevos)
    → Fase 3 (use cases simplificados)
      → Fase 4 (DI — el "switch")
        → Fase 5 (guest mode wiring)
          → Fase 6 (limpieza)
            → Fase 7 (DTOs)
```

Las fases 1 y 2 no rompen nada — solo añaden código nuevo.  
La fase 4 es el interruptor que activa todo.

---

## Lo que NO cambia

- Firebase Authentication (login, logout, tokens)
- ViewModels — ninguno necesita cambios de firma
- Pantallas / UI — ninguna necesita cambios
- Guest mode flow (LocalGameRepository / AsyncStorage)
- Mocks de desarrollo (`src/data/mocks/`)
- Estructura de dominio (entidades, enums)
- WebView en `PlatformLinkViewModel` — solo cambia la URL de origen
