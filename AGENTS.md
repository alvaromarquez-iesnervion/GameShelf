# GameShelf — Agent Context

## Overview

React Native + Expo SDK 54 mobile app (TypeScript) that unifies game libraries (Steam, Epic Games) with wishlist, deals (ITAD), Linux/Deck compatibility (ProtonDB), and playtime estimates (HLTB).

Architecture: **Clean Architecture + MVVM**. Reactive state: **MobX 6**. DI: **Inversify 7**. Navigation: **React Navigation 7** (NOT Expo Router).

---

## Build / Lint / Run Commands

```bash
npx expo start          # Start dev server (Expo Go / dev client)
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npm run lint            # ESLint via expo lint (eslint-config-expo, flat config)
npx tsc --noEmit        # Type-check without building
```

**No test suite exists.** Jest is not configured. To add tests: install `jest`, `jest-expo`, `@testing-library/react-native` and create `jest.config.js`. No test commands exist yet.

---

## Layer Structure & Dependency Rules

```
src/
├── domain/        # Pure TypeScript. Entities, enums, DTOs, interfaces, use cases.
├── data/          # Infrastructure. Firebase repos, API services, mappers, mocks.
├── di/            # Inversify container, TYPES symbols, useInjection hook.
├── presentation/  # MobX ViewModels, screens, UI components, theme.
└── core/          # App.tsx entry point + React Navigation stacks/tabs.
```

**Dependency flow:** `core` → `presentation` → `domain` ← `data`.  
`domain/` must NEVER import from `data/`, `di/`, or `presentation/`.

**Where does new code go?**
- New entity / interface / use case → `domain/`
- Firebase call or external API → `data/`
- New ViewModel or screen → `presentation/`
- New navigator/stack → `core/navigation/`
- New DI binding → `di/container.ts`

**Layer docs:** `src/domain/DOMAIN.md`, `src/data/DATA.md`, `src/di/DI.md`, `src/presentation/PRESENTATION.md`

---

## Critical Rules — Do Not Break

### Entry Point & MobX/Hermes Setup (`index.ts`)
```ts
import 'reflect-metadata';            // MUST be first import — Inversify requires it
import { configure } from 'mobx';
configure({ useProxies: 'never', enforceActions: 'never' }); // Required for Hermes
```

### Babel
- `babel.config.js` must NOT include `@babel/plugin-transform-class-properties` — crashes Hermes with read-only enums.
- Required plugins: `babel-plugin-transform-typescript-metadata` + `@babel/plugin-proposal-decorators` (`{ legacy: true }`).

### Navigation
- Do NOT use Expo Router. `src/app/` is dead scaffold — ignore it.
- Entry: `index.ts` → `registerRootComponent(App)` → `src/core/App.tsx`.

---

## Dependency Injection

All bindings live in `src/di/container.ts`. Add a symbol to `src/di/types.ts` for every new injectable.

**Repositories, services, ViewModels** (`data/` and `presentation/`):
1. Decorate class with `@injectable()`.
2. Decorate constructor params with `@inject(TYPES.X)`.
3. Add symbol to `src/di/types.ts`.
4. Bind in `container.ts` with `.to(Class)`.

**Use cases** (`domain/` — pure TypeScript, zero DI decorators):
```ts
// container.ts
container.bind<IMyUseCase>(TYPES.IMyUseCase)
  .toDynamicValue(ctx => new MyUseCase(
    ctx.get<IDep>(TYPES.IDep),
  ))
  .inSingletonScope(); // toDynamicValue does NOT inherit defaultScope
```

**Scopes:** Repos, services, use cases → **Singleton**. ViewModels `Auth/Library/Wishlist/Home` → **Singleton**. ViewModels `GameDetail/Search/PlatformLink/Settings` → **Transient** (new instance per component via `useInjection`).

**`AuthViewModel` is intentionally use-case-free** — it depends directly on `IAuthRepository`.

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Interfaces | `I` prefix | `IGameRepository`, `IAuthRepository` |
| DI symbols | `I` prefix | `TYPES.IGameRepository` |
| ViewModel fields | `_` prefix (private) + public getter | `_isLoading` / `get isLoading()` |
| Entities | PascalCase, getters as methods | `game.getTitle()`, `game.getId()` |
| DTOs | PascalCase, `readonly` public fields | `GameDetailDTO`, `UserProfileDTO` |
| Screens | `PascalCaseScreen.tsx` | `GameDetailScreen.tsx` |
| ViewModels | `PascalCaseViewModel.ts` | `LibraryViewModel.ts` |
| Use cases | `PascalCaseUseCase.ts` | `WishlistUseCase.ts` |
| Mocks | `MockPascalCase.ts` | `MockGameRepository.ts` |
| Mappers | `FirestorePascalCaseMapper.ts` | `FirestoreGameMapper.ts` |
| Enums | SCREAMING_SNAKE_VALUE | `Platform.STEAM`, `Platform.EPIC_GAMES` |

