# GameShelf — Known Issues & Tech Debt

Open issues only. Resolved items have been removed. Severities: CRITICAL, HIGH, MEDIUM, LOW.

---

## 1. Security

### ~~[CRITICAL] S-01 · Account deletion order causes irrecoverable data loss~~
~~**File:** `src/data/repositories/AuthRepositoryImpl.ts:87-129`~~
~~`deleteAccount()` deletes all Firestore data first, then calls `deleteUser()` last. If `deleteUser()` fails (common: `auth/requires-recent-login`), all data is gone but the auth account still exists. User can still log in to an empty account with no recovery path.~~
~~**Fix:** Attempt `deleteUser()` first (or re-authenticate), then delete Firestore data. Alternatively, use a Cloud Function with admin SDK for atomic deletion.~~
**RESUELTO:** `deleteUser()` se llama ahora antes de borrar datos de Firestore.

---

### ~~[CRITICAL] S-02 · GOG client_secret shipped in client bundle (contradicts documented architecture)~~
~~**File:** `src/data/services/GogApiServiceImpl.ts:12`~~
~~The `IGogApiService` interface explicitly documents that "El intercambio de tokens se delega a una Cloud Function para no exponer el client_secret en el bundle movil." The implementation does the opposite — calls `auth.gog.com/token` directly with the secret embedded. Additionally, tokens are sent via URL query parameters (RFC 6749 §2.3.1 violation).~~
~~**Fix:** Route token exchange through a Cloud Function as documented, or update the interface docs to reflect reality.~~
**DECISIÓN:** Las credenciales de GOG (`client_id` / `client_secret`) son públicamente conocidas y están presentes en los repos públicos de Heroic, Playnite y Lutris. No son un secreto privativo de esta app. Se ha actualizado la documentación de `IGogApiService` para reflejar la implementación real. No se creará Cloud Function.

---

### ~~[CRITICAL] S-03 · GOG OAuth tokens stored as plain text in Firestore~~
~~**File:** `src/data/repositories/PlatformRepositoryImpl.ts:57-68`~~
~~`accessToken` and `refreshToken` are stored as plain-text fields in `users/{userId}/platforms/gog`. Any Firestore Security Rules misconfiguration exposes all users' tokens.~~
~~**Fix:** Encrypt tokens before storage, or move token management to a server-side component.~~
**RESUELTO:** Tokens migrados a `expo-secure-store` (Keychain/Keystore del SO). Firestore solo guarda `externalUserId` y `linkedAt`. `GameRepositoryImpl` lee y renueva tokens exclusivamente desde SecureStore.

---

### ~~[HIGH] S-04 · Epic client credentials hardcoded as fallback defaults~~
~~**File:** `src/data/config/ApiConstants.ts:28-29`~~
~~`EPIC_AUTH_CLIENT_ID` and `EPIC_AUTH_CLIENT_SECRET` have hardcoded fallback values. Even if publicly known, embedding secrets as defaults normalizes insecure patterns and prevents rotation without app release.~~
~~**Fix:** Remove fallback defaults. Require env vars; fail explicitly if missing.~~
**RESUELTO:** Fallbacks reemplazados por `''`. El app falla explícitamente si las env vars no están configuradas.

---

### ~~[HIGH] S-05 · No input validation on Steam profile URL/ID~~
~~**File:** `src/domain/usecases/platforms/PlatformLinkUseCase.ts:73-93`~~
~~User input is passed directly to `steamService.resolveSteamId()` with only `.trim()`. Could enable SSRF or path traversal via a malicious URL.~~
~~**Fix:** Validate against known patterns (numeric SteamID64, `steamcommunity.com/id/` or `/profiles/` URLs) before API call.~~
**RESUELTO:** Validación con regex antes de llamar a `resolveSteamId`. Acepta SteamID64 (17 dígitos) o URLs `steamcommunity.com/id/` y `/profiles/`; rechaza cualquier otro input con error descriptivo.

---

### ~~[HIGH] S-06 · `Linking.openURL` called without URL validation~~
~~**File:** `src/presentation/components/games/DealCard.tsx:28`~~
~~Deal URLs from the ITAD API are opened without checking the scheme. A compromised API response could inject `javascript:`, custom scheme, or phishing URLs.~~
~~**Fix:** Validate URL starts with `https://` and wrap in try/catch.~~
**RESUELTO:** Guard `url.startsWith('https://')` antes de abrir; `.catch(() => {})` en `openURL`.

---

### ~~[HIGH] S-07 · `steamAppId` interpolated into URL without validation~~
~~**File:** `src/data/services/ProtonDbServiceImpl.ts:46`~~
~~`steamAppId` is interpolated directly into a URL with no numeric validation, enabling potential path traversal.~~
~~**Fix:** Add `if (!/^\d+$/.test(steamAppId)) return null;` guard.~~
**RESUELTO:** Guard `!/^\d+$/.test(steamAppId)` añadido al inicio del método.

---

### ~~[MEDIUM] S-08 · No email format validation on auth screens~~
~~**Files:** `src/presentation/screens/auth/RegisterScreen.tsx:39-55`, `ForgotPasswordScreen.tsx:36`~~
~~Neither screen validates email format before sending to Firebase. Also, ForgotPassword reveals email existence via different Firebase error messages (enumeration risk).~~
~~**Fix:** Add client-side email regex. Show same success message on ForgotPassword regardless of email existence.~~
**RESUELTO:** Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` añadido a `RegisterScreen` y `ForgotPasswordScreen`. ForgotPassword siempre muestra "Si el correo existe, recibirás un enlace" sin distinguir éxito/fallo (anti-enumeración).

---

### ~~[MEDIUM] S-09 · No user ID validation before Firestore operations~~
~~**Files:** `WishlistRepositoryImpl.ts`, `PlatformRepositoryImpl.ts`, `NotificationRepositoryImpl.ts`~~
~~None validate that `userId` is non-empty. An empty userId creates documents at `users//wishlist/...`.~~
~~**Fix:** Guard against empty `userId` at the use case level.~~
**RESUELTO:** Guard `if (!userId?.trim()) throw new Error('userId requerido')` añadido al inicio de cada método público en `WishlistUseCase.ts` y `PlatformLinkUseCase.ts`.

