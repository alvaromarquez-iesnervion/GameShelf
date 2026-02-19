# GameShelf — Contexto para agentes

## Overview

App móvil React Native (TypeScript) que unifica bibliotecas de videojuegos (Steam, Epic) en una sola interfaz. Incluye wishlist, ofertas (ITAD), compatibilidad Linux/Deck (ProtonDB) y duración estimada (HLTB).

Arquitectura: **Clean Architecture + MVVM**. Estado reactivo: **MobX**. DI: **Inversify**. Navegación: **React Navigation** (NO Expo Router).

---

## Arquitectura y responsabilidades por capa

```
src/
├── domain/        # Núcleo. Sin dependencias externas. TypeScript puro.
│                  # Entidades, enums, DTOs, interfaces de repos/servicios/usecases,
│                  # implementaciones de use cases.
├── data/          # Infraestructura. Implementa interfaces de domain/.
│                  # Repos Firebase, servicios de APIs externas, mappers, mocks.
├── di/            # Inversify container, símbolos TYPES, hook useInjection.
├── presentation/  # ViewModels (MobX), screens, componentes UI, tema.
└── core/          # App.tsx (entry point) + navegación (React Navigation).
```

**Flujo de dependencias:** `core` → `presentation` → `domain` ← `data`. Ninguna capa interna importa de una capa externa.

**¿En qué capa va lo nuevo?**
- Nueva entidad / interfaz / use case → `domain/`
- Nueva llamada a Firebase o API externa → `data/`
- Nuevo ViewModel o pantalla → `presentation/`
- Nuevo navigator o stack → `core/navigation/`
- Nuevo binding DI → `di/container.ts`

**Documentación detallada por capa:**
- `src/domain/DOMAIN.md` — entidades, DTOs, interfaces y use cases
- `src/data/DATA.md` — repositorios, servicios, mappers, mocks y config
- `src/di/DI.md` — container, símbolos TYPES, scopes y hook useInjection
- `src/presentation/PRESENTATION.md` — ViewModels, screens, componentes y tema

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React Native + Expo SDK | 54 | Framework base |
| TypeScript | 5.9 | Tipado estático (strict) |
| MobX + mobx-react-lite | 6 | Estado reactivo en ViewModels |
| React Navigation | 7 | Navegación (native-stack + bottom-tabs) |
| Inversify + reflect-metadata | 7 | Inyección de dependencias |
| Firebase JS SDK | Latest | Auth + Firestore (NO @react-native-firebase) |
| Axios | Latest | HTTP (Steam, ProtonDB, HLTB, ITAD) |
| expo-image | Latest | Renderizado de imágenes |

---

## Reglas críticas — NO romper

### Documentación y control de versiones

- **Actualizar documentación**: Tras cada cambio significativo en el código, actualizar TODOS los archivos `.md` afectados:
  - `MEMORY.md` — registro de cambios de la sesión
  - `src/domain/DOMAIN.md` — si se añaden/modifican entidades, interfaces o use cases
  - `src/data/DATA.md` — si se añaden/modifican repositorios, servicios o mappers
  - `src/di/DI.md` — si se añaden/modifican bindings o scopes
  - `src/presentation/PRESENTATION.md` — si se añaden/modifican ViewModels, screens o componentes
  - `ESTADO.md` — si cambian funcionalidades o estado general del proyecto

- **Commit y push**: Tras completar cada tarea o conjunto de cambios, hacer commit y push al repositorio main. El mensaje de commit debe describir brevemente los cambios realizados.

### Imports
- `import 'reflect-metadata'` debe ser el **primer import** en `index.ts`. Obligatorio para Inversify. Si se mueve, el contenedor DI falla en runtime.

### MobX + Hermes
- En `index.ts`, antes de montar la app:
  ```ts
  configure({ useProxies: 'never', enforceActions: 'never' });
  ```
- Todas las mutaciones de estado observable **dentro de `runInAction()`**.
- ViewModels usan `makeAutoObservable(this)` en el constructor.
- **No usar Proxy-based observables** — Hermes no los soporta.

### Babel + Decoradores
- `babel.config.js` **no debe incluir** `@babel/plugin-transform-class-properties`. Causa crash en Hermes con enums read-only.
- Plugins requeridos: `babel-plugin-transform-typescript-metadata` + `@babel/plugin-proposal-decorators` con `{ legacy: true }`.

### Navegación
- **No usar Expo Router**. El proyecto usa React Navigation con `registerRootComponent` en `index.ts`.
- Entry point: `index.ts` → `App.tsx` (en `src/core/`).

### Arquitectura
- `domain/` no puede importar de `data/`, `di/` ni `presentation/`.
- No instanciar repositorios o servicios manualmente. Siempre vía `useInjection(TYPES.X)`.
- No existe `AuthUseCase`. `AuthViewModel` depende directamente de `IAuthRepository`.

---

## Dependency Injection

Todo pasa por `src/di/container.ts`. Al añadir cualquier clase nueva:
1. Decorar con `@injectable()`.
2. Decorar parámetros del constructor con `@inject(TYPES.X)`.
3. Añadir el símbolo en `src/di/types.ts`.
4. Registrar el binding en `container.ts`.

Repositorios, servicios y use cases → **SINGLETON**. ViewModels: `Auth`, `Library`, `Wishlist` → **SINGLETON**; `GameDetail`, `Search`, `PlatformLink`, `Settings` → **TRANSIENT**.

> Ver scopes detallados y el hook `useInjection` en `src/di/DI.md`.

---

## Mocks vs Real

**Por defecto (desarrollo):** todos los repositorios y servicios usan mocks (`EXPO_PUBLIC_USE_MOCKS !== 'false'`). No se necesitan claves ni Firebase.

**Steam API real:** requiere `EXPO_PUBLIC_STEAM_API_KEY` en `.env`. Con la clave presente, el contenedor enlaza `SteamApiServiceImpl` en lugar del mock.

**Firebase real:** requiere todas las variables `EXPO_PUBLIC_FIREBASE_*` en `.env` y cambiar los bindings de repositorios en `container.ts` a las implementaciones reales (AuthRepositoryImpl, etc.).

Los mocks están en `src/data/mocks/`. Implementan las mismas interfaces que las implementaciones reales — son intercambiables en el contenedor.

---

## Convenciones de código

**ViewModels:** campos privados con prefijo `_`, getters públicos, mutaciones en `runInAction()`. Ver patrón completo en `src/presentation/PRESENTATION.md`.

**Entidades (`domain/`):** campos `private` + métodos getter (`getId()`, `getTitle()`). Sin decoradores de frameworks.

**DTOs (`domain/dtos/`):** campos `readonly` públicos. Solo cuando agregan datos de múltiples fuentes.

**Vistas (`screens/`):** envueltas en `observer()`, obtienen ViewModel vía `useInjection(TYPES.XViewModel)`, sin lógica de negocio.

**Mappers:** solo Firestore tiene archivos separados (bidireccionales, reutilizados). Los de APIs externas son métodos privados dentro de su `ServiceImpl`.

---

## Estado actual

- Mocks activos por defecto. Firebase y Steam opcionales (requieren `.env`).
- No hay tests implementados.
- `src/app/` contiene el scaffold original de Expo Router — ignorar, no forma parte de la arquitectura activa.
