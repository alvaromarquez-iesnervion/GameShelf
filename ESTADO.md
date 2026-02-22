# GameShelf - Estado del Proyecto

## Última actualización
22 de Febrero de 2026 (Sesión 11 — Firebase activado)

## Resumen General

GameShelf es una aplicación móvil para gestionar bibliotecas de videojuegos unificando Steam, Epic Games Store, y otras plataformas. La aplicación incluye seguimiento de wishlist, compatibilidad ProtonDB, duración estimada (HLTB), y rastreo de ofertas (ITAD).

**Estado actual**: ✅ MVP Completo - Todas las capas arquitectónicas implementadas

---

## ⚠️ Configuración temporal para testing

**IMPORTANTE**: Los siguientes cambios son temporales para facilitar el testing y deben ser revertidos antes de producción.

### Cambios realizados

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `src/data/mocks/MockAuthRepository.ts` | `currentUser` inicializado con `MOCK_USER` en lugar de `null` | Sesión ya iniciada al arrancar |
| `src/data/mocks/MockAuthRepository.ts` | `logout()` y `deleteAccount()` mantienen sesión activa | Evitar tener que volver a loguear |
| `src/data/repositories/MemoryPlatformRepository.ts` | Mapa inicializado con Steam vinculado (SteamID: `76561198130408689`) | Steam ya vinculado al arrancar |
| `src/data/repositories/SteamSyncMemoryGameRepository.ts` | Constructor llama a `initializeForTesting()` | Biblioteca se precarga automáticamente |

### Usuario de testing

- **User ID**: `mock-uid-dev-001`
- **Email**: `dev@gameshelf.app`
- **Steam ID**: `76561198130408689`

### Cómo revertir

#### 1. `MockAuthRepository.ts`
```ts
// Cambiar:
private currentUser: User = MOCK_USER;

// A:
private currentUser: User | null = null;

// En logout() y deleteAccount(), cambiar:
this.currentUser = MOCK_USER;

// A:
this.currentUser = null;
```

#### 2. `MemoryPlatformRepository.ts`
```ts
// Cambiar constructor:
constructor() {
    this.platformsByUser = new Map([
        [TEST_USER_ID, [
            new LinkedPlatform(Platform.STEAM, TEST_STEAM_ID, new Date()),
        ]],
    ]);
}

// A:
constructor() {
    this.platformsByUser = new Map();
}
```

#### 3. `SteamSyncMemoryGameRepository.ts`
```ts
// Eliminar:
constructor(...) {
    ...
    this.initializeForTesting();
}

private async initializeForTesting(): Promise<void> { ... }

// Y añadir bandera initialized:
private initialized = false;

// Cambiar getLibraryGames para eliminar la llamada a initializeForTesting()
```

### Cuándo revertir

- Antes de hacer deploy a producción
- Cuando se implemente Firebase Auth real
- Cuando se quiera probar el flujo completo de registro/login/vinculación

---

## Arquitectura

El proyecto sigue **Clean Architecture** con **MVVM** para la capa de presentación:

```
GameShelf/
├── src/
│   ├── domain/          # Entidades, DTOs, interfaces de repositorios y servicios
│   ├── data/            # Implementaciones de repositorios y servicios de APIs
│   │   └── mocks/       # Datos de prueba para desarrollo offline
│   ├── di/              # Inversify container, hooks de inyección de dependencias
│   ├── core/            # Entry point App.tsx + navegación React Navigation
│   └── presentation/    # ViewModels (MobX), Screens, Componentes UI
└── index.ts            # Entry point con registerRootComponent
```

---

## Capas Implementadas

### ✅ Domain (Completa)
- **Entidades**: User, Game (con playtime/lastPlayed), LinkedPlatform, WishlistItem, Deal, GameDetail, ProtonDbRating, HltbResult, SearchResult, NotificationPreferences
- **DTOs**: GameDetailDTO, UserProfileDTO
- **Enums**: Platform (STEAM, EPIC_GAMES)
- **Interfaces**: 5 repositorios, 5 servicios externos, 7 use cases

### ✅ Data (Completa)
- **Configuración**: FirebaseConfig, ApiConstants
- **Mappers**: FirestoreGameMapper, FirestoreWishlistMapper
- **Repositorios**: Auth, Game, Wishlist, Platform, Notification
- **Servicios**: Steam API (requiere `EXPO_PUBLIC_STEAM_API_KEY`), Epic Games API, ProtonDB (real, activo — sin API key), HLTB (real, activo — sin API key), IsThereAnyDeal
- **Configuración**: FirebaseConfig, ApiConstants
- **Mappers**: FirestoreGameMapper, FirestoreWishlistMapper
- **Mocks**: 12 implementaciones mock con datos de prueba + MockDataProvider con datos semilla

### ✅ Dependency Injection (Completa)
- Contenedor Inversify con bindings para todos los repos, servicios, use cases y ViewModels
- Hook `useInjection` para acceder a dependencias desde componentes React
- Firebase activo: `AuthRepositoryImpl`, `WishlistRepositoryImpl`, `NotificationRepositoryImpl` enlazados cuando `EXPO_PUBLIC_FIREBASE_API_KEY` está presente
- Steam activo: `SteamApiServiceImpl` y repos en memoria cuando `EXPO_PUBLIC_STEAM_API_KEY` está presente

