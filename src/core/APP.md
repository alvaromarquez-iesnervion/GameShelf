# Core Layer (App Entry Point & Navigation)

## Purpose

Manages app initialization and navigation between screens using **React Navigation**. Contains no business logic and no direct data access. Defines the stack/tab structure and routes to `presentation/` screens.

Depends on `presentation/` (renders its screens) and `di/` (reads `AuthViewModel` in `RootNavigator`).

---

## Files

| File | Responsibility |
|---|---|
| `App.tsx` | App entry point. Initializes Firebase, wraps with `NavigationContainer` + `SafeAreaProvider`, renders `RootNavigator`. |
| `navigation/RootNavigator.tsx` | Observes `AuthViewModel.isAuthenticated` and renders `AuthStack` or `MainTabNavigator`. Also triggers `LibraryViewModel.autoSyncIfNeeded()` once per session on login. |
| `navigation/AuthStack.tsx` | Stack: Login → Register → ForgotPassword |
| `navigation/MainTabNavigator.tsx` | Bottom tabs: Search/Home, Library, Settings. Wishlist accessible via header icon. |
| `navigation/LibraryStack.tsx` | Stack: LibraryScreen → GameDetailScreen |
| `navigation/SearchStack.tsx` | Stack: SearchScreen → GameDetailScreen |
| `navigation/WishlistStack.tsx` | Stack: WishlistScreen → GameDetailScreen |
| `navigation/SettingsStack.tsx` | Stack: SettingsScreen → PlatformLink / NotificationSettings / Profile |
| `navigation/navigationTypes.ts` | Typed route param lists for all stacks |

---

## Navigation Tree

```
RootNavigator (observer)
├── isAuthenticated === false → AuthStack
│   ├── Login          [initial]
│   ├── Register
│   └── ForgotPassword
│
└── isAuthenticated === true → MainTabNavigator
    ├── [Tab] Search → SearchStack
    │   ├── SearchScreen    [initial]
    │   └── GameDetail      { gameId: string }
    │
    ├── [Tab] Library → LibraryStack
    │   ├── LibraryScreen   [initial]
    │   └── GameDetail      { gameId: string }
    │
    ├── [Tab] Settings → SettingsStack
    │   ├── SettingsScreen  [initial]
    │   ├── PlatformLink
    │   ├── NotificationSettings
    │   └── Profile
    │
    └── [Header icon] WishlistStack (modal)
        ├── WishlistScreen  [initial]
        └── GameDetail      { gameId: string }
```

`WishlistStack` is presented as a modal (header icon), not as a tab.  
`GameDetailScreen` is registered in three separate stacks (Search, Library, Wishlist). Each stack maintains its own navigation history.

---

## `App.tsx` — Initialization Order

```tsx
// index.ts (NOT App.tsx) — must be absolutely first:
import 'reflect-metadata';
import { configure } from 'mobx';
configure({ useProxies: 'never', enforceActions: 'never' });

// App.tsx — initialization order matters:
export default function App() {
  // 1. Firebase is initialized before the container is imported
  //    (initializeFirebase() is called conditionally — only when EXPO_PUBLIC_FIREBASE_API_KEY is set)

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={darkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

> `reflect-metadata` must be the **first import in `index.ts`**, not in `App.tsx`. Moving it will cause Inversify to fail at runtime.

---

## `RootNavigator.tsx`

Observes `AuthViewModel.isAuthenticated` (MobX singleton) to decide which stack to render. On login, triggers library auto-sync once per session via a `syncStartedRef` guard.

```tsx
const RootNavigator = observer(() => {
  const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
  const libraryVm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
  const syncStartedRef = useRef(false);

  useEffect(() => { authVm.checkAuthState(); }, []);

  useEffect(() => {
    if (authVm.isAuthenticated && authVm.currentUser && !syncStartedRef.current) {
      syncStartedRef.current = true;
      libraryVm.autoSyncIfNeeded(authVm.currentUser.getId());
    }
    if (!authVm.isAuthenticated) {
      syncStartedRef.current = false; // reset for next login
    }
  }, [authVm.isAuthenticated]);

  return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
```

---

## `navigationTypes.ts` — Typed Route Params

Provides strong typing for `navigation.navigate()` and `route.params`:

```ts
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
  GameDetail: { gameId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  GameDetail: { gameId: string };
};

export type WishlistStackParamList = {
  Wishlist: undefined;
  GameDetail: { gameId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  PlatformLink: undefined;
  NotificationSettings: undefined;
  Profile: undefined;
};
```

---

## Adding a New Screen

1. Add the route to the appropriate `ParamList` type in `navigationTypes.ts`.
2. Register the `<Stack.Screen>` in the relevant stack file.
3. Create the screen component in `presentation/screens/`.
4. If the screen needs a new ViewModel, add it in `presentation/viewmodels/` and register it in `di/container.ts` + `di/types.ts`.