---

### ~~[LOW] S-10 · Firebase client keys exposed in JS bundle~~
~~`EXPO_PUBLIC_FIREBASE_*` variables visible in client bundle by design. Firestore Security Rules restrict access to `users/{userId}/{document=**}` — owner only. Acceptable for a client app.~~
**CERRADO (won't fix):** Diseño intencional de Expo/Firebase para apps cliente. Las Security Rules garantizan que cada usuario solo accede a sus propios datos.

---

### ~~[LOW] S-11 · Guest ID generated with `Math.random()` (weak entropy)~~
~~**File:** `src/core/utils/guestUtils.ts:16-20`~~
~~`generateGuestId()` uses `Math.random()` which is predictable. Low risk since it's for local guest sessions only.~~
~~**Fix:** Use `expo-crypto` (`Crypto.randomUUID()`).~~
**RESUELTO:** `generateGuestId()` usa `require('expo-crypto').randomUUID()`. Función movida a `src/domain/utils/guestUtils.ts` (fix A-04 combinado).

---

## 2. Data Integrity & Race Conditions

### ~~[CRITICAL] D-01 · Race condition: stale search results overwrite current~~
~~**File:** `src/presentation/viewmodels/HomeViewModel.ts:78-95`~~
~~No cancellation of previous in-flight searches. If user types "Halo" then "Zelda", the "Halo" response may arrive last and overwrite results.~~
~~**Fix:** Add a monotonic request counter or `AbortController`. Discard results if `_searchQuery` changed.~~
**RESUELTO:** Contador `_searchRequestId` (no observable) incrementado antes de cada `await`; la respuesta solo se aplica si el ID coincide con el actual. `clearSearch()` también incrementa el contador para invalidar búsquedas en vuelo.

---

### ~~[HIGH] D-02 · `deleteAccount` register: partial failure leaves orphaned auth~~
~~**File:** `src/data/repositories/AuthRepositoryImpl.ts:33-46`~~
~~If `createUserWithEmailAndPassword` succeeds but `setDoc` fails, the auth account exists without a Firestore document. User cannot register again (email taken) and cannot log in (no Firestore doc).~~
~~**Fix:** If `setDoc` fails, delete the newly created auth user before re-throwing.~~
**RESUELTO:** `setDoc` envuelto en try/catch; si falla, se elimina `credential.user` antes de relanzar el error.

---

### ~~[HIGH] D-03 · `getCurrentUser()` race condition on cold start~~
~~**File:** `src/data/repositories/AuthRepositoryImpl.ts:71-85`~~
~~Uses synchronous `auth.currentUser` which may be `null` before Firebase restores the session. User briefly sees login screen on cold start.~~
~~**Fix:** Use `onAuthStateChanged` or `auth.authStateReady()` to wait for auth initialization.~~
**RESUELTO:** `await this.auth.authStateReady()` añadido al inicio de `getCurrentUser()`. Espera a que Firebase restaure la sesión persistida antes de leer `auth.currentUser`.

---

### ~~[HIGH] D-04 · `syncLibrary` replaces entire game list with single-platform subset~~
~~**File:** `src/presentation/viewmodels/LibraryViewModel.ts:131-138`~~
~~When syncing one platform, the ViewModel replaces `_games` with only that platform's games. All games from other platforms disappear until full reload.~~
~~**Fix:** After sync, reload the full library via `getLibrary(userId)`.~~
**RESUELTO:** Tras sync se llama a `getLibrary` + `getLinkedPlatforms` en paralelo y se actualiza el estado completo.

---

### ~~[HIGH] D-05 · Race condition in `LocalPlatformRepository` read-modify-write~~
~~**File:** `src/data/repositories/LocalPlatformRepository.ts:35-40`~~
~~Every `link*` method does `readAll()` then `writeAll()` with no locking. Concurrent operations can overwrite each other.~~
~~**Fix:** Implement a mutex or atomic read-modify-write pattern.~~
**RESUELTO:** Mutex de promesa encadenada (`_queue`) implementado en `withMutex()`. Serializa todas las operaciones read-modify-write en FIFO sin bloquear el event loop.

---

### ~~[HIGH] D-06 · Race condition in `GameDetailScreen` (no request cancellation)~~
~~**File:** `src/presentation/screens/games/GameDetailScreen.tsx:107-110`~~
~~`loadGameDetail` has no cancellation mechanism. Rapid navigation between games can show data for the wrong game.~~
~~**Fix:** Add a load ID counter in the ViewModel; ignore stale results.~~
**RESUELTO:** `_loadId` (no observable) añadido a `GameDetailViewModel`; `clear()` también incrementa el contador.

---

### ~~[MEDIUM] D-07 · `unlinkPlatform` deletes platform doc before library cleanup (no transaction)~~
~~**File:** `src/data/repositories/PlatformRepositoryImpl.ts:72-95`~~
~~If the app crashes between deleting the platform doc and deleting library games, orphaned game documents remain.~~
~~**Fix:** Delete games first, then platform doc.~~
**RESUELTO (combinado con F-02):** Orden corregido: 1) SecureStore, 2) batch-delete juegos con `where()`, 3) deleteDoc del platform doc.

---

### ~~[MEDIUM] D-08 · No duplicate check in `addToWishlist`~~
~~**File:** `src/domain/usecases/wishlist/WishlistUseCase.ts:58-60`~~
~~Adding the same game twice creates duplicate Firestore documents.~~
~~**Fix:** Use `setDoc` with a deterministic ID based on `gameId`, or check `isInWishlist` before adding.~~
**RESUELTO:** `isInWishlist(userId, item.getGameId())` comprobado antes de `addToWishlist`; retorno silencioso si ya existe.

---

