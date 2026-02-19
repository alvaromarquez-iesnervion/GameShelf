# App — Navegación y punto de entrada

## Propósito

Gestiona la navegación entre pantallas usando **React Navigation**. No contiene lógica de negocio ni acceso a datos. Solo define la estructura de stacks/tabs y redirige a las vistas de `presentation/`.

Depende de `presentation/` (renderiza sus vistas) y de `di/` (para leer `AuthViewModel` en el `RootNavigator`).

---

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `App.tsx` | Punto de entrada. Inicializa Firebase, proveedores y renderiza `RootNavigator` |
| `navigation/RootNavigator.tsx` | Decide Auth vs Main según `AuthViewModel.isAuthenticated` |
| `navigation/AuthStack.tsx` | Stack de login y registro |
| `navigation/MainTabNavigator.tsx` | Bottom tabs: Búsqueda, Biblioteca, Ajustes |
| `navigation/LibraryStack.tsx` | Stack: LibraryScreen → GameDetailScreen |
| `navigation/SearchStack.tsx` | Stack: SearchScreen → GameDetailScreen |
| `navigation/SettingsStack.tsx` | Stack: SettingsScreen → PlatformLink / Notifications / Profile |
| `navigation/WishlistStack.tsx` | Stack: WishlistScreen → GameDetailScreen (acceso desde header) |
| `navigation/navigationTypes.ts` | Tipado fuerte de parámetros de navegación |

---

## Árbol de navegación

```
RootNavigator
├── (isAuthenticated === false) AuthStack
│   ├── LoginScreen        [initial]
│   └── RegisterScreen
│
└── (isAuthenticated === true) MainTabNavigator
    ├── [Tab] Búsqueda → SearchStack
    │   ├── SearchScreen   [initial]
    │   └── GameDetailScreen  { gameId: string }
    │
    ├── [Tab] Biblioteca → LibraryStack
    │   ├── LibraryScreen  [initial]
    │   └── GameDetailScreen  { gameId: string }
    │
    ├── [Tab] Ajustes → SettingsStack
    │   ├── SettingsScreen      [initial]
    │   ├── PlatformLinkScreen
    │   ├── NotificationSettingsScreen
    │   └── ProfileScreen
    │
    └── [Header icon] WishlistStack
        ├── WishlistScreen  [initial]
        └── GameDetailScreen  { gameId: string }
```

`WishlistStack` y `ProfileScreen` son accesibles desde iconos en el header del `MainTabNavigator`, no como tabs.

---

## `App.tsx` — Punto de entrada

Responsabilidades en orden:

1. `import 'reflect-metadata'` — **debe ser la primera importación** (requerido por Inversify)
2. Inicializa Firebase: `FirebaseConfig.initializeFirebase()`
3. Envuelve con el Provider de Inversify (contexto de DI)
4. Envuelve con `<NavigationContainer>` de React Navigation
5. Renderiza `<RootNavigator />`

```tsx
import 'reflect-metadata'; // ← primera línea, siempre
// ...
export default function App() {
  return (
    <InversifyProvider container={container}>
      <NavigationContainer theme={darkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </InversifyProvider>
  );
}
```

---

## `RootNavigator.tsx`

Observa `AuthViewModel.isAuthenticated` (singleton MobX) para decidir qué stack mostrar. Cuando el usuario hace login o logout, MobX provoca un re-render automático.

```tsx
const RootNavigator = observer(() => {
  const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
  return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
```

---

## `navigationTypes.ts` — Tipado de parámetros

Define los tipos de cada stack para tener seguridad de tipos en `navigation.navigate()` y `route.params`:

```ts
type LibraryStackParamList = {
  Library: undefined;
  GameDetail: { gameId: string };
};

type SettingsStackParamList = {
  Settings: undefined;
  PlatformLink: undefined;
  NotificationSettings: undefined;
  Profile: undefined;
};
// ... AuthStackParamList, SearchStackParamList, WishlistStackParamList
```
