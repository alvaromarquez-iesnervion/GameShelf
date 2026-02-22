# GameShelf — Memoria del proyecto

Registro acumulativo de decisiones, cambios y contexto relevante por sesión.

---

## Estado actual del proyecto (Sesión 13 — Modo producción completo, sin mocks)

### Activación de repositorios Firebase reales + auto-sync

**Motivación**: los repositorios `MemoryPlatformRepository` y `SteamSyncMemoryGameRepository` seguían activos con datos de testing hardcodeados incluso con Firebase configurado. Se eliminan y se activan las implementaciones reales con Firestore.

**Cambios realizados:**

1. **`src/di/container.ts`**:
   - Nueva rama `useFirebase && useRealSteam` (modo producción) enlaza `PlatformRepositoryImpl` y `GameRepositoryImpl`
   - La rama `useRealSteam` (sin Firebase) mantiene los repos en memoria como fallback legítimo
   - La rama `else` mantiene mocks completos para desarrollo sin keys
   - Eliminados imports de `MockSteamApiService`, `MockEpicGamesApiService`, `MockProtonDbService`, `MockIsThereAnyDealService` (nunca se usaban en rutas activas)
   - Añadidos imports de `PlatformRepositoryImpl` y `GameRepositoryImpl`

2. **`src/presentation/viewmodels/LibraryViewModel.ts`**:
   - Añadido campo `_hasSynced: boolean` (flag de sesión para evitar doble sync)
   - Nuevo método `autoSyncIfNeeded(userId)`:
     - Carga la biblioteca Firestore inmediatamente (carga rápida desde caché)
     - Si hay plataformas vinculadas, sincroniza todas en paralelo con `Promise.allSettled`
     - Actualiza `_games` con el resultado combinado
     - El error de sync no bloquea — la caché sigue disponible

3. **`src/core/navigation/RootNavigator.tsx`**:
   - Inyectado `LibraryViewModel`
   - `useEffect` que observa `authVm.isAuthenticated`: al pasar a `true`, llama `libraryVm.autoSyncIfNeeded(uid)` una sola vez por sesión (protegido con `syncStartedRef`)
   - Al cerrar sesión, `syncStartedRef` se resetea para la próxima sesión

4. **`src/data/repositories/MemoryPlatformRepository.ts`**:
   - Eliminadas constantes `TEST_STEAM_ID` y `TEST_USER_ID`
   - Constructor ahora inicia con `new Map()` vacío (sin datos precargados)
   - Actualizado el JSDoc

5. **`src/data/repositories/SteamSyncMemoryGameRepository.ts`**:
   - Eliminada constante `TEST_USER_ID`
   - Eliminado método `initializeForTesting()` y su llamada en el constructor
   - Eliminado flag `initialized` y la verificación en `getLibraryGames()`
   - Actualizado el JSDoc

6. **`ESTADO.md`**:
   - Eliminada sección "⚠️ Configuración temporal para testing"
   - Actualizado estado a "Producción"
   - Actualizada sección "Cómo ejecutar" con los tres modos de operación

**Archivos modificados (6):**
- `src/di/container.ts`
- `src/presentation/viewmodels/LibraryViewModel.ts`
- `src/core/navigation/RootNavigator.tsx`
- `src/data/repositories/MemoryPlatformRepository.ts`
- `src/data/repositories/SteamSyncMemoryGameRepository.ts`
- `ESTADO.md`

**Estado de mocks tras este cambio:**
- `MockAuthRepository`, `MockWishlistRepository`, `MockNotificationRepository`, `MockPlatformRepository`, `MockGameRepository`, `MockSteamApiService` → siguen existiendo como fallback cuando no hay keys configuradas. No se usan en producción. No parchean errores.
- Servicios externos (`MockEpicGamesApiService`, `MockProtonDbService`, `MockHowLongToBeatService`, `MockIsThereAnyDealService`) → solo como referencia/futura testing. No bindeados en ninguna rama del contenedor.

**TypeScript**: `npx tsc --noEmit` — ✅ 0 errores

---

## Estado anterior (Sesión 12 — Auth completo + ForgotPassword)

### Auditoría y corrección del sistema de autenticación

**Motivación**: auditoría completa del flujo de auth tras activar Firebase. Se encontraron 4 bugs y una funcionalidad ausente (reset de contraseña).

**Bugs corregidos:**

1. **`App.tsx`**: `initializeFirebase()` ahora se llama condicionalmente (`if EXPO_PUBLIC_FIREBASE_API_KEY`). Antes se llamaba siempre, intentando `initializeApp()` con campos `undefined` en modo mock.