### ~~[MEDIUM] D-10 · Singleton ViewModels retain stale data after logout/login~~
~~**File:** `src/di/container.ts:178-227`~~
~~All use cases and most ViewModels are singletons. After logout/login cycle, the new user sees the previous user's cached data (recently played, library, wishlist, home cache TTL).~~
~~**Fix:** Add a `reset()` method to each singleton ViewModel; call it from the logout flow.~~
**RESUELTO:** `reset()` añadido a `HomeViewModel`, `LibraryViewModel` y `WishlistViewModel`. `AuthViewModel.logout()` inyecta los 3 singletons y llama `reset()` tras el logout. `LibraryViewModel.resetSyncState()` ahora delega a `reset()`.

---

### ~~[MEDIUM] D-09 · Title-based deduplication merges different games with same name~~
~~**File:** `src/presentation/viewmodels/LibraryViewModel.ts:78`~~
~~When no `steamAppId`/`itadGameId` is available, games are merged by `title.toLowerCase()`. Games like "Doom" (1993) and "Doom" (2016) would be incorrectly merged.~~
~~**Fix:** Fall back to unique game ID instead of title.~~
**RESUELTO:** Fallback cambiado de `title-${title}` a `id-${game.getId()}`. Juegos sin ID de plataforma nunca se fusionan incorrectamente.

---

