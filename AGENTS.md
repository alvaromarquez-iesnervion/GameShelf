# GameShelf — Agent Context

React Native + Expo SDK 54 (TypeScript). Clean Architecture + MVVM. State: MobX 6. DI: Inversify 7. Navigation: React Navigation 7 (**NOT** Expo Router — `src/app/` is dead scaffold, ignore it).

## Commands

```bash
npx expo start            # Dev server
npm run lint              # ESLint (flat config via eslint-config-expo)
npx tsc --noEmit          # Type-check
```

No test suite. Copy `.env.example` → `.env` before running in production mode.

## Layer Structure & Dependency Rules

```
src/
├── domain/        # Pure TS — entities, enums, DTOs, interfaces, use cases
├── data/          # Infrastructure — repos, GameShelf API client, Firestore mappers
├── di/            # Inversify container (container.ts), TYPES symbols, useInjection hook
├── presentation/  # MobX ViewModels, screens, UI components, theme
└── core/          # App.tsx entry + React Navigation stacks/tabs
```

**Dependency flow:** `core` → `presentation` → `domain` ← `data`.  
`domain/` must NEVER import from `data/`, `di/`, or `presentation/`.

New code locations: entity/interface/use case → `domain/`; Firebase/API call → `data/`; ViewModel/screen → `presentation/`; navigator → `core/navigation/`; DI binding → `di/container.ts` + symbol in `src/di/types.ts`.

## Critical Rules — Do Not Break

### Entry Point (`index.ts`)
```ts
import 'reflect-metadata'; // MUST be first import — Inversify requires it
import { configure } from 'mobx';
configure({ useProxies: 'never', enforceActions: 'never' }); // Required for Hermes
```

### Babel
`babel.config.js` must NOT include `@babel/plugin-transform-class-properties` — crashes Hermes with read-only enums. Required plugins: `babel-plugin-transform-typescript-metadata` + `@babel/plugin-proposal-decorators` (`{ legacy: true }`).

### MobX + class inheritance (runtime crash)
`makeAutoObservable()` **throws at runtime** when the class has a superclass. ViewModels must NOT extend a base class. Use the standalone `withLoading()` helper from `BaseViewModel.ts`.

### Hooks ordering in observer() components
All `useCallback`/`useState`/`useRef` hooks must be declared **before** any conditional `return`.

## Dependency Injection

All bindings in `src/di/container.ts`. Add a symbol to `src/di/types.ts` for every new injectable.

**Repositories, services, ViewModels** (`data/` and `presentation/`):
1. Decorate class with `@injectable()`.
2. Decorate constructor params with `@inject(TYPES.X)`.
3. Add symbol to `src/di/types.ts`.
4. Bind in `container.ts`.

**Use cases** (`domain/` — pure TypeScript, zero DI decorators):
```ts
// container.ts — .inSingletonScope() is required; toDynamicValue does NOT inherit defaultScope
container.bind<IMyUseCase>(TYPES.IMyUseCase)
  .toDynamicValue(ctx => new MyUseCase(
    ctx.get<IDep>(TYPES.IDep),
  )).inSingletonScope();
```

**Scopes:** Repos, services, use cases → **Singleton**. ViewModels `Auth/Library/Wishlist/Home` → **Singleton**. ViewModels `GameDetail/Search/PlatformLink/Settings/Profile` → **Transient** (new instance per component via `useInjection`).

**`AuthViewModel` is intentionally use-case-free** — it depends directly on `IAuthRepository`.

## Operation Modes

| Mode | Condition | Repos / Services |
|---|---|---|
| **Production** | `EXPO_PUBLIC_FIREBASE_API_KEY` set | Real repos + Firebase auth; guests use AsyncStorage locally |
| **Mock** (legacy) | No env vars | All mocks from `src/data/mocks/` |

The project runs in **Production mode**. Mock fallback is legacy scaffolding not actively supported.

## External API Constraints

| Service | Gotcha |
|---|---|
| ProtonDB | Requires `User-Agent` + `Referer` headers or requests are blocked |
| HLTB | Must `GET /api/finder/init?t={timestamp}` first to get session token, then `POST /api/finder` with `x-auth-token`. Token auto-refreshes on 403 |
| Epic Auth | Uses `launcherAppClient2` credentials (publicly known). Auth Code flow preferred; GDPR JSON import is fallback tab |
| Buffer | `Buffer` does not exist in Hermes/JSC. Use `btoa()` instead of `Buffer.from(...).toString('base64')` |

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Interfaces / DI symbols | `I` prefix | `IGameRepository`, `TYPES.IGameRepository` |
| ViewModel fields | `_` prefix + public getter | `_isLoading` / `get isLoading()` |
| Entities | PascalCase, getters as methods | `game.getTitle()`, `game.getId()` |
| DTOs | PascalCase, `readonly` public fields | `GameDetailDTO` |
| Screens / ViewModels / Use cases | `PascalCaseScreen/ViewModel/UseCase.tsx/ts` | `GameDetailScreen.tsx` |

## Error Handling

- ViewModels catch all async errors; expose `_error: string | null` with a `clearError()` method.
- Use `Promise.allSettled` when fetching from multiple independent sources (ProtonDB, HLTB, ITAD) so one failure doesn't abort the rest. See `GameDetailUseCase` and `WishlistUseCase`.
- Never surface raw Error objects to the UI — convert to strings inside `runInAction`.

## Imports

- `import 'reflect-metadata'` is always first in `index.ts` only.
- No barrel `index.ts` re-exports (each file imported directly).
- Path alias `@/` → repo root, configured in `tsconfig.json`: `import { colors } from '@/presentation/theme/colors'`.

## Mocks — Read-Only Historical Artifacts

`src/data/mocks/` exists **for traceability only**. Do NOT modify, add to, or reference mocks when fixing bugs or adding features. All real implementations are in `src/data/repositories/` and `src/data/services/`.

## Documentation & Version Control

After every significant change, update ALL affected `.md` files:
- `MEMORY.md` — session change log (append, most recent first; never rewrite history)
- `ESTADO.md` — overall project status
- Layer docs (`DOMAIN.md`, `DATA.md`, `DI.md`, `PRESENTATION.md`) when their layer changes

**MEMORY.md maintenance:** Compact when >300 lines by merging related sessions and removing redundant file lists, preserving architectural decisions.

Commit and push to `feat/gameshelf-api-migration`.

## Branching Strategy

All work on `feat/gameshelf-api-migration` branch (tracks migration to unified GameShelf API backend). Push and open PR targeting this branch.

```bash
git checkout feat/gameshelf-api-migration
git pull origin feat/gameshelf-api-migration
git checkout -b <feature-or-fix-branch>
```

## Other Instruction Sources

- `CLAUDE.md` — condensed version with external API notes and quick reference commands
- Layer-specific docs: `src/domain/DOMAIN.md`, `src/data/DATA.md`, `src/di/DI.md`, `src/presentation/PRESENTATION.md`, `src/core/APP.md`
- `KNOWN_ISSUES.md` — tracked issues
- `gameshelf-api-plan.md` — backend migration plan