2. **`MockAuthRepository.ts`**: `logout()` y `deleteAccount()` ahora ponen `currentUser = null` correctamente. Antes reasignaban `MOCK_USER`, creando comportamiento inconsistente en testing. También cambiado el tipo del campo a `User | null`.

3. **`AuthViewModel.ts`**: `checkAuthState()` ahora limpia `_errorMessage = null` al inicio, igual que el resto de métodos asíncronos.

**Nueva funcionalidad — flujo "Olvidé mi contraseña":**

- `IAuthRepository`: añadido método `resetPassword(email): Promise<void>`
- `AuthRepositoryImpl`: implementado con `sendPasswordResetEmail()` de Firebase Auth
- `MockAuthRepository`: mock que simula delay + valida formato email + retorna void
- `AuthViewModel`: añadido `resetPassword(email): Promise<boolean>` con patrón habitual (isLoading, errorMessage, runInAction)
- `navigationTypes.ts`: añadida ruta `ForgotPassword: undefined` a `AuthStackParamList`
- `AuthStack.tsx`: registrada `ForgotPasswordScreen`
- `ForgotPasswordScreen.tsx`: **NUEVA** — input email + botón enviar + estado de éxito con confirmación visual + botón volver
- `LoginScreen.tsx`: añadido enlace "¿Olvidaste tu contraseña?" entre el campo password y el botón de login

**Archivos modificados (9) + 1 nuevo:**
- `src/core/App.tsx`
- `src/data/mocks/MockAuthRepository.ts`
- `src/presentation/viewmodels/AuthViewModel.ts`
- `src/domain/interfaces/repositories/IAuthRepository.ts`
- `src/data/repositories/AuthRepositoryImpl.ts`
- `src/core/navigation/navigationTypes.ts`
- `src/core/navigation/AuthStack.tsx`
- `src/presentation/screens/auth/LoginScreen.tsx`
- `src/domain/DOMAIN.md`
- `src/presentation/screens/auth/ForgotPasswordScreen.tsx` ← NUEVO

**TypeScript**: `npx tsc --noEmit` — ✅ 0 errores (solo error en `src/app/` scaffold ignorado)

---

## Estado anterior (Sesión 11 — Firebase activado)

### Configuración de Firebase real

**Motivación**: hasta ahora Auth, Wishlist y Notificaciones usaban mocks en memoria. Con Firebase configurado, los datos persisten entre sesiones y entre dispositivos.

**Cambios realizados:**

1. **`.env`**: rellenadas las 6 variables `EXPO_PUBLIC_FIREBASE_*` con el proyecto `gameshelf-180a3`.

2. **`src/core/App.tsx`**: añadida llamada a `initializeFirebase()` antes de importar el contenedor DI. Esto garantiza que las instancias `Auth` y `Firestore` estén listas antes de que Inversify las inyecte.

3. **`src/di/container.ts`**:
   - Añadida variable `useFirebase` (detecta `EXPO_PUBLIC_FIREBASE_API_KEY` presente).
   - Registradas las instancias `Auth` y `Firestore` como `toDynamicValue` con `TYPES.FirebaseAuth` / `TYPES.Firestore`.
   - Auth, Wishlist y Notification: ahora usan `AuthRepositoryImpl`, `WishlistRepositoryImpl`, `NotificationRepositoryImpl` cuando `useFirebase = true`; en caso contrario caen al mock.

**Archivos modificados (3):**
- `.env`
- `src/core/App.tsx`
- `src/di/container.ts`

**Estado de los repositorios Firebase (ahora activos):**
- `AuthRepositoryImpl` — Auth + Firestore (colección `users`)
- `WishlistRepositoryImpl` — Firestore (subcolección `users/{uid}/wishlist`)
- `NotificationRepositoryImpl` — Firestore (doc `users/{uid}/settings/notifications`)

**Nota sobre configuración temporal de testing:**
Con Firebase real activo, el `MockAuthRepository` ya no se usa. La sesión ya NO arranca pre-logueada. El usuario debe registrarse o hacer login real. Los cambios de testing en `MemoryPlatformRepository` y `SteamSyncMemoryGameRepository` siguen activos (Steam pre-vinculado) pero solo afectan a la capa de juegos/plataformas que aún usa memoria.

**TypeScript**: pendiente de verificar — los repos *Impl ya existían sin errores previos.

---

## Estado anterior (Sesión 10 — Epic Games Auth Code)