---

## Code Style Patterns

### Entity (`domain/entities/`)
```ts
export class Game {
  constructor(
    private readonly _id: string,
    private _title: string,
  ) {}
  getId(): string { return this._id; }
  getTitle(): string { return this._title; }
}
```

### ViewModel (`presentation/viewmodels/`)
```ts
@injectable()
export class FooViewModel {
  private _items: Item[] = [];
  private _isLoading = false;
  private _error: string | null = null;

  constructor(@inject(TYPES.IFooUseCase) private readonly _useCase: IFooUseCase) {
    makeAutoObservable(this);
  }

  get items() { return this._items; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }

  async loadItems(): Promise<void> {
    runInAction(() => { this._isLoading = true; this._error = null; });
    try {
      const result = await this._useCase.getItems();
      runInAction(() => { this._items = result; });
    } catch (e) {
      runInAction(() => { this._error = e instanceof Error ? e.message : 'Error'; });
    } finally {
      runInAction(() => { this._isLoading = false; });
    }
  }
}
```

### Screen (`presentation/screens/`)
```ts
const FooScreen = observer(() => {
  const vm = useInjection<FooViewModel>(TYPES.FooViewModel);
  // No business logic here — delegate everything to ViewModel
  return <View>...</View>;
});
export default FooScreen;
```

### Use Case (`domain/usecases/`)
```ts
// No @injectable, no @inject, no TYPES imports
export class FooUseCase implements IFooUseCase {
  constructor(
    private readonly _repo: IFooRepository,
    private readonly _service: IFooService,
  ) {}
  async execute(): Promise<Result> { ... }
}
```

---

## Error Handling

- ViewModels catch all async errors; expose `_error: string | null` with a `clearError()` method.
- Use `Promise.allSettled` when fetching from multiple independent sources (ProtonDB, HLTB, ITAD) so one failure doesn't abort the rest. See `GameDetailUseCase` and `WishlistUseCase`.
- Never surface raw Error objects to the UI — convert to strings inside `runInAction`.
- Services/repos may throw; use cases and ViewModels are responsible for catching.

---

## Imports

- `import 'reflect-metadata'` is always first in `index.ts` only.
- No barrel `index.ts` re-exports (each file imported directly).
- Prefer named imports over default for non-component modules.
- Theme: `import { colors } from '@/presentation/theme/colors'` (path alias `@/` → repo root).

---

## Mocks — Read-Only Historical Artifacts

`src/data/mocks/` exists **for traceability only** — it documents the fake implementations used during early UI development. **Mocks are not used in the app and must not be touched.**

### What "not used" means in practice
- Do NOT modify any file under `src/data/mocks/`.
- Do NOT add new mocks.
- Do NOT reference mocks when fixing bugs or adding features — always work on the real implementations in `src/data/repositories/` and `src/data/services/`.
- If a bug appears that seems to affect mock data, the actual fix belongs in the real repository or service, not in the mock.

### Active operation modes (all use real implementations)
The app selects its implementation set at startup based on env vars (`src/di/container.ts`):

| Mode | Condition | Repos / Services |
|---|---|---|
| **Production** | Firebase + Steam keys set | `GameRepositoryImpl`, `AuthRepositoryImpl`, `WishlistRepositoryImpl`, `PlatformRepositoryImpl`, `NotificationRepositoryImpl`, `SteamApiServiceImpl` |
| **Steam without Firebase** | Only Steam key set | `SteamSyncMemoryGameRepository`, `MemoryPlatformRepository`, `SteamApiServiceImpl`; Auth/Wishlist/Notifications → mocks (legacy, pending removal) |
| **No keys** | No env vars | All mocks active (legacy fallback — not a supported mode) |

The project runs in **Production mode**. All env vars are configured. The mock fallback in `container.ts` is legacy scaffolding that has not been removed yet.

---

## Documentation & Version Control

After every significant change, update ALL affected `.md` files:
- `MEMORY.md` — session change log (append, do not rewrite history)
- `ESTADO.md` — overall project status
- Layer docs (`DOMAIN.md`, `DATA.md`, `DI.md`, `PRESENTATION.md`) — when their layer changes

**MEMORY.md maintenance:**
- At the end of EVERY session, verify that all changes made in that session are documented in MEMORY.md.
- If MEMORY.md becomes too large (>300 lines or multiple sessions are documented with excessive detail), compact it by:
  1. Merging related Session entries that are part of the same feature/refactor
  2. Removing redundant file lists when the pattern is clear
  3. Keeping architectural decisions intact (never remove)
  4. Preserving the chronological order (most recent first)
- The goal is to maintain a clear, scannable history without losing critical context.

Then commit and push to `main`. Commit messages should briefly describe what changed.
