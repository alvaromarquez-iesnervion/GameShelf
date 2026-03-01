import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// ─── Interfaces (repositorios) ────────────────────────────────────────────────
import { IAuthRepository } from '../domain/interfaces/repositories/IAuthRepository';
import { IGuestSessionRepository } from '../domain/interfaces/repositories/IGuestSessionRepository';
import { IGameRepository } from '../domain/interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../domain/interfaces/repositories/IWishlistRepository';
import { IPlatformRepository } from '../domain/interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../domain/interfaces/repositories/INotificationRepository';

// ─── Interfaces (servicios) ───────────────────────────────────────────────────
import { ISteamApiService } from '../domain/interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../domain/interfaces/services/IEpicGamesApiService';
import { IGogApiService } from '../domain/interfaces/services/IGogApiService';
import { IProtonDbService } from '../domain/interfaces/services/IProtonDbService';
import { IHowLongToBeatService } from '../domain/interfaces/services/IHowLongToBeatService';
import { IIsThereAnyDealService } from '../domain/interfaces/services/IIsThereAnyDealService';

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
import { MockSteamApiService } from '../data/mocks/MockSteamApiService';
import { MockGogApiService } from '../data/mocks/MockGogApiService';

// ─── Implementaciones reales (servicios externos) ─────────────────────────────
import { SteamApiServiceImpl } from '../data/services/SteamApiServiceImpl';
import { EpicGamesApiServiceImpl } from '../data/services/EpicGamesApiServiceImpl';
import { GogApiServiceImpl } from '../data/services/GogApiServiceImpl';
import { ProtonDbServiceImpl } from '../data/services/ProtonDbServiceImpl';
import { HowLongToBeatServiceImpl } from '../data/services/HowLongToBeatServiceImpl';
import { IsThereAnyDealServiceImpl } from '../data/services/IsThereAnyDealServiceImpl';

// ─── Implementaciones reales (repositorios Firebase) ─────────────────────────
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { WishlistRepositoryImpl } from '../data/repositories/WishlistRepositoryImpl';
import { NotificationRepositoryImpl } from '../data/repositories/NotificationRepositoryImpl';
import { PlatformRepositoryImpl } from '../data/repositories/PlatformRepositoryImpl';
import { GameRepositoryImpl } from '../data/repositories/GameRepositoryImpl';
import { getFirebaseAuth, getFirebaseFirestore } from '../data/config/FirebaseConfig';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// ─── Implementaciones para modo invitado (AsyncStorage) ───────────────────────
import { GuestSessionRepository } from '../data/repositories/GuestSessionRepository';
import { LocalPlatformRepository } from '../data/repositories/LocalPlatformRepository';
import { LocalGameRepository } from '../data/repositories/LocalGameRepository';
import { GuestAwarePlatformRepository } from '../data/repositories/GuestAwarePlatformRepository';
import { GuestAwareGameRepository } from '../data/repositories/GuestAwareGameRepository';

// ─── Repositorios en memoria (fallback Steam sin Firebase) ───────────────────
import { MemoryPlatformRepository } from '../data/repositories/MemoryPlatformRepository';
import { SteamSyncMemoryGameRepository } from '../data/repositories/SteamSyncMemoryGameRepository';

// ─── ViewModels ───────────────────────────────────────────────────────────────
import { AuthViewModel } from '../presentation/viewmodels/AuthViewModel';
import { LibraryViewModel } from '../presentation/viewmodels/LibraryViewModel';
import { WishlistViewModel } from '../presentation/viewmodels/WishlistViewModel';
import { HomeViewModel } from '../presentation/viewmodels/HomeViewModel';
import { GameDetailViewModel } from '../presentation/viewmodels/GameDetailViewModel';
import { SearchViewModel } from '../presentation/viewmodels/SearchViewModel';
import { PlatformLinkViewModel } from '../presentation/viewmodels/PlatformLinkViewModel';
import { SettingsViewModel } from '../presentation/viewmodels/SettingsViewModel';

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
 *  MODO PRODUCCIÓN (Firebase + Steam configurados — estado actual)
 *    → Todo usa implementaciones reales con persistencia en Firestore.
 *    → Auth, Wishlist, Notifications, Games, Platforms → Firebase Firestore.
 *    → Steam, Epic, ProtonDB, HLTB, ITAD → APIs reales.
 *
 *  MODO STEAM SIN FIREBASE (solo EXPO_PUBLIC_STEAM_API_KEY configurada)
 *    → Steam API real, juegos y plataformas en memoria (se pierden al cerrar).
 *    → Auth, Wishlist, Notifications → mocks.
 *
 *  MODO MOCK COMPLETO (sin keys)
 *    → Todos los datos son ficticios. Útil para desarrollo de UI sin servicios externos.
 */
const steamApiKey = process.env['EXPO_PUBLIC_STEAM_API_KEY'] ?? '';
const useRealSteam = steamApiKey.length > 0;

const firebaseApiKey = process.env['EXPO_PUBLIC_FIREBASE_API_KEY'] ?? '';
const useFirebase = firebaseApiKey.length > 0;

// ─── Firebase Auth + Firestore — instancias constantes ───────────────────────
if (useFirebase) {
    container.bind<Auth>(TYPES.FirebaseAuth).toDynamicValue(() => getFirebaseAuth());
    container.bind<Firestore>(TYPES.Firestore).toDynamicValue(() => getFirebaseFirestore());
}

// ─── Sesión de invitado (siempre disponible — AsyncStorage local) ─────────────
container.bind<IGuestSessionRepository>(TYPES.IGuestSessionRepository).to(GuestSessionRepository);