### Vinculación automática de Epic Games via Authorization Code

**Motivación**: el flujo anterior requería solicitar una exportación GDPR (24-48h de espera), descargar un ZIP, encontrar un JSON específico y copiar su contenido. El nuevo flujo preferido requiere solo hacer login en Epic en el navegador y copiar un código corto.

**Flujo nuevo (Auth Code — API interna no oficial):**
1. El usuario pulsa "Abrir Epic Games en el navegador" (se abre `EPIC_AUTH_REDIRECT_URL` con `Linking.openURL`)
2. Inicia sesión en su cuenta de Epic en el navegador
3. Epic muestra una página con el authorization code (~32 chars)
4. El usuario copia el código y lo pega en la app (TextInput de una línea)
5. `exchangeAuthCode()` intercambia el code por un access token + accountId
6. `fetchLibrary()` obtiene los entitlements con el token (misma estructura que GDPR)
7. Los juegos se enriquecen con ITAD y se sincronizan

**El flujo GDPR se mantiene** como pestaña secundaria ("Importar JSON") — fallback estable si Epic cambia la API.

**Archivos modificados (10):**
- `src/domain/dtos/EpicAuthToken.ts` — **NUEVO**: DTO con accessToken, accountId, displayName, expiresAt
- `src/domain/interfaces/services/IEpicGamesApiService.ts` — +2 métodos: `exchangeAuthCode`, `fetchLibrary`
- `src/domain/interfaces/usecases/platforms/IPlatformLinkUseCase.ts` — +1 método: `linkEpicByAuthCode`
- `src/domain/interfaces/repositories/IPlatformRepository.ts` — `linkEpicPlatform` acepta `epicAccountId?` opcional
- `src/data/config/ApiConstants.ts` — +5 constantes: `EPIC_AUTH_TOKEN_URL`, `EPIC_ENTITLEMENTS_URL`, `EPIC_AUTH_CLIENT_ID`, `EPIC_AUTH_CLIENT_SECRET`, `EPIC_AUTH_REDIRECT_URL`
- `src/data/services/EpicGamesApiServiceImpl.ts` — implementación de `exchangeAuthCode` y `fetchLibrary`
- `src/data/mocks/MockEpicGamesApiService.ts` — mocks de los dos nuevos métodos
- `src/data/repositories/MemoryPlatformRepository.ts` — `linkEpicPlatform` acepta `epicAccountId?`
- `src/data/mocks/MockPlatformRepository.ts` — `linkEpicPlatform` acepta `epicAccountId?`
- `src/data/repositories/PlatformRepositoryImpl.ts` — `linkEpicPlatform` guarda accountId real o "imported"
- `src/domain/usecases/platforms/PlatformLinkUseCase.ts` — implementación de `linkEpicByAuthCode`
- `src/presentation/viewmodels/PlatformLinkViewModel.ts` — +2 métodos: `linkEpicByAuthCode`, `getEpicAuthUrl`
- `src/presentation/screens/settings/PlatformLinkScreen.tsx` — modal Epic rediseñado con 2 pestañas

**Decisión de diseño — cliente Epic:**
Se usa `launcherAppClient2` (clientId: `34a02cf8f4414e29b15921876da36f9a`) porque es el cliente oficial del Epic Games Launcher. Sus credenciales son públicas y ampliamente conocidas en la comunidad de desarrolladores (repo EpicResearch — 400+ stars). Sin embargo, su uso viola los ToS de Epic — se documenta el riesgo explícitamente en comentarios.

**AVISO de estabilidad:**
La API de auth interna de Epic puede cambiar sin previo aviso. El flujo GDPR es el método estable de reserva.

**TypeScript**: `npx tsc --noEmit` — ✅ 0 errores (el único error existente es `src/app/_layout.tsx` que es scaffold de Expo Router ignorado por AGENTS.md)

---

## Estado anterior (Sesión 9 — Epic Games Integration Completa)

### Implementación de Epic Games

**Resumen**: Epic Games ahora es una plataforma completamente funcional con:
- ✅ Vinculación vía importación manual del export GDPR JSON
- ✅ Enriquecimiento de juegos con portadas e itadGameId desde ITAD
- ✅ Sincronización de biblioteca en memoria
- ✅ UI mejorada con modal de 4 pasos para importación
- ✅ Validación y manejo de errores robusto

**Cambios arquitectónicos:**

