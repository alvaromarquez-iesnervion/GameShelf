import { Container } from 'inversify';
import { TYPES } from './types';

// ─── Interfaces (repositorios) ────────────────────────────────────────────────
import { IAuthRepository } from '../domain/interfaces/repositories/IAuthRepository';
import { IGuestSessionRepository } from '../domain/interfaces/repositories/IGuestSessionRepository';
import { IGameRepository } from '../domain/interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../domain/interfaces/repositories/IWishlistRepository';
import { IPlatformRepository } from '../domain/interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../domain/interfaces/repositories/INotificationRepository';
import { ISettingsRepository } from '../domain/interfaces/repositories/ISettingsRepository';

// ─── Interfaces (servicios) ───────────────────────────────────────────────────
import { IGameShelfApiClient } from '../domain/interfaces/services/IGameShelfApiClient';

// ─── Interfaces (use cases) ───────────────────────────────────────────────────
import { IAuthUseCase } from '../domain/interfaces/usecases/auth/IAuthUseCase';
import { ILibraryUseCase } from '../domain/interfaces/usecases/library/ILibraryUseCase';
import { IWishlistUseCase } from '../domain/interfaces/usecases/wishlist/IWishlistUseCase';
import { IGameDetailUseCase } from '../domain/interfaces/usecases/games/IGameDetailUseCase';
import { ISearchUseCase } from '../domain/interfaces/usecases/games/ISearchUseCase';
import { IPlatformLinkUseCase } from '../domain/interfaces/usecases/platforms/IPlatformLinkUseCase';
import { ISettingsUseCase } from '../domain/interfaces/usecases/settings/ISettingsUseCase';
import { IHomeUseCase } from '../domain/interfaces/usecases/home/IHomeUseCase';

// ─── Mocks (fallback cuando no hay keys configuradas) ────────────────────────
import { MockAuthRepository } from '../data/mocks/MockAuthRepository';
import { MockGameRepository } from '../data/mocks/MockGameRepository';
import { MockWishlistRepository } from '../data/mocks/MockWishlistRepository';
import { MockPlatformRepository } from '../data/mocks/MockPlatformRepository';
import { MockNotificationRepository } from '../data/mocks/MockNotificationRepository';
import { MockGameShelfApiClient } from '../data/mocks/MockGameShelfApiClient';

// ─── Implementaciones reales (servicios externos) ─────────────────────────────
import { GameShelfApiClientImpl } from '../data/services/GameShelfApiClientImpl';

// ─── Implementaciones reales (repositorios) ───────────────────────────────────
import { GameShelfApiGameRepository } from '../data/repositories/GameShelfApiGameRepository';
import { GameShelfApiWishlistRepository } from '../data/repositories/GameShelfApiWishlistRepository';
import { GameShelfApiPlatformRepository } from '../data/repositories/GameShelfApiPlatformRepository';
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { NotificationRepositoryImpl } from '../data/repositories/NotificationRepositoryImpl';
import { SettingsRepositoryImpl } from '../data/repositories/SettingsRepositoryImpl';
import { getFirebaseAuth, getFirebaseFirestore } from '../data/config/FirebaseConfig';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// ─── Implementaciones para modo invitado (AsyncStorage) ───────────────────────
import { GuestSessionRepository } from '../data/repositories/GuestSessionRepository';
import { LocalPlatformRepository } from '../data/repositories/LocalPlatformRepository';
import { LocalGameRepository } from '../data/repositories/LocalGameRepository';
import { GuestAwarePlatformRepository } from '../data/repositories/GuestAwarePlatformRepository';
import { GuestAwareGameRepository } from '../data/repositories/GuestAwareGameRepository';