// ─── Auth, Wishlist, Notificaciones ──────────────────────────────────────────
if (useFirebase) {
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(AuthRepositoryImpl);
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(WishlistRepositoryImpl);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepositoryImpl);
} else {
    container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository);
    container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(MockWishlistRepository);
    container.bind<INotificationRepository>(TYPES.INotificationRepository).to(MockNotificationRepository);
}

// ─── Steam / Juegos / Plataformas ─────────────────────────────────────────────
if (useFirebase && useRealSteam) {
    // MODO PRODUCCIÓN: todo persiste en Firestore (usuarios autenticados)
    // Los wrappers guest-aware enrutan a AsyncStorage cuando userId empieza por "guest_"
    container.bind<ISteamApiService>(TYPES.ISteamApiService).to(SteamApiServiceImpl);

    // Concretas Firestore bajo símbolos privados
    container.bind<IPlatformRepository>(TYPES.FirestorePlatformRepository).to(PlatformRepositoryImpl);
    container.bind<IGameRepository>(TYPES.FirestoreGameRepository).to(GameRepositoryImpl);
    // Concretas AsyncStorage bajo símbolos privados
    container.bind<IPlatformRepository>(TYPES.LocalPlatformRepository).to(LocalPlatformRepository);
    container.bind<IGameRepository>(TYPES.LocalGameRepository).to(LocalGameRepository);
    // Públicos apuntan a wrappers enrutadores
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(GuestAwarePlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(GuestAwareGameRepository);
} else if (useRealSteam) {
    // MODO STEAM SIN FIREBASE: Steam real, datos en memoria
    container.bind<ISteamApiService>(TYPES.ISteamApiService).to(SteamApiServiceImpl);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MemoryPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(SteamSyncMemoryGameRepository);
} else {
    // MODO MOCK COMPLETO
    container.bind<ISteamApiService>(TYPES.ISteamApiService).to(MockSteamApiService);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MockPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(MockGameRepository);
}

// ─── Servicios externos ───────────────────────────────────────────────────────
// Epic: usar implementación real (no requiere API key, parsea export GDPR)
container.bind<IEpicGamesApiService>(TYPES.IEpicGamesApiService).to(EpicGamesApiServiceImpl);
// GOG: real solo en producción (requiere Cloud Function configurada)
if (useFirebase) {
    container.bind<IGogApiService>(TYPES.IGogApiService).to(GogApiServiceImpl);
} else {
    container.bind<IGogApiService>(TYPES.IGogApiService).to(MockGogApiService);
}
container.bind<IProtonDbService>(TYPES.IProtonDbService).to(ProtonDbServiceImpl);
container.bind<IHowLongToBeatService>(TYPES.IHowLongToBeatService).to(HowLongToBeatServiceImpl);
container.bind<IIsThereAnyDealService>(TYPES.IIsThereAnyDealService).to(IsThereAnyDealServiceImpl);

// ─── Casos de uso (singleton) ─────────────────────────────────────────────────
// Los use cases son TypeScript puro (sin decoradores Inversify). Se construyen
// manualmente con toDynamicValue para respetar la regla de que domain/ no
// debe conocer ningún detalle de infraestructura (di/, inversify, reflect-metadata).
container.bind<IAuthUseCase>(TYPES.IAuthUseCase).toDynamicValue(ctx => new AuthUseCase(
    ctx.get<IAuthRepository>(TYPES.IAuthRepository),
    ctx.get<IGuestSessionRepository>(TYPES.IGuestSessionRepository),
)).inSingletonScope();
container.bind<ILibraryUseCase>(TYPES.ILibraryUseCase).toDynamicValue(ctx => new LibraryUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
)).inSingletonScope();
container.bind<IWishlistUseCase>(TYPES.IWishlistUseCase).toDynamicValue(ctx => new WishlistUseCase(
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
    ctx.get<IIsThereAnyDealService>(TYPES.IIsThereAnyDealService),
)).inSingletonScope();
container.bind<IGameDetailUseCase>(TYPES.IGameDetailUseCase).toDynamicValue(ctx => new GameDetailUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
    ctx.get<IProtonDbService>(TYPES.IProtonDbService),
    ctx.get<IHowLongToBeatService>(TYPES.IHowLongToBeatService),
    ctx.get<IIsThereAnyDealService>(TYPES.IIsThereAnyDealService),
    ctx.get<ISteamApiService>(TYPES.ISteamApiService),
)).inSingletonScope();
container.bind<ISearchUseCase>(TYPES.ISearchUseCase).toDynamicValue(ctx => new SearchUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
)).inSingletonScope();
container.bind<IPlatformLinkUseCase>(TYPES.IPlatformLinkUseCase).toDynamicValue(ctx => new PlatformLinkUseCase(
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<ISteamApiService>(TYPES.ISteamApiService),
    ctx.get<IEpicGamesApiService>(TYPES.IEpicGamesApiService),
    ctx.get<IGogApiService>(TYPES.IGogApiService),
)).inSingletonScope();
container.bind<ISettingsUseCase>(TYPES.ISettingsUseCase).toDynamicValue(ctx => new SettingsUseCase(
    ctx.get<IAuthRepository>(TYPES.IAuthRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
    ctx.get<INotificationRepository>(TYPES.INotificationRepository),
)).inSingletonScope();
container.bind<IHomeUseCase>(TYPES.IHomeUseCase).toDynamicValue(ctx => new HomeUseCase(
    ctx.get<IGameRepository>(TYPES.IGameRepository),
    ctx.get<IPlatformRepository>(TYPES.IPlatformRepository),
    ctx.get<IWishlistRepository>(TYPES.IWishlistRepository),
    ctx.get<ISteamApiService>(TYPES.ISteamApiService),
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

export { container };