1. **`EpicGamesApiServiceImpl` mejorado** (`src/data/services/EpicGamesApiServiceImpl.ts`):
   - ✅ Inyectado `IIsThereAnyDealService` para obtener portadas e itadGameId
   - ✅ `parseExportedLibrary()` ahora es async y enriquece juegos en paralelo con `Promise.allSettled`
   - ✅ Si una API falla (ITAD), el juego se crea igual pero sin portada ni itadGameId
   - ✅ Manejo robusto de errores: si JSON es inválido, lanza error claro

2. **`IGameRepository` extendida** (`src/domain/interfaces/repositories/IGameRepository.ts`):
   - ✅ Nuevo método `storeEpicGames(userId, games)` para almacenar juegos parseados en memoria

3. **`SteamSyncMemoryGameRepository` extendida** (`src/data/repositories/SteamSyncMemoryGameRepository.ts`):
   - ✅ Inyectado `IEpicGamesApiService`
   - ✅ Nuevo map `epicGamesByUser` para almacenar juegos temporalmente
   - ✅ `syncLibrary()` ahora maneja `Platform.EPIC_GAMES` correctamente
   - ✅ Combina juegos de Steam y Epic sin perder datos

4. **`PlatformLinkUseCase` mejorado** (`src/domain/usecases/platforms/PlatformLinkUseCase.ts`):
   - ✅ `linkEpic()` ahora valida que haya juegos parseados
   - ✅ Almacena juegos en repositorio antes de marcar como vinculado
   - ✅ Flujo: parsear → almacenar → vincular → sincronizar (no bloqueante)

5. **`PlatformLinkScreen` rediseñada** (`src/presentation/screens/settings/PlatformLinkScreen.tsx`):
   - ✅ Modal nuevo para Epic con 4 pasos de instrucciones
   - ✅ Input de textarea para pegar JSON directamente
   - ✅ Validación en tiempo real
   - ✅ Mensajes de error específicos
   - ✅ Feedback visual: loading, success notification

6. **DI Container actualizado** (`src/di/container.ts`):
   - ✅ Cambiado binding de `IEpicGamesApiService` de `MockEpicGamesApiService` a `EpicGamesApiServiceImpl`
   - ✅ Epic ahora usa implementación real (no requiere API key)

7. **`MockGameRepository` actualizado** (`src/data/mocks/MockGameRepository.ts`):
   - ✅ Implementado `storeEpicGames()` para mantener compatibilidad

**Archivos modificados (7)**:
- `src/data/services/EpicGamesApiServiceImpl.ts`
- `src/domain/interfaces/repositories/IGameRepository.ts`
- `src/data/repositories/SteamSyncMemoryGameRepository.ts`
- `src/domain/usecases/platforms/PlatformLinkUseCase.ts`
- `src/presentation/screens/settings/PlatformLinkScreen.tsx`
- `src/di/container.ts`
- `src/data/mocks/MockGameRepository.ts`

**TypeScript**: `npx tsc --noEmit` — ✅ 0 errores

---

## Estado anterior (Sesión 8 — Home completo + ITAD fix + Populares + Navegación fix)

### Últimos cambios

- **FIX: Navegación desde resultados de búsqueda ITAD**:
  - Los resultados de ITAD usan UUIDs propios, no Steam App IDs
  - Añadido `IIsThereAnyDealService.getGameInfo()` para obtener steamAppId desde ITAD
  - `SearchResult` ahora incluye `steamAppId` opcional
  - `searchGames()` enriquece resultados con Steam App ID llamando a `/games/info/v2`
  - Nuevo método `getOrCreateGameById()` en `IGameRepository` para crear Game desde ITAD si no está en biblioteca
  - `GameDetailUseCase` puede ahora mostrar detalles de juegos que no están en la biblioteca del usuario

- **NUEVA: Sección "Populares ahora"**:
  - Juegos más jugados globalmente en Steam (no requiere vincular cuenta)
  - `ISteamApiService.getMostPlayedGames()` implementado en `SteamApiServiceImpl`
  - Usa `ISteamChartsService/GetMostPlayedGames/v1` + `store.steampowered.com/api/appdetails`
  - Nueva sección siempre visible en Home

- **FIX: ITAD API key corregida**:
  - API key anterior devolvía 403 Forbidden
  - Nueva key: `5d398f72eb9e7b3779672437f2d6f82e1d9c883f`
  - Búsqueda en ITAD ahora funciona correctamente

- **FIX: Home se recarga tras vincular Steam**:
  - Cambiado `useEffect` a `useFocusEffect` en `SearchScreen`
  - Los datos se actualizan cada vez que la pantalla obtiene el foco
  - Vincular Steam → volver a Home → datos actualizados

