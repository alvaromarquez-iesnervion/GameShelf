# GameShelf — Session Change Log

Most recent first. Never rewrite history — only append.

---

## Session 34 · Mar 2026 — UI consistency + global background gradient (OLED)

**UI-01** Fondo global con gradiente sutil: `AppBackground` envuelve la navegación; `NavigationContainer` + `contentStyle` pasan a `transparent` para dejar ver el fondo.

**UI-02** Tokens de tema: añadidos `colors.backgroundBase`, `colors.backgroundGradientStops`, `colors.brandAuraStops`; tipografía ampliada con `typography.largeTitle`, `typography.inputLarge`, `typography.micro`.

**UI-03** “Screen chrome” unificado: padding superior calculado con `useHeaderHeight()` en `Library/Search/Settings/Wishlist/Profile` y settings sub-screens. Nuevo wrapper `Screen` para estandarizar.

**UI-04** Identidad sutil: `BrandAura` como acento de header (Library/Search) sin depender de assets.

**UI-05** Biblioteca: grid 3 columnas con ancho matemático; `GameCard` + `LibrarySkeleton` ajustados para gutters perfectos.

**UI-06** Fondos opacos eliminados en componentes full-screen (`ErrorMessage`, `LoadingSpinner`, `*Skeleton`) para que el gradiente global no quede tapado.

## Session 33 · Mar 2026 — 15 issues resolved from KNOWN_ISSUES.md

**S-11** `guestUtils.ts` → `generateGuestId()` usa `expo-crypto.randomUUID()` en vez de `Math.random()`.

**D-10** `reset()` añadido a `HomeViewModel`, `LibraryViewModel`, `WishlistViewModel`. `AuthViewModel.logout()` inyecta los 3 singletons y llama `reset()` tras cerrar sesión.

**A-04** `guestUtils` movido a `src/domain/utils/guestUtils.ts`. `core/utils/guestUtils.ts` re-exporta. 5 archivos de data layer actualizados.

**A-06** `IAuthRepository.deleteAccount()` reemplazado por `deleteAuthUser()` + `deleteUserFirestoreData(uid)`. `AuthUseCase` y `SettingsUseCase` orquestan el flujo completo.

**A-07** `ProfileViewModel` creado (`src/presentation/viewmodels/ProfileViewModel.ts`). Agrega `user`, `libraryCount`, `platformCount`, `wishlistCount`. `ProfileScreen` solo inyecta este VM.

**A-08** `ItadGameInfo` movida a `src/domain/dtos/ItadGameInfo.ts`. `IIsThereAnyDealService` la importa y re-exporta.

**A-11** `GogAuthToken` convertida de interface a clase con `isExpired()`. `GogApiServiceImpl` y `GogTokenStore` actualizados.

**N-09** `LocalPlatformRepository.linkGogPlatform()` persiste el token en AsyncStorage. `unlinkPlatform` lo elimina. `getGogToken()` añadido.

**F-05** `LocalGameRepository`: `_cache: Game[] | null` — `readAll()` retorna cache, `writeAll()` lo invalida.

**R-05** `GameCard`: `React.memo` con comparador personalizado (compara platforms por valor).

**X-03** `RootStackParamList` añadido a `navigationTypes.ts`. `MainTabNavigator` tipado.

**C-08** `SettingsScreen`: handlers "Centro de Ayuda" y "Privacidad" muestran `Alert` en lugar de no-op.

**P-01** `SteamSyncMemoryGameRepository.clearUser(userId)` añadido (limpia Maps en-memoria).

**P-03** `SearchScreen`: `Haptics.impactAsync` eliminado del callback debounced.

**P-04** `import 'reflect-metadata'` eliminado de `container.ts` (ya existe en `index.ts`).

**Stubs añadidos a mocks** (para mantener compilación):
- `MockAuthRepository`: `deleteAuthUser()` + `deleteUserFirestoreData()`
- `MockEpicGamesApiService`: `refreshToken()`
- `MockGameRepository`: `getLibraryGamesPage()` + import `LibraryPage`
