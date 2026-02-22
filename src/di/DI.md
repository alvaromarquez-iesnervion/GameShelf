# DI — Inyección de dependencias (Inversify)

## Propósito

Conecta las interfaces de `domain/` con sus implementaciones en `data/` y `presentation/`. Actúa como mapa de construcción del proyecto: cualquier clase que necesite una dependencia la recibe inyectada, sin instanciarla directamente.

Esta capa conoce todas las demás capas (`domain/`, `data/`, `presentation/`) pero ninguna capa la importa a ella. Es el "pegamento" del proyecto.

---

## Archivos

| Archivo | Contenido |
|---|---|
| `container.ts` | Contenedor Inversify con todos los bindings registrados |
| `types.ts` | Símbolos `Symbol.for()` que Inversify usa como identificadores únicos |
| `hooks/useInjection.ts` | Hook puente entre React y el contenedor Inversify |

---

## `container.ts` — Bindings

El contenedor detecta las variables de entorno en tiempo de arranque y elige la implementación adecuada:

| Variable presente | Efecto |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Auth, Wishlist, Notification → `*RepositoryImpl` reales |
| `EXPO_PUBLIC_STEAM_API_KEY` | Steam, Games, Platforms → implementaciones reales en memoria |
| Ninguna | Todo → mocks |

Registra todos los bindings en este orden:

```
Instancias Firebase (cuando useFirebase = true)
  TYPES.FirebaseAuth      → getFirebaseAuth()   (toDynamicValue)
  TYPES.Firestore         → getFirebaseFirestore() (toDynamicValue)

Repositorios (singleton)
  IAuthRepository         → AuthRepositoryImpl  (o MockAuthRepository)
  IGameRepository         → SteamSyncMemoryGameRepository (o MockGameRepository)
  IWishlistRepository     → WishlistRepositoryImpl (o MockWishlistRepository)
  IPlatformRepository     → MemoryPlatformRepository (o MockPlatformRepository)
  INotificationRepository → NotificationRepositoryImpl (o MockNotificationRepository)

Servicios externos (singleton)
  ISteamApiService        → SteamApiServiceImpl
  IEpicGamesApiService    → EpicGamesApiServiceImpl
  IProtonDbService        → ProtonDbServiceImpl
  IHowLongToBeatService   → HowLongToBeatServiceImpl
  IIsThereAnyDealService  → IsThereAnyDealServiceImpl

Casos de uso (singleton)
  ILibraryUseCase         → LibraryUseCase
  IWishlistUseCase        → WishlistUseCase
  IGameDetailUseCase      → GameDetailUseCase
  ISearchUseCase          → SearchUseCase
  IPlatformLinkUseCase    → PlatformLinkUseCase
  ISettingsUseCase        → SettingsUseCase
  IHomeUseCase            → HomeUseCase

ViewModels (ver tabla singleton/transient más abajo)
```

> **Nota**: No existe binding para `IAuthUseCase` — fue eliminado. `AuthViewModel` recibe `IAuthRepository` directamente.

---

## `types.ts` — Símbolos TYPES

Cada interfaz y ViewModel tiene un símbolo único para evitar colisiones en el contenedor:

```ts
export const TYPES = {
  // Repositorios
  IAuthRepository: Symbol.for('IAuthRepository'),
  IGameRepository: Symbol.for('IGameRepository'),
  // ...

  // Servicios
  ISteamApiService: Symbol.for('ISteamApiService'),
  // ...

  // Use cases
  ILibraryUseCase: Symbol.for('ILibraryUseCase'),
  // ...

  // ViewModels
  AuthViewModel: Symbol.for('AuthViewModel'),
  LibraryViewModel: Symbol.for('LibraryViewModel'),
  // ...
};
```

---

## Singleton vs Transient

| ViewModel | Scope | Razón |
|---|---|---|
| `AuthViewModel` | **SINGLETON** | Estado de auth global. `RootNavigator` lo observa constantemente |
| `LibraryViewModel` | **SINGLETON** | Biblioteca compartida entre tabs. Evita recargas al navegar |
| `WishlistViewModel` | **SINGLETON** | Se lee desde 3 pantallas (WishlistScreen, SearchScreen, GameDetailScreen) |
| `HomeViewModel` | **SINGLETON** | Datos del Home (recientes, más jugados) compartidos globalmente |
| `GameDetailViewModel` | **TRANSIENT** | Cada pantalla de detalle es independiente |
| `SearchViewModel` | **TRANSIENT** | Cada búsqueda parte desde cero |
| `PlatformLinkViewModel` | **TRANSIENT** | Solo activo en la pantalla de vinculación |
| `SettingsViewModel` | **TRANSIENT** | Solo activo en la pantalla de ajustes |

Todos los repositorios, servicios y use cases son **singleton**.

---

## `hooks/useInjection.ts` — Puente React ↔ Inversify

Es el **único punto** donde las vistas se conectan con el contenedor. Los ViewModels no usan este hook (son clases puras sin React).

```ts
// Uso en una vista:
const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
// Si es singleton → siempre devuelve la misma instancia
// Si es transient → crea una nueva instancia cada vez
```

---

## Configuración crítica

### React Navigation + Hermes
- `react-native-gesture-handler`: versión >= 2.20.0
- `react-native-reanimated`: versión >= 3.10.0
- En `babel.config.js`: usar `@babel/plugin-proposal-decorators` con `legacy: true`
- En `index.ts`: `import 'reflect-metadata'` debe ser el **primer import** (no en `App.tsx`)

### Inversify + Módulos ES
- `babel.config.js` plugins:
  - `'babel-plugin-transform-typescript-metadata'`
  - `['@babel/plugin-proposal-decorators', { legacy: true }]`

### Activación de implementaciones reales

**Firebase (Auth + Firestore)** — activo cuando `EXPO_PUBLIC_FIREBASE_API_KEY` está en `.env`:
- `initializeFirebase()` se llama en `App.tsx` antes de importar el contenedor
- `TYPES.FirebaseAuth` y `TYPES.Firestore` se registran como `toDynamicValue`
- `AuthRepositoryImpl`, `WishlistRepositoryImpl`, `NotificationRepositoryImpl` se enlazan en lugar de sus mocks

**Steam API en modo real** — activo cuando `EXPO_PUBLIC_STEAM_API_KEY` está en `.env`:
- El contenedor DI activa `SteamApiServiceImpl`, `MemoryPlatformRepository`, `SteamSyncMemoryGameRepository`

**ProtonDB y HLTB**: Siempre usan implementaciones reales (no requieren API key).

**Sin variables configuradas**: Todo cae a mocks. Útil para desarrollo de UI sin servicios externos.

### Firebase Config
- `FirebaseConfig.ts` en `data/config/`: exporta `initializeFirebase()`, `getFirebaseAuth()`, `getFirebaseFirestore()`
- `initializeFirebase()` se llama en `App.tsx` antes de importar `container.ts`
- Proyecto Firebase activo: `gameshelf-180a3`