- **FIX: Empty states por sección**:
  - Cada sección muestra su propio empty state
  - "Continúa jugando": mensaje de vincular Steam si no hay datos
  - "Tus más jugados": mensaje de vincular Steam si no hay datos
  - Botón "Vincular Steam" al final si no hay ninguna plataforma vinculada

- **Archivos modificados**:
  - `.env` — actualizado `EXPO_PUBLIC_ITAD_API_KEY`
  - `src/domain/interfaces/services/ISteamApiService.ts` — añadido `getMostPlayedGames()`
  - `src/data/services/SteamApiServiceImpl.ts` — implementado `getMostPlayedGames()` con Steam Charts + Store API
  - `src/data/mocks/MockSteamApiService.ts` — añadido mock de `getMostPlayedGames()`
  - `src/data/mocks/MockDataProvider.ts` — añadido `MOCK_POPULAR_GAMES` (10 juegos)
  - `src/domain/interfaces/usecases/home/IHomeUseCase.ts` — añadido `getPopularGames()`
  - `src/domain/usecases/home/HomeUseCase.ts` — implementado `getPopularGames()`
  - `src/presentation/viewmodels/HomeViewModel.ts` — añadido `popularGames` + `loadPopularGames()`
  - `src/presentation/screens/search/SearchScreen.tsx` — sección "Populares ahora", `useFocusEffect`, empty states por sección

- **TypeScript**: `npx tsc --noEmit` — ✅ 0 errores (solo error en `src/app/` que es scaffold antiguo ignorado)

---

## Cambios anteriores (Sesión 8 — ProtonDB Real + Home Screen + ITAD Real)
  - Añadido estado local `inputText` en `SearchScreen` para actualizar UI inmediatamente
  - El debounce de 400ms solo aplica a la llamada a API, no al renderizado del input
  - Soluciona el problema de que las letras se borraban al escribir rápido

- **FIX: Empty state del Home mejorado**:
  - Añadido botón "Vincular Steam" cuando no hay datos de juegos
  - El botón navega a la pantalla de ajustes para vincular Steam
  - Mejora la UX para usuarios que aún no han vinculado su cuenta

- **ProtonDB con datos reales ACTIVADO**:
  - Cambiado binding en `container.ts`: `MockProtonDbService` → `ProtonDbServiceImpl`
  - La API de ProtonDB no requiere API key, funciona directamente
  - Solo funciona con juegos de Steam (no Epic)

- **IsThereAnyDeal con datos reales ACTIVADO**:
  - Añadido `EXPO_PUBLIC_ITAD_API_KEY` en `.env`
  - Cambiado binding en `container.ts`: `MockIsThereAnyDealService` → `IsThereAnyDealServiceImpl`
  - `SteamSyncMemoryGameRepository.searchGames()` ahora delega a `IIsThereAnyDealService`
  - Búsqueda global en catálogo de ~50 tiendas (Steam, Epic, GOG, Humble, etc.)

- **NUEVA funcionalidad Home/Discover**:
  - `SearchScreen` transformada en pantalla Home con:
    - Sección "Continúa jugando" (juegos jugados en últimas 2 semanas)
    - Sección "Tus más jugados" (top 5 por playtime)
    - Búsqueda global en catálogo ITAD (mantiene funcionalidad anterior)
  - Nueva entidad `Game` con campos `playtime` (minutos) y `lastPlayed` (Date)
  - Nuevo `ISteamApiService.getRecentlyPlayedGames()` implementado en `SteamApiServiceImpl`
  - Nuevo `IHomeUseCase` + `HomeUseCase` para lógica del Home
  - Nuevo `HomeViewModel` (singleton) para estado del Home
  - Nuevo componente `HomeGameCard` para secciones horizontales

- **Archivos nuevos**:
  - `src/domain/interfaces/usecases/home/IHomeUseCase.ts`
  - `src/domain/usecases/home/HomeUseCase.ts`
  - `src/presentation/viewmodels/HomeViewModel.ts`
  - `src/presentation/components/games/HomeGameCard.tsx`

