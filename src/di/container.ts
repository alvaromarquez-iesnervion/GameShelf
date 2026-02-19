import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// ─── Interfaces (repositorios) ────────────────────────────────────────────────
import { IAuthRepository } from '../domain/interfaces/repositories/IAuthRepository';
import { IGameRepository } from '../domain/interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../domain/interfaces/repositories/IWishlistRepository';
import { IPlatformRepository } from '../domain/interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../domain/interfaces/repositories/INotificationRepository';

// ─── Interfaces (servicios) ───────────────────────────────────────────────────
import { ISteamApiService } from '../domain/interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../domain/interfaces/services/IEpicGamesApiService';
import { IProtonDbService } from '../domain/interfaces/services/IProtonDbService';
import { IHowLongToBeatService } from '../domain/interfaces/services/IHowLongToBeatService';
import { IIsThereAnyDealService } from '../domain/interfaces/services/IIsThereAnyDealService';

// ─── Interfaces (use cases) ───────────────────────────────────────────────────
import { ILibraryUseCase } from '../domain/interfaces/usecases/library/ILibraryUseCase';
import { IWishlistUseCase } from '../domain/interfaces/usecases/wishlist/IWishlistUseCase';
import { IGameDetailUseCase } from '../domain/interfaces/usecases/games/IGameDetailUseCase';
import { ISearchUseCase } from '../domain/interfaces/usecases/games/ISearchUseCase';
import { IPlatformLinkUseCase } from '../domain/interfaces/usecases/platforms/IPlatformLinkUseCase';
import { ISettingsUseCase } from '../domain/interfaces/usecases/settings/ISettingsUseCase';

// ─── Mocks (fallback cuando no hay API keys configuradas) ────────────────────
import { MockAuthRepository } from '../data/mocks/MockAuthRepository';
import { MockGameRepository } from '../data/mocks/MockGameRepository';
import { MockWishlistRepository } from '../data/mocks/MockWishlistRepository';
import { MockPlatformRepository } from '../data/mocks/MockPlatformRepository';
import { MockNotificationRepository } from '../data/mocks/MockNotificationRepository';
import { MockSteamApiService } from '../data/mocks/MockSteamApiService';
import { MockEpicGamesApiService } from '../data/mocks/MockEpicGamesApiService';
import { MockProtonDbService } from '../data/mocks/MockProtonDbService';
import { MockHowLongToBeatService } from '../data/mocks/MockHowLongToBeatService';
import { MockIsThereAnyDealService } from '../data/mocks/MockIsThereAnyDealService';

// ─── Implementaciones reales (Steam — sin Firebase) ───────────────────────────
import { SteamApiServiceImpl } from '../data/services/SteamApiServiceImpl';
import { MemoryPlatformRepository } from '../data/repositories/MemoryPlatformRepository';
import { SteamSyncMemoryGameRepository } from '../data/repositories/SteamSyncMemoryGameRepository';

// ─── Use case implementations ─────────────────────────────────────────────────
import { LibraryUseCase } from '../domain/usecases/library/LibraryUseCase';
import { WishlistUseCase } from '../domain/usecases/wishlist/WishlistUseCase';
import { GameDetailUseCase } from '../domain/usecases/games/GameDetailUseCase';
import { SearchUseCase } from '../domain/usecases/games/SearchUseCase';
import { PlatformLinkUseCase } from '../domain/usecases/platforms/PlatformLinkUseCase';
import { SettingsUseCase } from '../domain/usecases/settings/SettingsUseCase';

// ─────────────────────────────────────────────────────────────────────────────

const container = new Container({ defaultScope: 'Singleton' });

/**
 * Modos de operación:
 *
 *  MODO MOCK (por defecto — EXPO_PUBLIC_STEAM_API_KEY no está configurada)
 *    → Todos los datos son ficticios. Útil para UI development y demos.
 *
 *  MODO STEAM REAL (EXPO_PUBLIC_STEAM_API_KEY presente en .env)
 *    → ISteamApiService llama a la API real de Steam.
 *    → Los juegos y plataformas se guardan en memoria (se pierden al cerrar la app).
 *    → El resto de servicios siguen siendo mocks.
 *
 *  MODO PRODUCCIÓN COMPLETO (TODO — requiere Firebase configurado)
 *    → AuthRepositoryImpl, GameRepositoryImpl, PlatformRepositoryImpl, etc.
 *    → Ver src/data/repositories/*Impl.ts y src/data/config/FirebaseConfig.ts
 *    → Configurar EXPO_PUBLIC_FIREBASE_* en .env y descomentar bindings abajo.
 */
const steamApiKey = process.env['EXPO_PUBLIC_STEAM_API_KEY'] ?? '';
const useRealSteam = steamApiKey.length > 0;