// ─── ViewModels ───────────────────────────────────────────────────────────────
import { AuthViewModel } from '../presentation/viewmodels/AuthViewModel';
import { LibraryViewModel } from '../presentation/viewmodels/LibraryViewModel';
import { WishlistViewModel } from '../presentation/viewmodels/WishlistViewModel';
import { HomeViewModel } from '../presentation/viewmodels/HomeViewModel';
import { GameDetailViewModel } from '../presentation/viewmodels/GameDetailViewModel';
import { SearchViewModel } from '../presentation/viewmodels/SearchViewModel';
import { PlatformLinkViewModel } from '../presentation/viewmodels/PlatformLinkViewModel';
import { SettingsViewModel } from '../presentation/viewmodels/SettingsViewModel';
import { ProfileViewModel } from '../presentation/viewmodels/ProfileViewModel';
import { UserPreferencesStore } from '../data/utils/UserPreferencesStore';

// ─── Use case implementations ─────────────────────────────────────────────────
import { AuthUseCase } from '../domain/usecases/auth/AuthUseCase';
import { LibraryUseCase } from '../domain/usecases/library/LibraryUseCase';
import { WishlistUseCase } from '../domain/usecases/wishlist/WishlistUseCase';
import { GameDetailUseCase } from '../domain/usecases/games/GameDetailUseCase';
import { SearchUseCase } from '../domain/usecases/games/SearchUseCase';
import { PlatformLinkUseCase } from '../domain/usecases/platforms/PlatformLinkUseCase';
import { SettingsUseCase } from '../domain/usecases/settings/SettingsUseCase';
import { HomeUseCase } from '../domain/usecases/home/HomeUseCase';

// ─────────────────────────────────────────────────────────────────────────────

const container = new Container({ defaultScope: 'Singleton' });

/**
 * Modos de operación:
 *
 *  MODO PRODUCCIÓN (EXPO_PUBLIC_FIREBASE_API_KEY configurada)
 *    → Auth via Firebase. Todos los datos via GameShelf API.
 *    → Invitados usan AsyncStorage local.
 *
 *  MODO MOCK COMPLETO (sin keys)
 *    → Todos los datos son ficticios. Útil para desarrollo de UI sin servicios externos.
 */
const firebaseApiKey = process.env['EXPO_PUBLIC_FIREBASE_API_KEY'] ?? '';
const useFirebase = firebaseApiKey.length > 0;

// ─── Firebase Auth + Firestore — instancias constantes ───────────────────────
if (useFirebase) {
    container.bind<Auth>(TYPES.FirebaseAuth).toDynamicValue(() => getFirebaseAuth());
    container.bind<Firestore>(TYPES.Firestore).toDynamicValue(() => getFirebaseFirestore());
}

// ─── Sesión de invitado (siempre disponible — AsyncStorage local) ─────────────
container.bind<IGuestSessionRepository>(TYPES.IGuestSessionRepository).to(GuestSessionRepository);

// ─── Repositorios principales y cliente API ───────────────────────────────────
if (useFirebase) {
    // MODO PRODUCCIÓN: Auth y notificaciones via Firebase; datos via GameShelf API
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(AuthRepositoryImpl);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepositoryImpl);
    // Cliente central — usa FirebaseAuth para Bearer tokens
    container.bind<IGameShelfApiClient>(TYPES.IGameShelfApiClient).to(GameShelfApiClientImpl).inSingletonScope();
    // Wishlist directa al API (no hay modo invitado para wishlist)
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(GameShelfApiWishlistRepository);
    // Guest-aware: usuarios autenticados → GameShelf API; invitados → AsyncStorage local
    container.bind<IGameRepository>(TYPES.FirestoreGameRepository).to(GameShelfApiGameRepository);
    container.bind<IGameRepository>(TYPES.LocalGameRepository).to(LocalGameRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(GuestAwareGameRepository);
    container.bind<IPlatformRepository>(TYPES.FirestorePlatformRepository).to(GameShelfApiPlatformRepository);
    container.bind<IPlatformRepository>(TYPES.LocalPlatformRepository).to(LocalPlatformRepository);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(GuestAwarePlatformRepository);
    // Settings / country preference
    container.bind<ISettingsRepository>(TYPES.ISettingsRepository).to(SettingsRepositoryImpl);
} else {
    // MODO MOCK COMPLETO
    container.bind<IGameShelfApiClient>(TYPES.IGameShelfApiClient).to(MockGameShelfApiClient).inSingletonScope();
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository);
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(MockWishlistRepository);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(MockNotificationRepository);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MockPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(MockGameRepository);
}