- **Archivos modificados**:
  - `src/domain/entities/Game.ts` — añadidos `playtime`, `lastPlayed`, getters/setters
  - `src/domain/interfaces/services/ISteamApiService.ts` — añadido `getRecentlyPlayedGames()`
  - `src/data/services/SteamApiServiceImpl.ts` — implementado `getRecentlyPlayedGames()`, actualizado mapper
  - `src/data/mocks/MockSteamApiService.ts` — añadido `getRecentlyPlayedGames()` mock
  - `src/data/mocks/MockDataProvider.ts` — añadidos `playtime`, `lastPlayed` a juegos, nuevo `MOCK_RECENTLY_PLAYED`
  - `src/data/repositories/SteamSyncMemoryGameRepository.ts` — inyectado `IIsThereAnyDealService`, `searchGames()` delega a ITAD
  - `src/di/types.ts` — añadidos `IHomeUseCase`, `HomeViewModel`
  - `src/di/container.ts` — añadidos bindings, cambiado ProtonDB e ITAD a real
  - `src/presentation/screens/search/SearchScreen.tsx` — rediseñada como Home
  - `.env` — añadido `EXPO_PUBLIC_ITAD_API_KEY`

- **TypeScript**: `npx tsc --noEmit` — ✅ 0 errores (solo error en `src/app/` que es scaffold antiguo ignorado)

---

## Estado anterior (Sesión 7 — CRASH FIX + Steam API Real)

- **CRASH `Cannot assign to read-only property 'NONE'` RESUELTO**: 
  - Causa raíz: Incompatibilidad entre `@babel/plugin-transform-class-properties` y Hermes en React Native 0.81
  - Solución: Eliminar plugin de `babel.config.js`
  - También configurado MobX: `configure({ useProxies: 'never', enforceActions: 'never' })` en `index.ts`
  - Versiones estabilizadas: `react-native-gesture-handler@2.20.2`, `react-native-reanimated@3.10.1`
  - Limpieza total: `node_modules`, lock files, `.expo` cache

- **Steam API Real FUNCIONANDO**:
  - `.env`: Eliminado espacio erróneo en `EXPO_PUBLIC_STEAM_API_KEY`
  - `SteamApiServiceImpl`: Implementa `resolveSteamId()` para convertir URLs/vanity names a SteamID64
  - `MemoryPlatformRepository`: Almacena plataformas vinculadas en memoria (sin Firebase)
  - `SteamSyncMemoryGameRepository`: Sincroniza biblioteca real desde Steam Web API
  - Flujo completo: Input SteamID/URL → ResolveVanityURL → GetPlayerSummaries → GetOwnedGames

- **TypeScript**: `npx tsc --noEmit` — ✅ 0 errores

---

## Estado anterior (Sesión 6 y anteriores)

### Últimos cambios

- **`src/app/` → `src/core/`**: Renombrado para evitar que Expo SDK 54 detectara la carpeta como raíz de Expo Router.
- **`index.ts`** (raíz): Nuevo entry point con `registerRootComponent(App)`. `reflect-metadata` se importa aquí primero.
- **`package.json` `main`**: cambiado de `src/app/App.tsx` a `index.ts`.
- **`app.json`**: eliminado plugin `expo-router`, eliminado `experiments` (typedRoutes, reactCompiler), cambiado `web.output` de `"static"` a `"single"`.
- **`tsconfig.json`**: `include` narrowed a `src/**`, excluido `app-example/`, incluido `index.ts`.
- **`babel.config.js`**: añadido `@babel/plugin-transform-class-properties` (loose: true) para decoradores Inversify.
- **`app-example/`**: eliminado (era template de Expo, no parte del proyecto).
- **Expo `expo@54.0.33` y `expo-font@14.0.11`**: actualizados a versiones compatibles.
- **`npx tsc --noEmit`**: 0 errores.
- **`npx expo start`**: arranca limpiamente, sin advertencias de Expo Router.

---

## Estado actual del proyecto

### Capas completadas

| Capa | Estado | Descripción |
|------|--------|-------------|
| **Domain** | ✅ Completa | Entidades (getter methods), enums, DTOs, interfaces repos/servicios/usecases |
| **Data** | ✅ Completa | Firebase config, mappers, 5 repos, 5 servicios, 12 mocks |
| **DI** | ✅ Completa | `types.ts`, `container.ts` (mocks por defecto), `useInjection` hook |
| **Presentation** | ✅ Completa | 7 ViewModels, 10 screens, 10+ componentes UI, tema oscuro |
| **App/Navigation** | ✅ Completa | React Navigation (no Expo Router), 5 stacks, tab navigator |

### Pendiente

- Push notifications (diferido)
- Pruebas end-to-end reales (con Firebase)
- `app-example/` tiene errores TS (es template de Expo, no afecta al proyecto)
- `babel.config.js` — verificar plugins de decoradores Inversify si hay problemas en runtime

