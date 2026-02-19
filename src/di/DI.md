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

Registra todos los bindings en este orden:

```
Repositorios (singleton)
  IAuthRepository         → AuthRepositoryImpl
  IGameRepository         → GameRepositoryImpl
  IWishlistRepository     → WishlistRepositoryImpl
  IPlatformRepository     → PlatformRepositoryImpl
  INotificationRepository → NotificationRepositoryImpl

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

## Configuración requerida

Inversify usa decoradores (`@injectable`, `@inject`) y `reflect-metadata`. Sin esta configuración, el contenedor no funciona:

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**`babel.config.js`** (plugins adicionales al preset de Expo):
```js
['@babel/plugin-proposal-decorators', { legacy: true }],
'babel-plugin-transform-typescript-metadata',
['@babel/plugin-transform-class-properties', { loose: true }]
```

**`App.tsx`** (primera línea del archivo):
```ts
import 'reflect-metadata';
```