### ✅ Presentation (Completa)
- **8 ViewModels**: Auth, Library, Wishlist, Home, GameDetail, Search, PlatformLink, Settings
- **10 Screens**: Login, Register, Library, GameDetail, Wishlist, Search (Home), Settings, PlatformLink, NotificationSettings, Profile
- **Navegación**: React Navigation (NO Expo Router)
  - RootNavigator con Auth/Main tabs
  - Stacks: Auth, Library, Search, Wishlist, Settings
  - Bottom tab navigator con 3 tabs principales
- **Componentes UI**: Cards, Badges, Skeletons, ErrorMessage, EmptyState, LoadingSpinner, HomeGameCard
- **Tema**: Modo oscuro con paleta profesional (morado/indigo)

### ✅ Configuración (Completa)
- Expo SDK 54 sin Expo Router
- TypeScript strict mode
- Decoradores de Inversify configurados en Babel
- Entry point: `index.ts` con `registerRootComponent`

---

## Funcionalidades Implementadas

### Autenticación
- [x] Login con email/password
- [x] Registro de usuarios
- [x] Logout
- [x] Estado de autenticación persistente
- [x] Eliminación de cuenta

### Biblioteca
- [x] Lista de juegos de Steam y Epic
- [x] Búsqueda local en biblioteca
- [x] Sync de biblioteca (simulado con mocks)
- [x] Detalle de juego con covers
- [x] Grid layout responsive (3 columnas)

### Wishlist
- [x] Lista de juegos en wishlist
- [x] Agregar/quitar juegos
- [x] Indicador de mejor oferta disponible
- [x] Refresh pull-to-refresh

### Home / Descubrir
- [x] Sección "Continúa jugando" (juegos jugados últimas 2 semanas)
- [x] Sección "Tus más jugados" (top 5 por playtime)
- [x] Búsqueda en catálogo ITAD
- [x] Defer search (400ms)
- [x] Resultados con covers
- [x] Agregar a wishlist desde resultados

### Detalle de Juego
- [x] Cover a tamaño completo
- [x] Plataforma (badge)
- [x] Compatibilidad ProtonDB
- [x] Horas estimadas HLTB (main, main+extra, 100%)
- [x] Ofertas actuales de tiendas
- [x] Toggle wishlist

### Ajustes
- [x] Perfil de usuario
- [x] Plataformas vinculadas (Steam + Epic completamente funcionales)
- [x] Preferencias de notificaciones
- [x] Vincular/desvincular Steam vía SteamID/URL/vanity name
- [x] Vincular/desvincular Epic vía export GDPR JSON import

---

## Tecnologías Stack

- **Framework**: React Native 0.81.5 + Expo SDK 54
- **Estado**: MobX 6 + mobx-react-lite
- **Navegación**: React Navigation 7 (@react-navigation/native-stack, bottom-tabs)
- **Inyección de Dependencias**: Inversify 7
- **Imágenes**: expo-image
- **Backend**: Firebase JS SDK (Auth + Firestore)
- **APIs externas**: Axios para Steam, Epic, ProtonDB, HLTB, ITAD

---

## Cómo Ejecutar

### Requisitos
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app en tu dispositivo móvil

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd GameShelf

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional para mocks)
cp .env.example .env
# Editar .env con tus claves de Firebase si quieres usar datos reales

# Iniciar servidor de desarrollo
npx expo start
```

### Por defecto (Mocks)
Sin ninguna variable de entorno configurada, la app usa mocks para todo. Útil para desarrollo de UI sin necesidad de servicios externos.

### Usar datos reales
**Firebase (Auth + Firestore) — ACTIVO:**
- Proyecto `gameshelf-180a3` configurado en `.env`
- `AuthRepositoryImpl`, `WishlistRepositoryImpl` y `NotificationRepositoryImpl` se activan automáticamente cuando `EXPO_PUBLIC_FIREBASE_API_KEY` está presente
- `initializeFirebase()` se llama en `App.tsx` antes de montar el contenedor DI

**Steam API (real) — ACTIVO:**
1. `EXPO_PUBLIC_STEAM_API_KEY` presente en `.env`
2. El contenedor DI configura `SteamApiServiceImpl` automáticamente
3. Juegos y plataformas se guardan en memoria (sin Firestore por ahora)

---

## Datos de Prueba (Mocks)

### Juegos incluidos
**Steam**: Elden Ring, Cyberpunk 2077, Hades, Baldur's Gate 3, Hollow Knight, Stardew Valley
**Epic**: Death Stranding Director's Cut, Alan Wake 2

### Wishlist inicial
- Cyberpunk 2077 (60% off)
- Baldur's Gate 3 (sin oferta)

### Plataformas vinculadas
- Steam y Epic vinculados por defecto

---

## Configuración crítica (desde index.ts)

### React Navigation + Hermes compatibility

**`babel.config.js`** — Eliminado `@babel/plugin-transform-class-properties`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      // 'babel-plugin-transform-class-properties' // ❌ REMOVIDO — causa crash en Hermes con enums read-only
    ],
  };
};
```