---

## Decisiones clave (todas las sesiones)

- **No `AuthUseCase`** — AuthViewModel depende directamente de `IAuthRepository`
- **Entidades**: campos privados + métodos getter (`getTitle()`, `getId()`)
- **DTOs**: campos `readonly` públicos (`profile.user`, `detail.isInWishlist`)
- **Firebase JS SDK** (no `@react-native-firebase`) — compatible con Expo Go
- **Variables de entorno**: prefijo `EXPO_PUBLIC_`
- **Mocks activos por defecto**: `EXPO_PUBLIC_USE_MOCKS !== 'false'` en container.ts
- **Mappers de APIs externas**: métodos privados dentro de `ServiceImpl`
- **Mappers Firestore**: archivos separados (`FirestoreGameMapper`, `FirestoreWishlistMapper`)
- **HLTB**: POST directo a API (no npm package, incompatible con RN)
- **ProtonDB**: requiere headers `User-Agent` + `Referer`
- **Tema**: modo oscuro en `colors.ts`
- **ViewModels**: `makeAutoObservable(this)`, `runInAction()` para mutaciones, `_field` + `get field()`
- **Shimmer**: `Animated.timing` opacity pulse (sin `expo-linear-gradient`)
- **Errores**: componente inline `ErrorMessage` con retry (no toasts)
- **Loading**: Skeleton/shimmer animations (no spinners simples)

---

## Sesión 1 — Documentación

Generados 6 archivos `.md`: `ARCHITECTURE.md`, `DOMAIN.md`, `DATA.md`, `DI.md`, `PRESENTATION.md`, `APP.md`, `MEMORY.md`.

---

## Sesión 2 — Capas domain + data

- Instalados `firebase` y `axios`
- `.env` añadido a `.gitignore`, creado `.env.example`
- Implementadas todas las entidades, enums, DTOs, interfaces
- `src/di/types.ts` con símbolos Inversify
- Capa data completa: config, mappers, 5 repos, 5 servicios

---

## Sesión 3 — Mocks

Creada `src/data/mocks/` con 12 archivos mock. Datos semilla: 6 juegos Steam, 2 Epic, deals, ProtonDB ratings, HLTB horas, wishlist inicial. Activación: `EXPO_PUBLIC_USE_MOCKS` env var.

---

## Sesión 4 — Capa presentation + navegación

### Qué se hizo

- **Expo Router eliminado**: borrados `_layout.tsx`, `index.tsx`, `(auth)/`, `(main)/`. Cambiado `package.json` main. Desinstalado `expo-router`, instalado `@react-navigation/native-stack`.
- **App.tsx**: `reflect-metadata` first import, dark theme, NavigationContainer, SafeAreaProvider
- **Navegación**: `navigationTypes.ts`, `RootNavigator.tsx`, `AuthStack.tsx`, `LibraryStack.tsx`, `SearchStack.tsx`, `WishlistStack.tsx`, `SettingsStack.tsx`, `MainTabNavigator.tsx`
- **7 ViewModels**: AuthVM, LibraryVM, WishlistVM, GameDetailVM, SearchVM, PlatformLinkVM, SettingsVM
- **10 Screens**: Login, Register, Library, GameDetail, Wishlist, Search, Settings, PlatformLink, NotificationSettings, Profile
- **Shimmer/skeleton**: `Shimmer.tsx`, `GameCardSkeleton.tsx`, `LibrarySkeleton.tsx`, `DetailSkeleton.tsx`, `ListItemSkeleton.tsx`
- **DI container**: Todos los bindings de ViewModels añadidos (3 Singleton + 4 Transient)

### Bugs corregidos

- `AuthViewModel.isLoading()` era método pero se asignaba como propiedad → cambiado a `_isLoading` + `get isLoading()`
- `NotificationSettingsScreen` — `Switch.onValueChange` type mismatch (Promise<boolean> vs void) → wrapped in void lambda

### TypeScript check

  `npx tsc --noEmit` — 0 errores en `src/` (solo errores en `app-example/` que es template de Expo)

---

## Sesión 6 — Rediseño UI/UX Profesional (COMPLETADO)

### Qué se hizo