// ─── Auth, Wishlist, Notificaciones — siempre mocks por ahora ────────────────
// TODO (Firebase): sustituir por AuthRepositoryImpl, WishlistRepositoryImpl, etc.
container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository);
container.bind<IWishlistRepository>(TYPES.IWishlistRepository).to(MockWishlistRepository);
container.bind<INotificationRepository>(TYPES.INotificationRepository).to(MockNotificationRepository);

// ─── Steam / Juegos / Plataformas ─────────────────────────────────────────────
if (useRealSteam) {
    /**
     * MODO STEAM REAL
     * SteamApiServiceImpl llama a:
     *   - IPlayerService/GetOwnedGames/v1  → biblioteca del usuario
     *   - ISteamUser/GetPlayerSummaries/v2 → visibilidad del perfil
     *   - steamcommunity.com/openid/login  → verificación OpenID
     *
     * MemoryPlatformRepository + SteamSyncMemoryGameRepository:
     *   → Sin Firebase, datos en memoria.
     *
     * TODO (Firebase): reemplazar por PlatformRepositoryImpl + GameRepositoryImpl.
     */
    container.bind<ISteamApiService>(TYPES.ISteamApiService).to(SteamApiServiceImpl);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MemoryPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(SteamSyncMemoryGameRepository);
} else {
    // MODO MOCK COMPLETO
    container.bind<ISteamApiService>(TYPES.ISteamApiService).to(MockSteamApiService);
    container.bind<IPlatformRepository>(TYPES.IPlatformRepository).to(MockPlatformRepository);
    container.bind<IGameRepository>(TYPES.IGameRepository).to(MockGameRepository);
}

// ─── Servicios externos — mocks por ahora ─────────────────────────────────────
// TODO: implementar ProtonDbServiceImpl, HowLongToBeatServiceImpl, IsThereAnyDealServiceImpl
container.bind<IEpicGamesApiService>(TYPES.IEpicGamesApiService).to(MockEpicGamesApiService);
container.bind<IProtonDbService>(TYPES.IProtonDbService).to(MockProtonDbService);
container.bind<IHowLongToBeatService>(TYPES.IHowLongToBeatService).to(MockHowLongToBeatService);
container.bind<IIsThereAnyDealService>(TYPES.IIsThereAnyDealService).to(MockIsThereAnyDealService);

// ─── Casos de uso (singleton) ─────────────────────────────────────────────────
container.bind<ILibraryUseCase>(TYPES.ILibraryUseCase).to(LibraryUseCase);
container.bind<IWishlistUseCase>(TYPES.IWishlistUseCase).to(WishlistUseCase);
container.bind<IGameDetailUseCase>(TYPES.IGameDetailUseCase).to(GameDetailUseCase);
container.bind<ISearchUseCase>(TYPES.ISearchUseCase).to(SearchUseCase);
container.bind<IPlatformLinkUseCase>(TYPES.IPlatformLinkUseCase).to(PlatformLinkUseCase);
container.bind<ISettingsUseCase>(TYPES.ISettingsUseCase).to(SettingsUseCase);

// ─── ViewModels ───────────────────────────────────────────────────────────────

// Singleton ViewModels (estado global compartido)
import { AuthViewModel } from '../presentation/viewmodels/AuthViewModel';
import { LibraryViewModel } from '../presentation/viewmodels/LibraryViewModel';
import { WishlistViewModel } from '../presentation/viewmodels/WishlistViewModel';

container.bind<AuthViewModel>(TYPES.AuthViewModel).to(AuthViewModel).inSingletonScope();
container.bind<LibraryViewModel>(TYPES.LibraryViewModel).to(LibraryViewModel).inSingletonScope();
container.bind<WishlistViewModel>(TYPES.WishlistViewModel).to(WishlistViewModel).inSingletonScope();

// Transient ViewModels (instancia nueva por pantalla)
import { GameDetailViewModel } from '../presentation/viewmodels/GameDetailViewModel';
import { SearchViewModel } from '../presentation/viewmodels/SearchViewModel';
import { PlatformLinkViewModel } from '../presentation/viewmodels/PlatformLinkViewModel';
import { SettingsViewModel } from '../presentation/viewmodels/SettingsViewModel';

container.bind<GameDetailViewModel>(TYPES.GameDetailViewModel).to(GameDetailViewModel).inTransientScope();
container.bind<SearchViewModel>(TYPES.SearchViewModel).to(SearchViewModel).inTransientScope();
container.bind<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel).to(PlatformLinkViewModel).inTransientScope();
container.bind<SettingsViewModel>(TYPES.SettingsViewModel).to(SettingsViewModel).inTransientScope();

export { container };