**`index.ts`** — Primera importación + MobX config:
```ts
import 'reflect-metadata'; // Must be the very first import for Inversify
import { configure } from 'mobx';  // ❗ Agregado
import { registerRootComponent } from 'expo';
import App from './src/core/App';

// MobX config required for Hermes/React Native
configure({
  useProxies: 'never',   // ✅ Requerido
  enforceActions: 'never', // ✅ Requerido
});
```

**Versiones estabilizadas** (requisito para evitar crash):
- `react-native-gesture-handler`: `2.20.0+`
- `react-native-reanimated`: `3.10.0+`

---

## Decisiones Técnicas Clave

### ¿Por qué no Expo Router?
Se eliminó Expo Router porque la arquitectura Clean requiere navegación flexible con ViewModels. React Navigation permite mejor separación de concerns y es más maduro para arquitecturas complejas.

### ¿Por qué Firebase JS SDK y no @react-native-firebase?
El SDK de Firebase JS es compatible con Expo Go sin necesidad de EAS Build o custom dev client. Para el MVP esto acelera el desarrollo.

### ¿Por qué Inversify?
Inversify permite inyección de dependencias basada en decorators, manteniendo el código limpio y testeable. Alternativas como TSyringe o simples objetos singleton eran menos flexibles para testing.

### ¿Por qué MobX y no Redux/Zustand?
MobX con `makeAutoObservable` requiere menos boilerplate que Redux y tiene mejor integración con clases TypeScript (ViewModels) que Zustand.

### ¿Por qué ViewModels y no solo hooks?
Los ViewModels permiten lógica de negocio reutilizable y testeable independiente de React. Facilitan testing unitario sin necesidad de renderizar componentes.

---

## Próximos Pasos (Roadmap)

### Alta prioridad
- [ ] Testing end-to-end con datos reales de Firebase
- [ ] Implementación real de APIs externas (Steam/Epic OAuth)
- [ ] Push notifications para ofertas de wishlist
- [ ] Mejoras de UI/UX (animaciones, micro-interacciones)

### Media prioridad
- [ ] Soporte para más plataformas (GOG, Xbox, PlayStation)
- [ ] Filtros y ordenación en biblioteca
- [ ] Estadísticas de juego (tiempo jugado, logros)

### Baja prioridad
- [ ] Modo claro (tema oscuro actualmente hardcoded)
- [ ] Soporte offline completo con sincronización
- [ ] Widgets para iOS/Android

---

## Estructura de Archivos Clave

```
src/
├── domain/
│   ├── entities/           # User, Game, WishlistItem, etc.
│   ├── dtos/              # GameDetailDTO, UserProfileDTO
│   ├── interfaces/        # Repositorios y servicios
│   └── enums/             # Platform
├── data/
│   ├── mocks/             # Mock implementations
│   ├── repositories/      # Implementaciones Firebase
│   ├── services/          # APIs externas
│   ├── mappers/           # Firestore mappers
│   └── config/            # FirebaseConfig, ApiConstants
├── di/
│   ├── container.ts       # Inversify bindings
│   ├── types.ts           # Símbolos de DI
│   └── hooks/
│       └── useInjection.ts
├── core/
│   ├── App.tsx            # Entry point de la app
│   ├── navigation/        # Stacks y navigators
│   │   ├── RootNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── LibraryStack.tsx
│   │   ├── SearchStack.tsx
│   │   ├── WishlistStack.tsx
│   │   └── SettingsStack.tsx
│   └── navigationTypes.ts # Tipos de navegación
└── presentation/
    ├── viewmodels/        # 7 ViewModels MobX
    ├── screens/           # 10 screens
    ├── components/        # UI components
    │   ├── common/        # Buttons, Inputs, Skeletons
    │   ├── games/         # GameCard, DealCard, etc.
    │   └── platforms/     # PlatformBadge
    └── theme/             # Colors, typography, spacing
```

---

## Notas de Desarrollo

### Convenciones
- **Estado privado**: Usar `_` prefix para campos privados en ViewModels (`_isLoading`)
- **Getters**: Usar `get isLoading()` para exponer estado
- **Mutaciones**: Siempre usar `runInAction()` cuando se modifica estado observable
- **Entidades**: Campos privados + métodos getter (`getTitle()`, `getId()`)
- **DTOs**: Campos `readonly` públicos
- **Navegación**: Tipos en `navigationTypes.ts`, nombres de pantallas en PascalCase

### Testing
Actualmente no hay tests implementados. El stack de testing recomendado sería:
- **Unit**: Jest + React Native Testing Library para ViewModels
- **E2E**: Detox o Maestro para flujos completos

### Build para Producción
```bash
# Android
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# iOS (requiere Mac + Xcode)
npx expo prebuild --platform ios
cd ios && xcodebuild -scheme GameShelf -configuration Release
```

---

## Contacto y Soporte

Para reportar bugs o solicitar features, usar el issue tracker del repositorio.

**Stack principal**: React Native + TypeScript + MobX + Firebase + Inversify
