# Presentation — Capa de presentación

## Propósito

Contiene toda la UI de la app. Se divide en dos partes bien separadas: **ViewModels** (lógica de estado, clases puras MobX) y **vistas** (componentes React Native que renderizan los datos del ViewModel).

Depende de `domain/` (entidades, DTOs, interfaces de use cases). No depende de `data/` ni de `di/` directamente — las dependencias llegan inyectadas desde el contenedor.

---

## Estructura

```
presentation/
├── viewmodels/   # Clases MobX puras (sin React)
├── screens/      # Pantallas de React Native (con hooks y observer)
├── components/   # Componentes UI reutilizables (sin lógica de negocio)
└── theme/        # Colores, tipografía y espaciado globales
```

---

## ViewModels (`viewmodels/`)

### Reglas clave

- Son **clases TypeScript puras** con `makeAutoObservable(this)` en el constructor.
- **Nunca** importan React ni usan hooks (`useState`, `useEffect`, etc.).
- **Nunca** acceden a la navegación (eso lo hacen las vistas).
- Exponen **observables** (estado) y **acciones** (métodos que lo modifican).
- Esta separación permite reutilizar los VMs si se migrase a otro framework.

### Patrón de un ViewModel

```ts
@injectable()
class LibraryViewModel {
  games: Game[] = [];          // observable
  isLoading = false;           // observable
  errorMessage: string | null = null;  // observable

  constructor(@inject(TYPES.ILibraryUseCase) private useCase: ILibraryUseCase) {
    makeAutoObservable(this);
  }

  async loadLibrary(userId: string) {  // action (automático con makeAutoObservable)
    this.isLoading = true;
    try {
      const result = await this.useCase.getLibrary(userId);
      this.games = result.games;
    } catch (e) {
      this.errorMessage = (e as Error).message;
    } finally {
      this.isLoading = false;
    }
  }
}
```

### Tabla de ViewModels

| ViewModel | Scope | Observables principales | Acciones principales |
|---|---|---|---|
| `AuthViewModel` | Singleton | `currentUser`, `isAuthenticated` (computed), `isLoading`, `errorMessage` | `login`, `register`, `logout`, `checkAuthState`, `deleteAccount`, `clearError` |
| `LibraryViewModel` | Singleton | `games`, `filteredGames`, `linkedPlatforms`, `isLoading`, `isSyncing`, `searchQuery` | `loadLibrary`, `syncLibrary`, `searchInLibrary`, `clearSearch` |
| `WishlistViewModel` | Singleton | `items`, `isLoading`, `errorMessage` | `loadWishlist`, `addToWishlist`, `removeFromWishlist` |
| `HomeViewModel` | Singleton | `recentlyPlayed`, `mostPlayed`, `searchResults`, `searchQuery`, `isLoadingHome`, `isSearching` | `loadHomeData`, `search`, `clearSearch` |
| `GameDetailViewModel` | Transient | `gameDetail` (GameDetailDTO), `isLoading`, `errorMessage` | `loadGameDetail`, `clear` |
| `SearchViewModel` | Transient | `results`, `query`, `isLoading`, `errorMessage` | `search`, `clearResults` |
| `PlatformLinkViewModel` | Transient | `linkedPlatforms`, `isLinking`, `errorMessage` | `loadLinkedPlatforms`, `linkSteam`, `linkSteamById`, `linkEpicByAuthCode`, `linkEpic`, `getEpicAuthUrl`, `unlinkPlatform`, `clearError` |
| `SettingsViewModel` | Transient | `profile` (UserProfileDTO), `isLoading`, `errorMessage` | `loadProfile`, `updateNotificationPreferences` |

---

## Vistas / Screens (`screens/`)

### Patrón de una vista

```tsx
const LibraryScreen = observer(() => {
  const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
  const { userId } = useInjection<AuthViewModel>(TYPES.AuthViewModel).currentUser!;

  useEffect(() => { vm.loadLibrary(userId); }, []);

  if (vm.isLoading) return <LoadingSpinner />;
  if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} />;

  return (
    <FlatList
      data={vm.filteredGames}
      renderItem={({ item }) => (
        <GameCard {...item} onPress={() => navigation.navigate('GameDetail', { gameId: item.id })} />
      )}
    />
  );
});
```

### Pantallas existentes

| Pantalla | ViewModel(s) | Casos de uso cubiertos |
|---|---|---|
| `auth/LoginScreen` | `AuthViewModel` | UC2 Login |
| `auth/RegisterScreen` | `AuthViewModel` | UC1 Registro |
| `library/LibraryScreen` | `LibraryViewModel` | UC6, UC7, UC8 |
| `search/SearchScreen` | `HomeViewModel` + `WishlistViewModel` | UC9, UC10, Home (recientes, más jugados) |
| `wishlist/WishlistScreen` | `WishlistViewModel` | UC11, UC12 |
| `detail/GameDetailScreen` | `GameDetailViewModel` + `WishlistViewModel` | UC14 |
| `settings/SettingsScreen` | `SettingsViewModel` + `AuthViewModel` | — |
| `settings/PlatformLinkScreen` | `PlatformLinkViewModel` | UC3, UC4, UC16 |
| `settings/NotificationSettingsScreen` | `SettingsViewModel` | UC15 |
| `profile/ProfileScreen` | `AuthViewModel` | UC17 |

---

## Componentes (`components/`)

Componentes funcionales **puros**: reciben datos por props y no acceden a ViewModels directamente.

| Componente | Props principales | Uso |
|---|---|---|
| `GameCard` | `coverUrl`, `title`, `platform?`, `onPress` | Biblioteca (FlatList) |
| `WishlistGameCard` | `coverUrl`, `title`, `discountPercentage?`, `onPress`, `onRemove` | Wishlist |
| `SearchResultCard` | `coverUrl`, `title`, `isInWishlist`, `onPress`, `onToggleWishlist` | Búsqueda |
| `HomeGameCard` | `coverUrl`, `title`, `subtitle?`, `size?`, `onPress` | Home (secciones horizontales) |
| `DealCard` | `storeName`, `price`, `originalPrice`, `discountPercentage`, `onPress` | Detalle de juego |
| `PlatformBadge` | `platform: Platform` | Icono Steam / Epic Games |
| `ProtonDbBadge` | `rating: string \| null` | Rating ProtonDB (platinum/gold/silver/bronze/borked) |
| `HltbInfo` | `mainHours`, `completionistHours` | Duración estimada en detalle |
| `LoadingSpinner` | — | Indicador de carga |
| `ErrorMessage` | `message`, `onRetry?` | Error con botón de reintento |
| `EmptyState` | `message`, `icon?` | Lista vacía |

---

## Tema (`theme/`)

El modo oscuro es el **tema principal** de la app. Todos los componentes importan desde aquí.

| Archivo | Contenido |
|---|---|
| `colors.ts` | Paleta completa: `background: '#121212'`, `surface: '#1E1E1E'`, `primary: '#BB86FC'`, `textPrimary`, `textSecondary`, `error`, etc. |
| `typography.ts` | Estilos de texto: `heading` (24px bold), `body` (16px), `caption` (12px, color secundario) |
| `spacing.ts` | Sistema de espaciado: `xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32` |
