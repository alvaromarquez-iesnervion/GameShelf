# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For the full agent context (naming conventions, code patterns, DI rules, mock policy), read `AGENTS.md`.
> Layer-specific docs: `src/domain/DOMAIN.md`, `src/data/DATA.md`, `src/di/DI.md`, `src/presentation/PRESENTATION.md`, `src/core/APP.md`.
> Open issues: `KNOWN_ISSUES.md`. Project status: `ESTADO.md`. Session history: `MEMORY.md`.

---

## Commands

```bash
npx expo start            # Start dev server (Expo Go)
npx expo start --android  # Android emulator
npx expo start --ios      # iOS simulator
npm run lint              # ESLint (flat config via eslint-config-expo)
npx tsc --noEmit          # Type-check without building
```

**No test suite.** Jest is not configured.

Environment: copy `.env.example` → `.env` and fill in keys before starting in production mode.

---

## Architecture

React Native + Expo SDK 54 (TypeScript). Clean Architecture + MVVM. State: MobX 6. DI: Inversify 7. Navigation: React Navigation 7 (NOT Expo Router — `src/app/` is dead scaffold, ignore it).

```
src/
├── domain/        # Pure TS — entities, enums, DTOs, interfaces, use cases
├── data/          # Infrastructure — Firebase repos, API services, Firestore mappers, mocks
├── di/            # Inversify container (container.ts), TYPES symbols, useInjection hook
├── presentation/  # MobX ViewModels, screens, UI components, theme (colors/typography/spacing)
└── core/          # App.tsx entry + React Navigation stacks/tabs
```

**Dependency flow:** `core` → `presentation` → `domain` ← `data`.
`domain/` must never import from `data/`, `di/`, or `presentation/`.

Entry point: `index.ts` → `registerRootComponent(App)` → `src/core/App.tsx`.

---

## Critical Constraints

### index.ts — must be first two imports
```ts
import 'reflect-metadata';   // Inversify requires this as the very first import
import { configure } from 'mobx';
configure({ useProxies: 'never', enforceActions: 'never' }); // Required for Hermes
```

### Babel
- `babel.config.js` must NOT include `@babel/plugin-transform-class-properties` — crashes Hermes with read-only enums. The package exists in devDependencies but is intentionally absent from the config.

### MobX + class inheritance
- `makeAutoObservable()` throws at runtime when the class has a superclass. ViewModels must NOT extend a base class. Use the standalone `withLoading()` helper from `BaseViewModel.ts` instead.

### Hooks in observer() components
- All `useCallback`/`useState`/`useRef` hooks must be declared **before** any conditional `return`. Early returns must appear just before the final JSX return.

### DI — use cases
- Use cases in `domain/` are plain TypeScript — no `@injectable`, `@inject`, or `TYPES` imports.
- Bind them in `container.ts` with `.toDynamicValue(ctx => new MyUseCase(...)).inSingletonScope()`. The `.inSingletonScope()` is required — `toDynamicValue` does not inherit the container's default scope.

### Mocks are read-only
`src/data/mocks/` is historical scaffolding. Never modify or reference mocks when fixing bugs. All real implementations are in `src/data/repositories/` and `src/data/services/`.

---

## External API Notes

| Service | Key constraint |
|---|---|
| ProtonDB | Requires `User-Agent` + `Referer` headers or requests are blocked |
| HLTB | Must `GET /api/finder/init?t={timestamp}` first to get session token, then `POST /api/finder` with `x-auth-token`. Token auto-refreshes on 403 |
| Epic Auth | Uses `launcherAppClient2` credentials (publicly known). Auth Code flow preferred; GDPR JSON import is the fallback tab |
| Buffer | `Buffer` does not exist in Hermes/JSC. Use `btoa()` instead of `Buffer.from(...).toString('base64')` |

---

## DI Modes (container.ts)

| Mode | Condition |
|---|---|
| **Production** | `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_STEAM_API_KEY` set — all real repos/services |
| **Steam-only** | Only Steam key set — in-memory repos, real Steam API |
| **No keys** | All mocks active (legacy fallback) |

The app currently runs in **Production mode**.

---

## Documentation Maintenance

After every significant change update:
- `MEMORY.md` — append session change log (most recent first, never rewrite history)
- `ESTADO.md` — overall project status
- Relevant layer doc (`DOMAIN.md`, `DATA.md`, `DI.md`, `PRESENTATION.md`) when its layer changes
