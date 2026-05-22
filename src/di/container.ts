import { Container } from 'inversify';
import { TYPES } from './types';

// ─── Interfaces (repositories) ───────────────────────────────────────────────
import { IAuthRepository } from '../domain/interfaces/repositories/IAuthRepository';
import { IGameRepository } from '../domain/interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../domain/interfaces/repositories/IWishlistRepository';
import { IPlatformRepository } from '../domain/interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../domain/interfaces/repositories/INotificationRepository';
import { ISettingsRepository } from '../domain/interfaces/repositories/ISettingsRepository';

// ─── Interfaces (services) ────────────────────────────────────────────────────
import { IGameShelfApiClient } from '../domain/interfaces/services/IGameShelfApiClient';

// ─── Interfaces (use cases) ──────────────────────────────────────────────────
import { IAuthUseCase } from '../domain/interfaces/usecases/auth/IAuthUseCase';
import { ILibraryUseCase } from '../domain/interfaces/usecases/library/ILibraryUseCase';
import { IWishlistUseCase } from '../domain/interfaces/usecases/wishlist/IWishlistUseCase';
import { IGameDetailUseCase } from '../domain/interfaces/usecases/games/IGameDetailUseCase';
import { ISearchUseCase } from '../domain/interfaces/usecases/games/ISearchUseCase';
import { IPlatformLinkUseCase } from '../domain/interfaces/usecases/platforms/IPlatformLinkUseCase';
import { ISettingsUseCase } from '../domain/interfaces/usecases/settings/ISettingsUseCase';
import { IHomeUseCase } from '../domain/interfaces/usecases/home/IHomeUseCase';

// ─── Mocks (fallback when no keys are configured) ────────────────────────────
import { MockAuthRepository } from '../data/mocks/MockAuthRepository';
import { MockGameRepository } from '../data/mocks/MockGameRepository';
import { MockWishlistRepository } from '../data/mocks/MockWishlistRepository';
import { MockPlatformRepository } from '../data/mocks/MockPlatformRepository';
import { MockNotificationRepository } from '../data/mocks/MockNotificationRepository';
import { MockGameShelfApiClient } from '../data/mocks/MockGameShelfApiClient';

// ─── Real implementations (external services) ────────────────────────────────
import { GameShelfApiClientImpl } from '../data/services/GameShelfApiClientImpl';

// ─── Real implementations (repositories) ─────────────────────────────────────
import { GameShelfApiGameRepository } from '../data/repositories/GameShelfApiGameRepository';
import { GameShelfApiWishlistRepository } from '../data/repositories/GameShelfApiWishlistRepository';
import { GameShelfApiPlatformRepository } from '../data/repositories/GameShelfApiPlatformRepository';
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { NotificationRepositoryImpl } from '../data/repositories/NotificationRepositoryImpl';
import { SettingsRepositoryImpl } from '../data/repositories/SettingsRepositoryImpl';
import { getFirebaseAuth, getFirebaseFirestore } from '../data/config/FirebaseConfig';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

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
import { CountryPreferenceServiceImpl } from '../data/services/CountryPreferenceServiceImpl';
import { ICountryPreferenceService } from '../domain/interfaces/usecases/settings/ICountryPreferenceService';
import { PushNotificationService } from '../data/services/PushNotificationService';

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
 * Operation modes:
 *
 *  PRODUCTION MODE (EXPO_PUBLIC_FIREBASE_API_KEY configured)
 *    → Auth via Firebase (includes anonymous sign-in for guests). All data via GameShelf API.
 *
 *  FULL MOCK MODE (no keys)
 *    → All data is fictional. Useful for UI development without external services.
 */
const firebaseApiKey = process.env['EXPO_PUBLIC_FIREBASE_API_KEY'] ?? '';
const useFirebase = firebaseApiKey.length > 0;

// ─── Firebase Auth + Firestore — constant instances ──────────────────────────
if (useFirebase) {
    container.bind<Auth>(TYPES.FirebaseAuth).toDynamicValue(() => getFirebaseAuth());
    container.bind<Firestore>(TYPES.Firestore).toDynamicValue(() => getFirebaseFirestore());
}

// ─── Main repositories and API client ────────────────────────────────────────
if (useFirebase) {
    // PRODUCTION MODE: Auth via Firebase (email + anonymous); data via GameShelf API.
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(AuthRepositoryImpl);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepositoryImpl);
    container.bind<IGameShelfApiClient>(TYPES.IGameShelfApiClient).to(GameShelfApiClientImpl).inSingletonScope();
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(GameShelfApiWishlistRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(GameShelfApiGameRepository);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(GameShelfApiPlatformRepository);
    container.bind<ISettingsRepository>(TYPES.ISettingsRepository).to(SettingsRepositoryImpl);
} else {
    // FULL MOCK MODE
    container.bind<IGameShelfApiClient>(TYPES.IGameShelfApiClient).to(MockGameShelfApiClient).inSingletonScope();
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository);
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(MockWishlistRepository);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(MockNotificationRepository);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MockPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(MockGameRepository);
}

// ─── Use cases (singleton) ────────────────────────────────────────────────────
// Use cases are plain TypeScript (no Inversify decorators). They are wired manually
// with toDynamicValue to enforce the rule that domain/ must not know anything
// about infrastructure (di/, inversify, reflect-metadata).
container.bind<IAuthUseCase>(TYPES.IAuthUseCase).toDynamicValue(ctx => new AuthUseCase(
    ctx.get<IAuthRepository>(TYPES.IAuthRepository),
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

// Singleton ViewModels (shared global state)
container.bind<AuthViewModel>(TYPES.AuthViewModel).to(AuthViewModel).inSingletonScope();
container.bind<LibraryViewModel>(TYPES.LibraryViewModel).to(LibraryViewModel).inSingletonScope();
container.bind<WishlistViewModel>(TYPES.WishlistViewModel).to(WishlistViewModel).inSingletonScope();
container.bind<HomeViewModel>(TYPES.HomeViewModel).to(HomeViewModel).inSingletonScope();

// Transient ViewModels (new instance per screen)
container.bind<GameDetailViewModel>(TYPES.GameDetailViewModel).to(GameDetailViewModel).inTransientScope();
container.bind<SearchViewModel>(TYPES.SearchViewModel).to(SearchViewModel).inTransientScope();
container.bind<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel).to(PlatformLinkViewModel).inTransientScope();
container.bind<SettingsViewModel>(TYPES.SettingsViewModel).to(SettingsViewModel).inTransientScope();
container.bind<ProfileViewModel>(TYPES.ProfileViewModel).to(ProfileViewModel).inTransientScope();

// ─── Country Preference Service (singleton) ────────────────────────────────────
container.bind<ICountryPreferenceService>(TYPES.ICountryPreferenceService).to(CountryPreferenceServiceImpl).inSingletonScope();

// ─── Push Notification Service (singleton) ─────────────────────────────────────
container.bind<PushNotificationService>(TYPES.PushNotificationService).to(PushNotificationService).inSingletonScope();

export { container };
