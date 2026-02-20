# Data — Capa de datos (infraestructura)

## Propósito

Implementa las interfaces definidas en `domain/`. Aquí viven Firebase, Axios y las llamadas a APIs externas. Si se cambiase Firebase por otra solución, **solo se reescribiría esta capa**.

Regla: esta capa conoce `domain/` (implementa sus interfaces) pero `domain/` no conoce `data/`.

---

## Estructura

```
data/
├── mocks/         # Implementaciones mock con datos semilla
├── repositories/  # Implementaciones de IXRepository (Firebase/Firestore)
├── services/      # Implementaciones de IXService (APIs externas, Axios)
├── mappers/       # Transformaciones Firestore ↔ entidades de dominio
└── config/        # Inicialización de Firebase y constantes de APIs
```

---

## Repositorios (`repositories/`)

Acceden a **Firestore** como fuente de verdad persistente. Implementan las interfaces de `domain/interfaces/repositories/`.

| Clase | Interfaz | Colección Firestore |
|---|---|---|
| `AuthRepositoryImpl` | `IAuthRepository` | `users/{uid}` + Firebase Auth |
| `GameRepositoryImpl` | `IGameRepository` | `users/{userId}/library/{gameId}` |
| `WishlistRepositoryImpl` | `IWishlistRepository` | `users/{userId}/wishlist/{itemId}` |
| `PlatformRepositoryImpl` | `IPlatformRepository` | `users/{userId}/platforms/{platform}` |
| `NotificationRepositoryImpl` | `INotificationRepository` | `users/{userId}/settings/notifications` |

### Estructura Firestore

```
users/{userId}/
├── (campos: email, displayName)
├── library/{gameId}        → title, description, coverUrl, platform, steamAppId, itadGameId
├── wishlist/{itemId}       → gameId, title, coverUrl, addedAt, bestDealPercentage
├── platforms/
│   ├── steam               → externalUserId (SteamID 64-bit), linkedAt
│   └── epic_games          → externalUserId ("imported"), linkedAt
└── settings/
    └── notifications       → dealsEnabled
```

### Notas de implementación

- `AuthRepositoryImpl.deleteAccount()`: borra subcolecciones + doc Firestore + cuenta Firebase Auth.
- `GameRepositoryImpl.syncLibrary(userId, platform)`: llama a la API correspondiente, mapea los juegos y hace batch write a Firestore.
- `PlatformRepositoryImpl`: Steam almacena el SteamID (público, no secreto). Epic solo almacena un flag `"imported"`.

---

## Servicios (`services/`)

Implementan las interfaces de `domain/interfaces/services/`. Cada servicio encapsula una API externa.

### `SteamApiServiceImpl`

- **Auth**: OpenID 2.0 (NO es OAuth2). No hay token que almacenar, solo el SteamID.
- **Biblioteca**: `GET IPlayerService/GetOwnedGames/v1/?key={API_KEY}&steamid={id}&include_appinfo=1`
- **Recientes**: `GET IPlayerService/GetRecentlyPlayedGames/v1/?key={API_KEY}&steamid={id}` → juegos jugados últimas 2 semanas
- **Portadas**: `https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg`
- **Perfil público**: `GET ISteamUser/GetPlayerSummaries/v2/` → `communityvisibilitystate === 3`. Si el perfil es privado, `GetOwnedGames` devuelve vacío — la app debe avisar al usuario.
- **Mapper interno** (`mapSteamGameToDomain`): método privado dentro de la clase. Incluye `playtime_forever` y `rtime_last_played`.

### `EpicGamesApiServiceImpl`

- **No hay API de biblioteca pública**. Flujo: el usuario exporta sus datos (GDPR en epicgames.com/account/privacy), sube el ZIP/JSON a la app, y `parseExportedLibrary()` extrae los juegos.
- **Enriquecimiento de juegos**: 
  - Cada juego parseado se busca en ITAD por título para obtener `itadGameId` (para ofertas futuras)
  - Se intenta obtener la portada desde ITAD también
  - Si las búsquedas fallan, el juego se crea igual pero sin estos datos (robusto ante fallos de API)
  - Usa `Promise.allSettled` para que el fallo de una API no rompa las demás