// ─── Casos de uso (singleton) ─────────────────────────────────────────────────
// Los use cases son TypeScript puro (sin decoradores Inversify). Se construyen
// manualmente con toDynamicValue para respetar la regla de que domain/ no
// debe conocer ningún detalle de infraestructura (di/, inversify, reflect-metadata).
container.bind<IAuthUseCase>(TYPES.IAuthUseCase).toDynamicValue(ctx => new AuthUseCase(
    ctx.get<IAuthRepository>(TYPES.IAuthRepository),
    ctx.get<IGuestSessionRepository>(TYPES.IGuestSessionRepository),
    ctx.get<IGameShelfApiClient>(TYPES.IGameShelfApiClient),
)).inSingletonScope();
container.bind<ILibraryUseCase>(TYPES.ILibraryUseCase).toDynamicValue(ctx => new LibraryUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
)).inSingletonScope();
container.bind<IWishlistUseCase>(TYPES.IWishlistUseCase).toDynamicValue(ctx => new WishlistUseCase(
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
)).inSingletonScope();
container.bind<IGameDetailUseCase>(TYPES.IGameDetailUseCase).toDynamicValue(ctx => new GameDetailUseCase(
    ctx.get<IGameShelfApiClient>(TYPES.IGameShelfApiClient),
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
)).inSingletonScope();
container.bind<ISearchUseCase>(TYPES.ISearchUseCase).toDynamicValue(ctx => new SearchUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
)).inSingletonScope();
container.bind<IPlatformLinkUseCase>(TYPES.IPlatformLinkUseCase).toDynamicValue(ctx => new PlatformLinkUseCase(
    ctx.get<IGameShelfApiClient>(TYPES.IGameShelfApiClient),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
)).inSingletonScope();
container.bind<ISettingsUseCase>(TYPES.ISettingsUseCase).toDynamicValue(ctx => new SettingsUseCase(
    ctx.get<IAuthRepository>(TYPES.IAuthRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
    ctx.get<INotificationRepository>(TYPES.INotificationRepository),
)).inSingletonScope();
container.bind<IHomeUseCase>(TYPES.IHomeUseCase).toDynamicValue(ctx => new HomeUseCase(
    ctx.get<IGameShelfApiClient>(TYPES.IGameShelfApiClient),
)).inSingletonScope();

// ─── ViewModels ───────────────────────────────────────────────────────────────

// Singleton ViewModels (estado global compartido)
container.bind<AuthViewModel>(TYPES.AuthViewModel).to(AuthViewModel).inSingletonScope();
container.bind<LibraryViewModel>(TYPES.LibraryViewModel).to(LibraryViewModel).inSingletonScope();
container.bind<WishlistViewModel>(TYPES.WishlistViewModel).to(WishlistViewModel).inSingletonScope();
container.bind<HomeViewModel>(TYPES.HomeViewModel).to(HomeViewModel).inSingletonScope();

// Transient ViewModels (instancia nueva por pantalla)
container.bind<GameDetailViewModel>(TYPES.GameDetailViewModel).to(GameDetailViewModel).inTransientScope();
container.bind<SearchViewModel>(TYPES.SearchViewModel).to(SearchViewModel).inTransientScope();
container.bind<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel).to(PlatformLinkViewModel).inTransientScope();
container.bind<SettingsViewModel>(TYPES.SettingsViewModel).to(SettingsViewModel).inTransientScope();
container.bind<ProfileViewModel>(TYPES.ProfileViewModel).to(ProfileViewModel).inTransientScope();

// ─── User Preferences Store (singleton) ────────────────────────────────────────
container.bind<UserPreferencesStore>(TYPES.UserPreferencesStore).to(UserPreferencesStore).inSingletonScope();

export { container };