- **Paleta de colores modernizada**: Sistema de colores más profesional con esquema de grises profundos (#0F0F0F, #1A1A1A), primarios índigo (#6366F1), y acentos verdes/naranjas. Eliminados colores púrpura brillante del diseño anterior.
- **Sistema de diseño mejorado**: Añadidos `radius` (4-24px) y `shadows` a `spacing.ts` para consistencia visual. Jerarquía tipográfica refinada con hero, heading, subheading, title, body, caption, label.
- **Eliminación total de emojis**: Todos los emojis reemplazados por iconos de `@expo/vector-icons` (Feather):
  - ❤️ → `heart` (con estados filled/outline)
  - 🔍 → `search`
  - 📚 → `grid`
  - ⚙️ → `settings`
  - 🎮 → `package`
  - 💫 → `heart`
  - ⏱️ → `clock`
  - ⚠️ → `alert-circle`
  - Y todos los demás emojis

### Componentes actualizados (todos sin emojis)

**Common Components:**
- `EmptyState` - Icono de Feather configurable, diseño minimalista
- `ErrorMessage` - Icono de alerta, botón de retry con icono
- `LoadingSpinner` - Contenedor card con mensaje opcional

**Game Components:**
- `GameCard` - Tarjetas con sombras, bordes redondeados
- `SearchResultCard` - Icono de heart para wishlist
- `WishlistGameCard` - Icono de trash-2 para eliminar
- `DealCard` - Icono external-link, badges de descuento
- `HltbInfo` - Icono clock, layout horizontal de 3 columnas
- `ProtonDbBadge` - Icono check-circle/x-circle según rating
- `PlatformBadge` - Iconos monitor (Steam) y box (Epic)

### Pantallas rediseñadas

**Auth Screens:**
- **LoginScreen**: Logo con icono layers, inputs con iconos (mail, lock), botón con icono arrow-right, toggle de visibilidad de contraseña
- **RegisterScreen**: Back button con icono, inputs con iconos, mejor espaciado

**Main Screens:**
- **LibraryScreen**: Buscador con icono search, clear button, header con icono heart
- **SearchScreen**: Buscador estilizado, empty states con iconos apropiados
- **WishlistScreen**: Lista limpia, empty state con icono heart

**Detail Screen:**
- **GameDetailScreen**: Cover con placeholder, badges mejorados, botón wishlist con icono heart, sección de deals con icono tag

**Settings Screens:**
- **SettingsScreen**: Perfil con avatar e icono check-circle, menú con iconos (monitor, bell, user, log-out, trash-2)
- **PlatformLinkScreen**: Iconos link/link-2 en botones de acción
- **NotificationSettingsScreen**: Icono tag en card de notificaciones
- **ProfileScreen**: Avatar con badge de verificación, stat cards con iconos (grid, monitor, heart)

### Navegación actualizada

**MainTabNavigator:**
- Buscar: `search` icon
- Biblioteca: `grid` icon
- Ajustes: `settings` icon

### Archivos modificados

| Categoría | Archivos |
|-----------|----------|
| **Theme** | `colors.ts`, `typography.ts`, `spacing.ts` |
| **Common** | `EmptyState.tsx`, `ErrorMessage.tsx`, `LoadingSpinner.tsx` |
| **Games** | `GameCard.tsx`, `SearchResultCard.tsx`, `WishlistGameCard.tsx`, `DealCard.tsx`, `HltbInfo.tsx`, `ProtonDbBadge.tsx` |
| **Platforms** | `PlatformBadge.tsx` |
| **Screens** | `LoginScreen.tsx`, `RegisterScreen.tsx`, `LibraryScreen.tsx`, `SearchScreen.tsx`, `WishlistScreen.tsx`, `GameDetailScreen.tsx`, `SettingsScreen.tsx`, `PlatformLinkScreen.tsx`, `NotificationSettingsScreen.tsx`, `ProfileScreen.tsx` |
| **Navigation** | `MainTabNavigator.tsx` |
| **Docs** | `ESTADO.md` creado, `MEMORY.md` actualizado |

### TypeScript Check

`npx tsc --noEmit` — ✅ 0 errores

### Resultado final

Aplicación GameShelf con diseño profesional tipo "Steam/Epic Store meets Discord":
- ✅ Modo oscuro elegante con paleta coherente
- ✅ Sin emojis - iconografía profesional Feather
- ✅ Sistema de diseño escalable con tokens
- ✅ Componentes reutilizables y consistentes
- ✅ Jerarquía visual clara
- ✅ Estados de carga, error y vacío bien definidos
- ✅ Accesibilidad mejorada con iconos descriptivos

### Pendiente futuro (no crítico)

- Implementar modo claro (actualmente solo modo oscuro)
- Agregar animaciones de entrada/salida
- Soporte para i18n completo
- Tests visuales con Storybook