- **Búsqueda de catálogo**: GraphQL no oficial en `graphql.epicgames.com/graphql`. Solo para búsqueda, no para biblioteca.
- **Inyecciones**: Depende de `IIsThereAnyDealService` para enriquecimiento

### `ProtonDbServiceImpl`

- **Endpoint**: `GET https://www.protondb.com/api/v1/reports/summaries/{steamAppId}.json`
- **Respuesta**: `{ tier, trendingTier, total, bestReportedTier, confidence, score }`
- **Obligatorio**: añadir headers `User-Agent: Mozilla/5.0` y `Referer: https://www.protondb.com` — sin ellos React Native puede ser bloqueado.
- Devuelve `null` si falla (endpoint no oficial, puede desaparecer).
- Solo funciona con juegos de Steam (no con juegos de Epic).

### `HowLongToBeatServiceImpl`

- **Flujo con token** (la URL `/api/search` ya no existe — da 404):
  1. `GET /api/finder/init?t={timestamp}` → `{ token: string }` — token de sesión.
  2. `POST /api/finder` con header `x-auth-token: {token}` → `{ data: HltbGameEntry[] }`.
  - Si el token expira (403), se renueva automáticamente y se reintenta.
- **Body del POST**: `{ searchType: "games", searchTerms: title.split(' '), searchPage: 1, size: 5, searchOptions: {...}, useCache: true }`
- **Respuesta**: `response.data.data[0]` → campos `comp_main`, `comp_plus`, `comp_100` en **segundos** → dividir entre 3600 para obtener horas.
- **No usar** la librería npm `howlongtobeat` — depende de módulos Node.js (`events`, `stream`, `buffer`) incompatibles con el runtime de React Native (Hermes/JSC).

### `IsThereAnyDealServiceImpl`

- **Base URL**: `https://api.isthereanydeal.com` (API v2 oficial)
- **API Key**: se obtiene en `isthereanydeal.com/apps/my/`. Pasar en query param o header.
- **Flujo para obtener ofertas**:
  1. `POST /games/lookup/v1` con `[title]` → UUID del juego en ITAD
  2. (Alternativa más fiable si hay steamAppId): `POST /games/lookup/id/shop/v1` con `{ shop: "steam", ids: ["app/{appId}"] }`
  3. `POST /games/prices/v2` con `[uuid]` → lista de precios por tienda
- **Mapper interno** (`mapItadPriceToDeal`): método privado dentro de la clase.
- **También se usa para búsqueda general**: `GET /games/search/v1?title={query}` (catálogo más amplio: Steam, Epic, GOG, Humble, etc.)

---

## Mappers (`mappers/`)

Solo los mappers de **Firestore** son archivos separados, porque son **bidireccionales** (toDomain + toFirestore) y se reutilizan en varios repositorios.

Los mappers de APIs externas (Steam, Epic, ITAD) son métodos privados dentro de su `ServiceImpl` correspondiente.

| Mapper | Conversión |
|---|---|
| `FirestoreGameMapper` | `toDomain(doc): Game` / `toFirestore(game): Record<string, any>` |
| `FirestoreWishlistMapper` | `toDomain(doc): WishlistItem` / `toFirestore(item): Record<string, any>` |

---

## Configuración (`config/`)

| Archivo | Contenido |
|---|---|
| `FirebaseConfig.ts` | `initializeFirebase()`, `getFirestoreInstance()`, `getAuthInstance()`. Se llama desde `App.tsx`. |
| `ApiConstants.ts` | URLs base y API keys (los valores sensibles vienen de `.env`). Incluye: `STEAM_API_BASE_URL`, `STEAM_CDN_BASE`, `EPIC_GRAPHQL_URL`, `PROTONDB_API_URL`, `ITAD_API_BASE_URL`, `HLTB_INIT_URL`, `HLTB_SEARCH_URL`. |

> Las API keys nunca se hardcodean. Se leen desde `.env` (ver `.env.example` en la raíz).