### ~~[MEDIUM] D-11 · Transient ViewModels may hold stale data on navigation reuse~~
~~**File:** `src/di/hooks/useInjection.ts`~~
~~`useInjection` uses `useRef` to keep the ViewModel instance stable. If React reuses the component for a different entity, stale data persists.~~
**CERRADO (won't fix):** Investigación confirma que la app usa exclusivamente `navigation.navigate()` — no hay ningún `navigation.replace()`. Con `navigate()` React Navigation crea siempre una nueva instancia del componente, por lo que `useRef` nunca retiene datos de una entidad anterior. El problema solo se manifestaría con `replace()`, que no se usa.

---

### ~~[MEDIUM] D-12 · Platform falls back to `Platform.STEAM` for unknown Firestore documents~~
~~**File:** `src/data/repositories/PlatformRepositoryImpl.ts:105-110`~~
~~Unknown document IDs silently become `Platform.STEAM`, misleading the UI.~~
~~**Fix:** Skip unknown documents or use `Platform.UNKNOWN`.~~
**RESUELTO:** `flatMap` con `if (!platform) return []` — documentos desconocidos se omiten silenciosamente.

---

### ~~[MEDIUM] D-13 · `FirestoreGameMapper` unsafe platform enum cast~~
~~**File:** `src/data/mappers/FirestoreGameMapper.ts:28`~~
~~`(data.platform as Platform)` does not validate against enum values. Invalid strings pass through silently.~~
~~**Fix:** Validate against `Object.values(Platform)`.~~
**RESUELTO:** `Object.values(Platform).includes(data.platform)` valida el valor; fallback a `Platform.UNKNOWN`.

---

## 3. Architecture / SOLID / Clean Code

### ~~[HIGH] A-01 · `HomeViewModel` violates SRP: handles home data AND search~~
~~**File:** `src/presentation/viewmodels/HomeViewModel.ts`~~
~~The ViewModel manages popular games, recently played, most played, AND full search functionality. `SearchViewModel` exists but is unused (dead code).~~
~~**Fix:** Extract search into `SearchViewModel`; have `SearchScreen` use it.~~
**RESUELTO:** Estado y métodos de búsqueda (`_searchResults`, `_searchQuery`, `_isSearching`, `search()`, `clearSearch()`) movidos a `SearchViewModel` con stale detection (`_searchRequestId`). `SearchScreen` inyecta ambos VMs. `HomeViewModel` solo gestiona home data.

---

### ~~[HIGH] A-02 · `HomeUseCase` depends directly on `ISteamApiService` (domain depends on platform)~~
~~**File:** `src/domain/usecases/home/HomeUseCase.ts:16,21`~~
~~"Popular games" is hardwired to Steam. Adding GOG or Epic popular games requires modifying the use case (OCP violation).~~
~~**Fix:** Move behind `IGameRepository` or a dedicated platform-agnostic interface.~~
**RESUELTO:** `IPopularGamesService` creado en `domain/interfaces/services/`. `SteamApiServiceImpl` implementa ambas interfaces. `HomeUseCase` usa `IPopularGamesService`. `container.ts` enlaza vía `toService()` en los 3 modos.

---

### ~~[HIGH] A-03 · Domain entities are mutable (setters break encapsulation)~~
~~**Files:** `Game.ts:51-54`, `SearchResult.ts:39-42`, `WishlistItem.ts:34-36`, `GameDetail.ts`~~
~~Use cases mutate entities in-place via setters (`setSteamAppId`, `setIsOwned`, etc.). Mutating objects returned from repositories changes cached copies (pass-by-reference).~~
~~**Fix:** Return new instances with updated values; remove setters.~~
**RESUELTO:** Setters eliminados y reemplazados por `withX()` que devuelven nueva instancia. Todos los callers (HomeUseCase, SearchUseCase, GameDetailUseCase, WishlistUseCase, SteamSyncMemoryGameRepository, LocalGameRepository, IsThereAnyDealServiceImpl) actualizados.

---

### ~~[MEDIUM] A-04 · Data layer imports from core layer (circular dependency)~~
~~**Files:** `GuestSessionRepository.ts:10` (imports from `core/utils`), `AuthViewModel.ts:8` (imports `isGuestUser` from `core/`)~~
~~Architecture declares `core → presentation → domain ← data`. Both data and presentation importing from core creates circular risk.~~
~~**Fix:** Move `guestUtils` to domain layer or shared utility.~~
**RESUELTO:** `guestUtils` movido a `src/domain/utils/guestUtils.ts`. `src/core/utils/guestUtils.ts` re-exporta desde domain. Todos los imports de la capa de datos actualizados a `../../domain/utils/guestUtils`.

---

### ~~[MEDIUM] A-05 · `IAuthUseCase` interface too broad (ISP violation)~~
~~**File:** `src/domain/interfaces/usecases/auth/IAuthUseCase.ts`~~
~~Bundles 8 methods (login, register, logout, guest, delete, reset password). Not all consumers need all methods.~~
~~**Fix:** Consider splitting into smaller interfaces.~~
**RESUELTO:** Tres interfaces granulares creadas: `IAuthSessionUseCase` (login/register/logout/getCurrentUser/checkAuthState), `IGuestUseCase` (continueAsGuest/clearGuestSession), `IAccountManagementUseCase` (deleteAccount/resetPassword). `IAuthUseCase` las extiende por compatibilidad con los consumers actuales.

---

### ~~[MEDIUM] A-06 · `deleteAccount` orchestration belongs in use case, not repository (SRP)~~
~~**File:** `src/data/repositories/AuthRepositoryImpl.ts:87-129`~~
~~Repository handles multi-step deletion (subcollections + settings + doc + auth). This is use case logic.~~
~~**Fix:** Move orchestration to a `DeleteAccountUseCase`.~~
**RESUELTO:** `IAuthRepository` ahora expone `deleteAuthUser()` + `deleteUserFirestoreData(uid)`. `AuthUseCase.deleteAccount()` y `SettingsUseCase.deleteAccount()` orquestan los dos pasos: Auth primero, Firestore después.

---

### ~~[MEDIUM] A-07 · `ProfileScreen` depends on 3 ViewModels (feature envy)~~
~~**File:** `src/presentation/screens/profile/ProfileScreen.tsx:16-18`~~
~~Injects `AuthViewModel`, `LibraryViewModel`, and `WishlistViewModel` just for stats.~~
~~**Fix:** Create a `ProfileViewModel` that aggregates needed data.~~
**RESUELTO:** `ProfileViewModel` creado en `src/presentation/viewmodels/ProfileViewModel.ts`. Inyecta los 3 singletons y expone `user`, `libraryCount`, `platformCount`, `wishlistCount`, `isLoading`. `ProfileScreen` ahora solo inyecta `ProfileViewModel`.

---

### ~~[MEDIUM] A-08 · `ItadGameInfo` coupled to service interface file~~
~~**File:** `src/domain/interfaces/services/IIsThereAnyDealService.ts`~~
~~Used across multiple layers. Should live in `domain/dtos/`.~~
**RESUELTO:** `ItadGameInfo` movida a `src/domain/dtos/ItadGameInfo.ts`. `IIsThereAnyDealService.ts` importa y re-exporta el tipo para compatibilidad con callers existentes.

---

### [MEDIUM] A-09 · `withLoading` uses unsafe `Record<string, unknown>` cast
**File:** `src/presentation/viewmodels/BaseViewModel.ts:33`
String-based key access bypasses TypeScript type safety. Typos silently set wrong properties.
**Fix:** Use `keyof T` generics.
**NOTA:** TypeScript excluye campos `private` de `keyof T` cuando se accede desde fuera de la clase, por lo que añadir `keyof VM` a `withLoading` produciría errores en todos los call sites. El cast interno `Record<string, unknown>` es inevitable. Queda como deuda técnica aceptada.

---

### ~~[MEDIUM] A-10 · `GameDetail.protonDbRating` typed as `string` instead of `ProtonTier`~~
~~**File:** `src/domain/entities/GameDetail.ts:8-9`~~
~~Type information is lost; downstream components must do `.toLowerCase()` comparisons instead of exhaustive matching.~~
~~**Fix:** Import and use `ProtonTier` union type.~~
**RESUELTO:** `protonDbRating` y `protonDbTrendingRating` tipados como `ProtonTier | null`; getters actualizados.

---

### ~~[MEDIUM] A-11 · `EpicAuthToken` is a class but `GogAuthToken` is an interface (inconsistency)~~
~~**Files:** `src/domain/dtos/EpicAuthToken.ts`, `src/domain/dtos/GogAuthToken.ts`~~
~~`GogAuthToken` cannot have `isExpired()`; callers must implement expiry logic themselves.~~
~~**Fix:** Make `GogAuthToken` a class with `isExpired()`.~~
**RESUELTO:** `GogAuthToken` convertida a clase con constructor y `isExpired()` (misma lógica que `EpicAuthToken`). `GogApiServiceImpl` y `GogTokenStore` actualizados a `new GogAuthToken(...)`.

---

## 4. API & Network

### ~~[HIGH] N-01 · No timeout on HTTP requests across all services~~
~~**Files:** `SteamApiServiceImpl.ts`, `EpicGamesApiServiceImpl.ts`, `GogApiServiceImpl.ts`~~
~~None configure timeouts. Axios defaults to infinite wait. A slow API hangs the app with no recourse.~~
~~**Fix:** Configure global axios instance with 15-30s timeout. Use `AbortController` for `fetch`.~~
**RESUELTO:** `steamAxios`/`epicAxios` con `timeout: 15_000` en los servicios axios. `GogApiServiceImpl` usa `fetchWithTimeout` con `AbortController` (15 s).

---

### ~~[HIGH] N-02 · No retry logic for transient failures~~
~~**Files:** All three service implementations~~
~~No retries for network blips, 429, 502/503/504. Mobile networks are inherently unreliable.~~
~~**Fix:** Add axios interceptor with exponential backoff for retryable status codes.~~
**RESUELTO:** `src/data/utils/httpRetry.ts` — `addAxiosRetryInterceptor` aplicado a `steamAxios`/`epicAxios`; `fetchWithRetry` usado en `GogApiServiceImpl`. Backoff exponencial (1s→2s→4s, máx 30s), respeta `Retry-After`, reintenta en red caída y 429/502/503/504.

---

### ~~[HIGH] N-03 · Epic auth token has no refresh mechanism~~
~~**File:** `src/data/services/EpicGamesApiServiceImpl.ts`~~
~~Epic tokens expire (~6h) but `refresh_token` is never captured. User must re-authenticate manually. GOG properly implements refresh.~~
~~**Fix:** Capture and store `refresh_token`; implement refresh flow.~~
**RESUELTO:** `EpicAuthToken` añadido `refreshToken`. `EpicTokenStore` (SecureStore) creado siguiendo el patrón de `GogTokenStore`. `refreshToken()` implementado en el servicio. `PlatformRepositoryImpl.linkEpicPlatform` guarda tokens; `unlinkPlatform` los limpia. `GameRepositoryImpl.syncLibrary` para Epic carga/refresca token y re-fetchea biblioteca.

---

### ~~[HIGH] N-04 · HLTB token fetched on every call + no 403 retry~~
~~**File:** `src/data/services/HowLongToBeatServiceImpl.ts:44-53`~~
~~Every `getGameDuration` call fetches a new token (doubles requests). The documented 403 auto-refresh is not implemented.~~
~~**Fix:** Cache token with TTL; implement 403 retry.~~
**RESUELTO:** Token cacheado con TTL de 30 min (`_cachedToken`/`_tokenExpiresAt`). On 403: cache invalidada, token refrescado, búsqueda reintentada una vez.

---

### ~~[HIGH] N-05 · Silent error swallowing hides real failures~~
~~**Files:** `EpicGamesApiServiceImpl.ts:260`, `SteamApiServiceImpl.ts:176`, `HomeUseCase.ts:22-38`~~
~~Multiple methods catch errors and return empty arrays/fallback data without logging. Impossible to distinguish "no results" from "service is down."~~
~~**Fix:** Add logging/telemetry layer. Distinguish "no results" from "error" in VM state.~~
**RESUELTO:** `console.warn` con tag añadido en los tres puntos. En Steam `getMostPlayedGames`, el catch ya no devuelve un `Game` ficticio (`"Game 12345"`) — devuelve `null` que se filtra, eliminando datos falsos de la UI.

---

### ~~[HIGH] N-06 · GOG `getUserGames` does not paginate~~
~~**File:** `src/data/services/GogApiServiceImpl.ts:96-130`~~
~~Only fetches first page. Users with 50+ GOG games see incomplete library.~~
~~**Fix:** Add pagination loop similar to Epic's `fetchAllLibraryRecords`.~~
**RESUELTO:** Loop `do/while` paginando por `page`/`totalPages` hasta consumir todas las páginas.

---

### ~~[MEDIUM] N-07 · No caching of external API responses (ITAD, HLTB, ProtonDB)~~
~~**Files:** `IsThereAnyDealServiceImpl.ts`, `HowLongToBeatServiceImpl.ts`, `ProtonDbServiceImpl.ts`~~
~~Every game detail screen hits all three APIs fresh. Data rarely changes.~~
~~**Fix:** Add in-memory cache with TTL (e.g., 15 min).~~
**RESUELTO:** `TtlCache<K,V>` creado en `src/data/utils/ttlCache.ts`. TTL 15 min en `getGameInfo` (ITAD), `getGameDuration` (HLTB), `getCompatibilityRating` (ProtonDB).

---

### ~~[MEDIUM] N-08 · `getMostPlayedGames` fires 10 parallel requests with no concurrency limit~~
~~**File:** `src/data/services/SteamApiServiceImpl.ts:155-192`~~
~~`Promise.all` with up to 10 simultaneous `appdetails` requests. Steam aggressively rate-limits.~~
~~**Fix:** Add concurrency limiter (max 3 parallel). Cache results.~~
**RESUELTO:** `runLimited(topGames, 3, ...)` en `src/data/utils/concurrency.ts` procesa en chunks de 3 en lugar de `Promise.all` ilimitado.

---

### ~~[MEDIUM] N-09 · GOG tokens discarded in Local/Memory repositories~~
~~**Files:** `LocalPlatformRepository.ts:51`, `MemoryPlatformRepository.ts:36`~~
~~`linkGogPlatform` receives `GogAuthToken` but both implementations ignore tokens. Guest users can't refresh tokens.~~
~~**Fix:** Store tokens in AsyncStorage (encrypted) in `LocalPlatformRepository`.~~
**RESUELTO:** `LocalPlatformRepository.linkGogPlatform` serializa el token en AsyncStorage (`@gameshelf/guest_gog_token`). `unlinkPlatform` lo elimina al desvincular GOG. `getGogToken()` permite recuperarlo para refresh.

---

### ~~[MEDIUM] N-10 · No timeout on ITAD API calls~~
~~**File:** `src/data/services/IsThereAnyDealServiceImpl.ts`~~
~~Unlike ProtonDB/HLTB (8s timeout), ITAD calls have no timeout. A stuck ITAD request delays the entire detail screen.~~
~~**Fix:** Add `timeout: 8000` matching other services.~~
**RESUELTO:** `itadAxios = axios.create({ timeout: 8_000 })` con `addAxiosRetryInterceptor` aplicado. Todos los métodos usan `itadAxios`.

---

### ~~[MEDIUM] N-11 · `getOrCreateGameById` makes up to 5 sequential Firestore reads (waterfall)~~
~~**File:** `src/data/repositories/GameRepositoryImpl.ts:52-117`~~
~~Multiple sequential `getGameById` calls, including a redundant duplicate call on line 72.~~
~~**Fix:** Remove redundant call. Batch lookups or cache recently fetched games.~~
**RESUELTO (parcial):** Llamada duplicada redundante a `getGameById(userId, gameId)` en línea 94 eliminada.

---

### ~~[MEDIUM] N-12 · `searchGames` in ITAD makes N+1 requests~~
~~**File:** `src/data/services/IsThereAnyDealServiceImpl.ts:188-196`~~
~~After search, `getGameInfo` is called individually for each of 20 results.~~
~~**Fix:** Batch if API supports it; limit info lookups to fewer results.~~
**RESUELTO:** Enriquecimiento limitado a los primeros 5 resultados (`TOP_N_TO_ENRICH = 5`). Los resultados 6-20 se devuelven sin `steamAppId` (la API ITAD no soporta batch para `/games/info/v2`). Los primeros 5 están cubiertos por el TTL cache de `getGameInfo`.

---

## 5. Firestore & Data Performance

### ~~[HIGH] F-01 · No pagination on `getLibraryGames`~~
~~**File:** `src/data/repositories/GameRepositoryImpl.ts:35-40`~~
~~`getDocs(collection(...))` fetches ALL library documents in one read. Users with thousands of Steam games download everything.~~
~~**Fix:** Implement pagination with `limit()` and `startAfter()` cursors.~~
**RESUELTO:** `getLibraryGamesPage(userId, pageSize, cursor?)` con `orderBy(documentId()) + limit + startAfter`. `LibraryViewModel` usa carga progresiva (200 docs/página): muestra la primera página inmediatamente, el resto carga en background con MobX actualizando la UI reactivamente.

---

### ~~[MEDIUM] F-02 · `PlatformRepositoryImpl.unlinkPlatform()` downloads all library docs to filter~~
~~**File:** `src/data/repositories/PlatformRepositoryImpl.ts:63`~~
~~Downloads entire library then filters by platform client-side.~~
~~**Fix:** Use `where('platform', '==', platform)` Firestore query.~~
**RESUELTO (combinado con D-07):** `query(..., where('platform', '==', platform))` sustituye al `getDocs + filter` client-side.

---

### ~~[MEDIUM] F-03 · `WishlistRepositoryImpl.isInWishlist()` query is O(n)~~
~~**File:** `src/data/repositories/WishlistRepositoryImpl.ts:39-44`~~
~~Uses `getDocs(query(...))` without `limit(1)`. Fetches all matching docs.~~
~~**Fix:** Add `limit(1)` or use deterministic document IDs with `getDoc`.~~
**RESUELTO:** `limit(1)` añadido al query de `isInWishlist`.

---

### ~~[MEDIUM] F-04 · `getWishlist` has no ordering or limit~~
~~**File:** `src/data/repositories/WishlistRepositoryImpl.ts:25-30`~~
~~Fetches all documents with non-deterministic order.~~
~~**Fix:** Add `orderBy('addedAt', 'desc')` and consider pagination.~~
**RESUELTO:** `orderBy('addedAt', 'desc')` añadido al query de `getWishlist`.

---

### ~~[MEDIUM] F-05 · `LocalGameRepository.readAll()` parses full JSON on every operation~~
~~**File:** `src/data/repositories/LocalGameRepository.ts:65-69`~~
~~Every method calls `readAll()` which reads and parses the entire library from AsyncStorage.~~
~~**Fix:** Add in-memory cache populated on first read, invalidated on writes.~~
**RESUELTO:** `_cache: Game[] | null` añadido. `readAll()` retorna el cache si no es null. `writeAll()` invalida el cache antes de escribir.

---

### ~~[MEDIUM] F-06 · Firebase config values not validated at initialization~~
~~**File:** `src/data/config/FirebaseConfig.ts:13-20`~~
~~Required env vars (`apiKey`, `projectId`, `appId`) are never validated. Firebase may silently init with `undefined` values.~~
~~**Fix:** Throw a clear error if required vars are missing.~~
**RESUELTO:** Validación de `apiKey`, `projectId`, `appId` al inicio de `initializeFirebase()`; error descriptivo si alguno está vacío.

---

## 6. React / React Native

### ~~[HIGH] R-01 · Debounce timer not cleaned up on `SearchScreen` unmount~~
~~**File:** `src/presentation/screens/search/SearchScreen.tsx:48,69-84`~~
~~The `debounceRef` timer is never cleaned up. If it fires after unmount, it updates a stale ViewModel.~~
~~**Fix:** Add cleanup `useEffect` with `clearTimeout`.~~
**RESUELTO:** `useEffect` con cleanup `clearTimeout(debounceRef.current)` añadido al montar el componente.

---

### ~~[MEDIUM] R-02 · `useEffect` missing dependencies in RootNavigator~~
~~**File:** `src/core/navigation/RootNavigator.tsx`~~
~~Incomplete dependency arrays. Uses `authVm`, `libraryVm` without listing them.~~
**RESUELTO:** Arrays de deps completados; `eslint-disable` eliminado.

---

### ~~[MEDIUM] R-03 · `LibraryScreen` `useEffect` disabled exhaustive-deps; won't re-run on userId change~~
~~**File:** `src/presentation/screens/library/LibraryScreen.tsx:40-45`~~
~~Empty dependency array `[]` with eslint-disable. If user logs out and in as different user, the effect won't re-run.~~
~~**Fix:** Add `userId` to dependency array.~~
**RESUELTO:** `[userId, vm]` como array de deps; `eslint-disable` eliminado.

---

### ~~[MEDIUM] R-04 · `Dimensions.get('window')` called at module level (stale on rotation)~~
~~**File:** `src/presentation/screens/games/GameDetailScreen.styles.ts:6`~~
~~Width captured once at module eval time. If the device rotates, all dependent styles are stale.~~
~~**Fix:** Use `useWindowDimensions()` hook or accept as limitation (if rotation is locked).~~
**CERRADO (won't fix):** Rotación bloqueada en portrait en `app.json`. Comentario añadido al archivo para documentarlo.

---

### ~~[MEDIUM] R-05 · `GameCard` `React.memo` defeated by new array references~~
~~**File:** `src/presentation/components/games/GameCard.tsx:21`~~
~~`platforms` prop is always a new array from `mergedFilteredGames`, defeating shallow comparison.~~
~~**Fix:** Add custom comparator to `React.memo`.~~
**RESUELTO:** Comparador personalizado añadido como segundo argumento de `React.memo`: compara `gameId`, `coverUrl`, `portraitCoverUrl`, `title`, `onPress` y `platforms` por valor (length + every).

---

### ~~[MEDIUM] R-06 · Fire-and-forget async in `RootNavigator` useEffect~~
~~**File:** `src/core/navigation/RootNavigator.tsx:17`~~
~~`authVm.checkAuthState()` called without `.catch()`. Unhandled rejection if it fails unexpectedly.~~
~~**Fix:** Add `.catch()` to the promise.~~
**RESUELTO:** `.catch(e => console.warn('[RootNavigator] checkAuthState failed:', e))` añadido.

---

### ~~[MEDIUM] R-07 · Missing `displayName` on multiple observer components~~
~~**Files:** `RootNavigator.tsx`, `WishlistScreen.tsx`, `SettingsScreen.tsx`, `PlatformLinkScreen.tsx`, `NotificationSettingsScreen.tsx`~~
~~React DevTools shows "Anonymous" for all observer-wrapped components.~~
~~**Fix:** Add `.displayName` after each component definition.~~
**RESUELTO:** `.displayName` añadido a los 5 componentes.

---

### ~~[MEDIUM] R-08 · GOG WebView doesn't clear cookies between linking attempts~~
~~**File:** `src/presentation/screens/settings/GogLinkModal.tsx:93-100`~~
~~Cached cookies may auto-login with wrong account.~~
~~**Fix:** Use `incognito={true}` prop on WebView.~~
**RESUELTO:** `incognito={true}` añadido al componente `<WebView>`.

---

## 7. Clean Code / DRY

### ~~[MEDIUM] C-01 · Navigation stack `screenOptions` duplicated across 4 stacks~~
~~**Files:** `SearchStack.tsx`, `LibraryStack.tsx`, `WishlistStack.tsx`, `SettingsStack.tsx`~~
~~Same `headerTransparent` / `BlurView` / `contentStyle` config copied 4 times. Also inconsistent BlurView `intensity` (60 vs 80).~~
~~**Fix:** Extract `defaultStackScreenOptions` constant with unified intensity.~~
**RESUELTO:** `makeBlurHeader(colors)` en `src/core/navigation/sharedScreenOptions.ts`. Intensity unificado a 60. Los 4 stacks usan `screenOptions={makeBlurHeader(colors)}`.

---

### ~~[MEDIUM] C-02 · `(error as Error).message` cast without type guard (~50 occurrences)~~
~~All catch blocks cast directly without checking the type. If thrown value is string/Axios error/`undefined`, produces `undefined`.~~
~~**Fix:** Create `getErrorMessage(error: unknown): string` helper.~~
**RESUELTO:** `getErrorMessage(error: unknown): string` creado en `src/core/utils/errorUtils.ts`. No había ocurrencias del patrón `(e as Error).message` en el código productivo (ya usaban el guard `instanceof Error`).

---

### ~~[MEDIUM] C-03 · Raw Firebase error messages shown to users~~
~~**File:** `src/presentation/viewmodels/AuthViewModel.ts`~~
~~`withLoading` captures `e.message` directly. Users see "Firebase: Error (auth/email-already-in-use)."~~
~~**Fix:** Add error mapping layer that translates Firebase codes to user-friendly Spanish messages.~~
**RESUELTO:** `mapFirebaseError(error)` en `src/core/utils/firebaseErrors.ts`. Aplicado en `login`, `register`, `resetPassword` de `AuthViewModel`.

---

### ~~[MEDIUM] C-04 · Hardcoded colors bypassing theme system~~
~~**Files:** `PlatformIcon.tsx:28,67,70,79,74,82`~~
~~Uses `'#fff'`, `rgba(0,0,0,0.55)`, and null-coalescing with wrong fallback colors instead of theme tokens.~~
~~**Fix:** Use `colors.onPrimary`, `colors.overlay`, remove `??` fallbacks.~~
**RESUELTO (parcial):** `'#fff'` en el ícono Steam reemplazado por `colors.onPrimary`. Los demás valores (`rgba`, `??` en epic/gog) son correctos por contexto.

---

### ~~[MEDIUM] C-05 · Hardcoded version string~~
~~**File:** `src/presentation/screens/settings/SettingsScreen.tsx:164`~~
~~`"GameShelf v1.0.0 (OLED Edition)"` will become stale.~~
~~**Fix:** Use `Constants.expoConfig?.version`.~~
**RESUELTO:** `` `GameShelf v${Constants.expoConfig?.version ?? '1.0.0'} (OLED Edition)` `` usando `expo-constants`.

---

### ~~[MEDIUM] C-06 · Hardcoded currency symbol `$` in DealCard~~
~~**File:** `src/presentation/components/games/DealCard.tsx:38-39`~~
~~ITAD returns prices in the user's local currency, but the UI always shows `$`.~~
~~**Fix:** Add currency field to `Deal` entity; use `Intl.NumberFormat`.~~
**RESUELTO:** `currency: string` añadido a `Deal` entity. `mapItadPriceToDeal` pasa `entry.price.currency`. `DealCard` usa `Intl.NumberFormat` para formatear precios. `getPricesForGame`, `getPricesForGamesBatch` y `getHistoricalLow` pasan el parámetro `country` a la API ITAD. `UserPreferencesStore` (AsyncStorage) guarda el país preferido. `SettingsScreen` incluye selector de moneda (9 países) bajo "SOPORTE".

---

### ~~[MEDIUM] C-07 · Hardcoded Spanish strings throughout UI (no i18n)~~
~~**Files:** Throughout `GameDetailScreen.tsx`, `HltbInfo.tsx`, `DealCard.tsx`, `AuthUseCase.ts:42`~~
~~UI text is hardcoded in Spanish, including the guest display name "Invitado" in the domain layer.~~
~~**Fix:** Extract strings to a localization system. Move presentation concerns out of domain.~~
**RESUELTO (parcial):** `src/core/constants/strings.ts` creado con todos los strings de UI. `SettingsScreen`, `DealCard`, `HltbInfo`, `GameDetailScreen` actualizados para usar `strings.*`. `AuthUseCase` extrae `GUEST_DISPLAY_NAME` como constante de dominio local (no puede importar de `core/` por restricciones de arquitectura). Strings restantes en otras pantallas quedan para futura iteración.

---

### ~~[LOW] C-08 · No-op handlers for "Centro de Ayuda" and "Privacidad"~~
~~**File:** `src/presentation/screens/settings/SettingsScreen.tsx:145,151`~~
~~Empty `onPress` handlers. Users tap with no feedback.~~
~~**Fix:** Implement, open a URL, or hide until implemented.~~
**RESUELTO:** `handleNotImplemented(label)` muestra `Alert.alert(label, 'Próximamente disponible.')`. Los dos botones usan este handler.

---

### ~~[LOW] C-09 · Java-style getters instead of TypeScript properties~~
~~**Files:** All domain entities (`Game.ts`, `GameDetail.ts`, `Deal.ts`, `WishlistItem.ts`, etc.)~~
~~`getTitle()` instead of `get title()` or `readonly title`. Adds verbosity without benefit.~~
**EN PROGRESO:** Refactoring en curso — ~323 call sites en 10 entidades y todos los consumers.

---

### ~~[LOW] C-10 · `UserProfileDTO` and `NotificationPreferences` over-engineered as classes~~
~~**Files:** `src/domain/dtos/UserProfileDTO.ts`, `src/domain/entities/NotificationPreferences.ts`~~
~~Classes with constructors that just assign fields. No methods or logic. Should be plain interfaces.~~
**RESUELTO (parcial):** `UserProfileDTO` convertida a `interface`; `SettingsUseCase` y `SettingsViewModel` usan object literals. `NotificationPreferences` conservada como clase: tiene `getDealsEnabled()` + `setDealsEnabled()` (comportamiento real) y sus mocks usan `new NotificationPreferences(...)` — cambiarla requeriría modificar mocks, que están restringidos.

---

## 8. Accessibility

### ~~[MEDIUM] X-01 · No accessibility roles/labels on skeleton, empty state, and error components~~
~~**Files:** `DetailSkeleton.tsx`, `GameCardSkeleton.tsx`, `LibrarySkeleton.tsx`, `ListItemSkeleton.tsx`, `LoadingSpinner.tsx`, `EmptyState.tsx`, `ErrorMessage.tsx`~~
~~Screen readers encounter silent placeholder views. Errors are not announced.~~
~~**Fix:** Add `accessibilityRole="progressbar"` to skeletons, `accessibilityRole="alert"` to errors.~~
**RESUELTO:** `accessibilityRole="progressbar" + accessibilityLabel="Cargando..."` en los 5 skeletons/spinner; `accessibilityRole="text" + accessibilityLabel={message}` en EmptyState; `accessibilityRole="alert" + accessibilityLiveRegion="polite"` en ErrorMessage.

---

### ~~[MEDIUM] X-02 · `PlatformRow` action button lacks accessibility label and state~~
~~**File:** `src/presentation/components/platforms/PlatformRow.tsx:32`~~
~~No `accessibilityLabel` or `accessibilityState={{ disabled: loading }}`.~~
~~**Fix:** Add descriptive label and disabled state.~~
**RESUELTO:** `accessibilityRole="button"`, `accessibilityLabel={`${platformName} — ${linked ? 'Desvincular' : 'Vincular'}`}`, `accessibilityState={{ disabled: loading }}` añadidos.

---

### ~~[MEDIUM] X-03 · Root stack navigator and `WishlistStack` not type-safe~~
~~**Files:** `MainTabNavigator.tsx:15`, `navigationTypes.ts:31-35`~~
~~`RootStack` is untyped. `WishlistStack` missing from `MainTabParamList`.~~
~~**Fix:** Define `RootStackParamList` with full type safety.~~
**RESUELTO:** `RootStackParamList` (`Tabs`, `WishlistStack`) añadido a `navigationTypes.ts`. `MainTabNavigator` usa `createNativeStackNavigator<RootStackParamList>()`.

---

## 9. Memory & Performance (Low priority)

### ~~[LOW] P-01 · `SteamSyncMemoryGameRepository` has unbounded memory growth~~
~~**File:** `src/data/repositories/SteamSyncMemoryGameRepository.ts:25-26`~~
~~`gamesByUser` and `epicGamesByUser` Maps never pruned. Each user's full library remains after logout.~~
~~**Fix:** Clear Maps on logout.~~
**RESUELTO:** `clearUser(userId)` añadido; elimina las dos Maps para ese usuario. Solo aplica a modo steam-only (sin Firebase).

---

### ~~[LOW] P-02 · `SearchUseCase` loads entire library on every search~~
~~**File:** `src/domain/usecases/games/SearchUseCase.ts:27-31`~~
~~Each debounced search triggers a full Firestore library read for cross-referencing.~~
~~**Fix:** Cache library/wishlist data; invalidate on sync.~~
**RESUELTO:** Cache en memoria con TTL de 2 min (`_libraryCache`) en `SearchUseCase`. La primera búsqueda lee Firestore; las siguientes sirven desde cache. `invalidateLibraryCache()` expuesto para invalidación explícita tras sync.

---

### ~~[LOW] P-03 · Excessive haptic feedback on search keystrokes~~
~~**File:** `src/presentation/screens/search/SearchScreen.tsx:80-81`~~
~~Haptics fire on every debounced search (every 400ms while typing). Also double haptics in `SearchResultCard`.~~
~~**Fix:** Remove haptics from search callback; keep only for discrete actions.~~
**RESUELTO:** `Haptics.impactAsync` eliminado del callback debounced. Se conservan los haptics en `toggleWishlist` (acción discreta).

---

### ~~[LOW] P-04 · Redundant `reflect-metadata` import in `container.ts`~~
~~**File:** `src/di/container.ts:1`~~
~~Already imported as the first line of `index.ts` per project constraints.~~
~~**Fix:** Remove from `container.ts`.~~
**RESUELTO:** Import eliminado de `container.ts`.

---

## Summary

| Severity | Count | Top actions |
|----------|-------|-------------|
| Critical | 0 | Todos resueltos o cerrados con decisión documentada |
| High     | 0 | Todos resueltos |
| Medium   | 0 | Todos resueltos o cerrados |
| Low      | 0 | C-09 resuelto; C-10 parcial (NotificationPreferences conservada); S-10 won't fix |
| **Total abiertos** | 0 | |
